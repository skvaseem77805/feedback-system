import { NextRequest } from 'next/server';
import { getPool, query } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { buildStudentImportPreviewRows, extractRowsFromPdfText, normalizeRowKeys, toYearLabel } from '@/lib/student-import';
import { validateRegistrationNo } from '@/lib/validation';
import { generateBatchId, recordImportBatch } from '@/lib/services/import-batches';
import * as XLSX from 'xlsx';

function getFileType(fileName: string): 'excel' | 'csv' | 'pdf' | 'unknown' {
  const name = fileName.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel';
  if (name.endsWith('.csv')) return 'csv';
  if (name.endsWith('.pdf')) return 'pdf';
  return 'unknown';
}

function parseCsvText(text: string): Record<string, unknown>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return headers.reduce<Record<string, unknown>>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {});
  });
}

function extractRowsFromFile(file: File, contents: string): Record<string, unknown>[] {
  const fileType = getFileType(file.name);
  if (fileType === 'excel') {
    const workbook = XLSX.read(contents, { type: 'binary' });
    let rows: Record<string, unknown>[] = [];
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[];
      if (sheetRows.length > 0) {
        const firstRowKeys = Object.keys(sheetRows[0]);
        const hasStudentHeaders = firstRowKeys.some(k => 
          /roll|reg|id|name|year|branch|dept/i.test(k)
        );
        if (hasStudentHeaders) {
          rows = sheetRows;
          break;
        }
      }
    }
    if (rows.length === 0 && workbook.SheetNames.length > 0) {
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const sheetRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[];
        if (sheetRows.length > 0) {
          rows = sheetRows;
          break;
        }
      }
    }
    return rows;
  }
  if (fileType === 'csv') {
    return parseCsvText(contents);
  }
  return [];
}

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = await import('pdf-parse');
    const parser = (pdfModule as any).default ?? pdfModule;
    const data = await parser(buffer);
    return typeof data?.text === 'string' ? data.text : '';
  } catch (error) {
    console.warn('PDF parsing unavailable:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let formData: FormData | null = null;
  let file: File | null = null;
  let confirm = false;
  let rows: Record<string, unknown>[] = [];
  let preview: any[] = [];

  console.log("=== Student Import POST Entry ===");
  console.log("Headers:", Object.fromEntries(request.headers.entries()));
  console.log("Content-Type:", request.headers.get('content-type'));

  const contentType = request.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  try {
    if (isJson) {
      const body = await request.json().catch(() => ({}));
      confirm = body.confirm === true || body.confirm === 'true';
      rows = [normalizeRowKeys({
        rollNumber: body.rollNumber,
        name: body.name,
        branch: body.department ?? body.branch ?? '',
        year: body.year,
        email: body.email
      })];
    } else {
      formData = await request.formData();
      console.log("FormData keys:", [...formData.keys()]);
      file = formData.get('file') as File | null;
      confirm = formData.get('confirm') === 'true';
      console.log("file:", file ? { name: file.name, size: file.size, type: file.type } : null);
      console.log("confirm:", confirm);
    }
  } catch (err) {
    console.warn("Failed to parse request data", err);
  }

  const logReturn400 = (reason: string, errors: any[], parsedRowsVal = 0, previewVal: any[] = []) => {
    console.log("RETURNING 400");
    console.log({
      reason,
      receivedBody: formData ? [...formData.entries()].map(([k, v]) => ({ key: k, value: typeof v === 'string' ? v : 'File' })) : [],
      confirm,
      headers: Object.fromEntries(request.headers.entries()),
      fileName: file ? file.name : null,
      parsedRows: parsedRowsVal,
      validRows: previewVal.filter(r => r.valid).length,
      invalidRows: previewVal.filter(r => !r.valid),
      errors
    });
  };

  const send400 = (
    reason: string,
    message: string,
    validationErrors: string[]
  ) => {
    const isDev = process.env.NODE_ENV === 'development';
    
    logReturn400(reason, validationErrors, rows.length, preview);

    const payload: Record<string, any> = {
      success: false,
      reason,
      message,
      receivedConfirm: String(confirm),
      receivedFile: file ? file.name : 'null',
      parsedRows: rows.length,
      validRows: preview.filter(r => r.valid).length,
      invalidRows: preview.filter(r => !r.valid).length,
      validationErrors
    };

    if (isDev) {
      payload.stack = new Error(reason).stack || '';
    }

    console.error("HTTP 400 Bad Request Payload:", payload);

    return Response.json(payload, { status: 400 });
  };

  try {
    if (!isJson) {
      if (!file) {
        return send400("No file provided", "No file provided", ["No file provided"]);
      }

      if (file.size > 10 * 1024 * 1024) {
        return send400(
          "File too large",
          "File too large. Maximum size is 10MB.",
          ["File size is " + file.size]
        );
      }

      const fileType = getFileType(file.name);
      if (fileType === 'unknown') {
        return send400(
          "Unsupported file type",
          "Unsupported file type. Please upload CSV, Excel, or PDF.",
          ["Unsupported file type"]
        );
      }

      const bytes = Buffer.from(await file.arrayBuffer());

      if (fileType === 'pdf') {
        const text = await parsePdfBuffer(bytes);
        if (!text) {
          return send400(
            "Unsupported PDF format",
            "Unsupported PDF format. Please upload a structured student list.",
            ["Unsupported PDF format - no text extracted"]
          );
        }
        rows = extractRowsFromPdfText(text);
        if (rows.length === 0) {
          return send400(
            "Unsupported PDF format",
            "Unsupported PDF format. Please upload a structured student list.",
            ["Unsupported PDF format - 0 parsed rows"]
          );
        }
      } else {
        const contents = bytes.toString('binary');
        rows = extractRowsFromFile(file, contents);
      }

      console.log("Parsed row count:", rows.length);

      // Skip completely empty rows
      rows = rows.filter(row => Object.values(row).some(val => String(val ?? '').trim() !== ''));

      console.log("Parsed row count (excluding empty rows):", rows.length);

      if (rows.length === 0) {
        return send400("Invalid file format", "Invalid file format.", ["Empty parsed rows"]);
      }

      console.log("FIRST PARSED OBJECT IMMEDIATELY AFTER PARSING:");
      console.log(rows[0]);
      console.log("ALL KEYS OF THE FIRST PARSED ROW:");
      console.log(Object.keys(rows[0]));

      rows = rows.map(row => normalizeRowKeys(row));

      const firstRow = rows[0];
      const hasRoll = Object.keys(firstRow).some(k => /roll|reg|id/i.test(k));
      const hasName = Object.keys(firstRow).some(k => /name/i.test(k));
      const hasDept = Object.keys(firstRow).some(k => /branch|dept|course/i.test(k));
      const hasYear = Object.keys(firstRow).some(k => /year/i.test(k));
      
      if (!hasRoll || !hasName || !hasDept || !hasYear) {
        return send400(
          "Invalid file format",
          "Invalid file format.",
          ["Missing required columns: hasRoll=" + hasRoll + ", hasName=" + hasName + ", hasDept=" + hasDept + ", hasYear=" + hasYear]
        );
      }
    }

    const existingRollNumbers = new Set<string>();
    const [studentRows] = await query<{ id: string }>(`SELECT id FROM students`);
    studentRows.forEach((row) => existingRollNumbers.add(String(row.id).toUpperCase()));

    preview = buildStudentImportPreviewRows(rows, existingRollNumbers);
    const invalidRows = preview.filter((row) => !row.valid);

    if (isJson) {
      if (invalidRows.length > 0) {
        return send400(
          "Validation failed",
          invalidRows[0].errors.join(', '),
          invalidRows.map(r => `Row ${r.rowNumber}: ${r.errors.join(', ')}`)
        );
      }
      if (preview.some(r => r.existing)) {
        return send400(
          "Duplicate check failed",
          "Student already exists. Do not create duplicates.",
          ["Student already exists. Do not create duplicates."]
        );
      }
    }

    console.log("Valid row count:", preview.filter(r => r.valid).length);
    console.log("Invalid row count:", invalidRows.length);
    if (invalidRows.length > 0) {
      console.log("INVALID ROWS AND ERRORS DETECTED:");
      invalidRows.forEach(r => {
        console.log(`Row ${r.rowNumber}: ${r.errors.join(', ')}`);
      });
    }

    if (!confirm) {
      return Response.json({
        preview,
        total: preview.length,
        invalidCount: invalidRows.length,
        message: 'Preview generated successfully',
      });
    }

    console.log("Database connection status: Connecting...");
    const pool = getPool();
    const connection = await pool.getConnection();
    console.log("Database connection status: Connected");
    const startedAt = Date.now();

    try {
      console.log("Transaction started? Starting...");
      await connection.beginTransaction();
      console.log("Transaction started? YES");

      // Extract unique roll numbers to query
      const rollNumbersToQuery = Array.from(new Set(rows.map(r => {
        const normalized = normalizeRowKeys(r);
        const roll = typeof normalized.rollNumber === 'string' 
          ? normalized.rollNumber.trim().toUpperCase().replace(/[^A-Z0-9._-]/g, '') 
          : '';
        return roll;
      }).filter(Boolean)));

      let existingStudents: any[] = [];
      if (rollNumbersToQuery.length > 0) {
        const [dbRows] = await connection.query(
          'SELECT id, name, year, course, email, mobile_no, department, section FROM students WHERE id IN (?)',
          [rollNumbersToQuery]
        );
        existingStudents = dbRows as any[];
      }
      const existingMap = new Map<string, any>();
      existingStudents.forEach(s => {
        existingMap.set(String(s.id).toUpperCase(), s);
      });

      // Get all emails from DB to check for duplicate emails
      const [allEmailsRows] = await connection.query(
        'SELECT id, email FROM students WHERE email IS NOT NULL AND email != ""'
      );
      const dbEmailMap = new Map<string, string>();
      (allEmailsRows as any[]).forEach(r => {
        if (r.email) {
          dbEmailMap.set(String(r.email).trim().toLowerCase(), String(r.id).toUpperCase());
        }
      });

      const importedList: any[] = [];
      const updatedList: any[] = [];
      const skippedList: any[] = [];
      const errorsList: any[] = [];

      const seenRollNumbers = new Set<string>();
      const seenEmails = new Set<string>();

      for (const rawRow of rows) {
        // Check if row is completely empty
        const isEmpty = !Object.values(rawRow).some(val => String(val ?? '').trim() !== '');
        if (isEmpty) {
          skippedList.push({
            rollNo: '',
            name: '',
            email: '',
            branch: '',
            year: '',
            reason: 'Empty Row'
          });
          continue;
        }

        const normalizedRow = normalizeRowKeys(rawRow);
        const rawRoll = String(normalizedRow.rollNumber ?? '').trim();
        const rollNo = rawRoll.toUpperCase().replace(/[^A-Z0-9._-]/g, '');
        const name = String(normalizedRow.name ?? '').trim();
        const branch = String(normalizedRow.branch ?? '').trim().replace(/\s+/g, ' ');

        // Normalize year
        const rawYear = String(normalizedRow.year ?? '').trim().toLowerCase().replace(/\s+/g, '');
        let yearNum: number | null = null;
        let yearLabel = '';
        const yearMapping: Record<string, number> = {
          '1': 1, '1st': 1, 'first': 1,
          '2': 2, '2nd': 2, 'second': 2,
          '3': 3, '3rd': 3, 'third': 3,
          '4': 4, '4th': 4, 'final': 4, 'finalyear': 4
        };
        if (yearMapping[rawYear] !== undefined) {
          yearNum = yearMapping[rawYear];
          yearLabel = toYearLabel(yearNum);
        } else {
          const numeric = Number.parseInt(rawYear, 10);
          if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 4) {
            yearNum = numeric;
            yearLabel = toYearLabel(yearNum);
          }
        }

        const email = String(normalizedRow.email ?? '').trim().toLowerCase();
        const phone = String(normalizedRow.phone ?? '').trim();
        const section = String(normalizedRow.section ?? 'E').trim();

        const validation = validateRegistrationNo(rollNo);

        // Determine structural/validation errors
        let errorReason = '';
        if (!rawRoll || !rollNo) {
          errorReason = 'Roll Number Missing';
        } else if (!validation.isValid) {
          errorReason = 'Invalid Registration Number';
        } else if (!name) {
          errorReason = 'Name Missing';
        } else if (normalizedRow.year === undefined || normalizedRow.year === null || String(normalizedRow.year).trim() === '') {
          errorReason = 'Required Field Missing';
        } else if (!yearNum) {
          errorReason = 'Invalid Year';
        } else if (normalizedRow.branch === undefined || normalizedRow.branch === null || String(normalizedRow.branch).trim() === '') {
          errorReason = 'Required Field Missing';
        } else if (!branch) {
          errorReason = 'Invalid Branch';
        } else if (email && email !== 'null' && email !== 'undefined') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorReason = 'Invalid Email';
          }
        }

        if (errorReason) {
          errorsList.push({
            rollNo: rollNo || rawRoll || '',
            name: name || '',
            email: email || '',
            branch: branch || '',
            year: yearLabel || String(normalizedRow.year || ''),
            reason: errorReason
          });
          continue;
        }

        // Duplicate checks
        if (seenRollNumbers.has(rollNo)) {
          skippedList.push({
            rollNo,
            name,
            email,
            branch,
            year: yearLabel,
            reason: 'Duplicate Roll Number'
          });
          continue;
        }
        seenRollNumbers.add(rollNo);

        if (email && email !== 'null' && email !== 'undefined') {
          if (seenEmails.has(email)) {
            skippedList.push({
              rollNo,
              name,
              email,
              branch,
              year: yearLabel,
              reason: 'Duplicate Email'
            });
            continue;
          }
          seenEmails.add(email);

          if (dbEmailMap.has(email) && dbEmailMap.get(email) !== rollNo) {
            skippedList.push({
              rollNo,
              name,
              email,
              branch,
              year: yearLabel,
              reason: 'Duplicate Email'
            });
            continue;
          }
        }

        if (!existingMap.has(rollNo)) {
          importedList.push({
            rollNo,
            name,
            email,
            branch,
            year: yearLabel,
            importedAt: new Date().toISOString(),
            rawValues: {
              rollNumber: rollNo,
              name,
              year: yearNum,
              branch,
              email,
              phone,
              section
            }
          });
        } else {
          const dbStudent = existingMap.get(rollNo);
          const changes: any[] = [];

          if (dbStudent.name !== name) {
            changes.push({ field: 'Student Name', oldValue: dbStudent.name, newValue: name });
          }
          if (Number(dbStudent.year) !== yearNum) {
            changes.push({ field: 'Year', oldValue: toYearLabel(Number(dbStudent.year)), newValue: yearLabel });
          }
          if (dbStudent.department !== branch) {
            changes.push({ field: 'Branch', oldValue: dbStudent.department, newValue: branch });
          }
          if ((dbStudent.email || '') !== email) {
            changes.push({ field: 'Email', oldValue: dbStudent.email || '', newValue: email });
          }
          if ((dbStudent.mobile_no || '') !== phone) {
            changes.push({ field: 'Phone', oldValue: dbStudent.mobile_no || '', newValue: phone });
          }
          if (dbStudent.section !== section) {
            changes.push({ field: 'Section', oldValue: dbStudent.section, newValue: section });
          }

          if (changes.length === 0) {
            skippedList.push({
              rollNo,
              name,
              email,
              branch,
              year: yearLabel,
              reason: 'Already Exists'
            });
          } else {
            updatedList.push({
              rollNo,
              name,
              updatedAt: new Date().toISOString(),
              changes,
              rawValues: {
                rollNumber: rollNo,
                name,
                year: yearNum,
                branch,
                email,
                phone,
                section
              }
            });
          }
        }
      }

      // Generate unique Batch ID for this import session
      const batchId = await generateBatchId();
      const importType = isJson ? 'manual' : 'import';

      // Execute SQL operations inside transaction
      if (importedList.length > 0) {
        const chunkSize = 1000;
        for (let i = 0; i < importedList.length; i += chunkSize) {
          const chunk = importedList.slice(i, i + chunkSize);
          const studentValues = chunk.map(item => [
            item.rawValues.rollNumber,
            item.rawValues.name,
            item.rawValues.rollNumber,
            item.rawValues.year,
            item.rawValues.branch,
            item.rawValues.email || '',
            item.rawValues.phone || '',
            item.rawValues.branch,
            item.rawValues.section || 'E',
            null,
            batchId,
            importType
          ]);

          await connection.query(
            `
            INSERT INTO students (
              id, name, registration_no, year, course, email, mobile_no, department, section, password_hash, batch_id, import_type
            ) VALUES ?
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              year = VALUES(year),
              course = VALUES(course),
              email = VALUES(email),
              mobile_no = VALUES(mobile_no),
              department = VALUES(department),
              section = VALUES(section),
              batch_id = VALUES(batch_id),
              import_type = VALUES(import_type),
              updated_at = CURRENT_TIMESTAMP
            `,
            [studentValues]
          );

          const rollNos = chunk.map(item => item.rawValues.rollNumber);
          const [idRows] = await connection.query(
            'SELECT id, registration_no FROM students WHERE registration_no IN (?)',
            [rollNos]
          );

          const regToIdMap = new Map<string, string | number>();
          if (Array.isArray(idRows)) {
            idRows.forEach((r: any) => {
              regToIdMap.set(r.registration_no, r.id);
            });
          }

          const statsValues = chunk.map(item => {
            const actualId = regToIdMap.get(item.rawValues.rollNumber) || item.rawValues.rollNumber;
            return [
              actualId,
              0,
              0,
              0
            ];
          });

          await connection.query(
            `
            INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations)
            VALUES ?
            ON DUPLICATE KEY UPDATE student_id = student_id
            `,
            [statsValues]
          );
        }
      }

      // Update changed students individually
      for (const item of updatedList) {
        await connection.query(
          `
          UPDATE students SET
            name = ?,
            year = ?,
            course = ?,
            email = ?,
            mobile_no = ?,
            department = ?,
            section = ?,
            batch_id = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `,
          [
            item.rawValues.name,
            item.rawValues.year,
            item.rawValues.branch,
            item.rawValues.email || '',
            item.rawValues.phone || '',
            item.rawValues.branch,
            item.rawValues.section || 'E',
            batchId,
            item.rawValues.rollNumber
          ]
        );
      }

      console.log("Transaction committed? Committing...");
      await connection.commit();
      console.log("Transaction committed? YES");

      // Strip rawValues before returning response
      const cleanImported = importedList.map(({ rawValues, ...rest }) => rest);
      const cleanUpdated = updatedList.map(({ rawValues, ...rest }) => rest);
      const cleanSkipped = skippedList;
      const cleanErrors = errorsList;
      const durationMs = Date.now() - startedAt;

      // Record batch in import_batches table
      await recordImportBatch({
        id: batchId,
        file_name: file ? file.name : (isJson ? 'Manual Entry' : 'Student Import'),
        imported_by: request.headers.get('x-admin-email') || 'Admin',
        total_records: rows.length,
        imported_count: cleanImported.length,
        updated_count: cleanUpdated.length,
        skipped_count: cleanSkipped.length,
        failed_count: cleanErrors.length,
        duration_ms: durationMs,
        status: cleanErrors.length > 0 ? (cleanImported.length > 0 ? 'Partial' : 'Failed') : 'Completed',
        import_details: {
          imported: cleanImported,
          updated: cleanUpdated,
          skipped: cleanSkipped,
          errors: cleanErrors
        }
      });

      return Response.json({
        success: true,
        batchId,
        totalRecords: rows.length,
        importedCount: cleanImported.length,
        updatedCount: cleanUpdated.length,
        skippedCount: cleanSkipped.length,
        errorsCount: cleanErrors.length,
        imported: cleanImported,
        updated: cleanUpdated,
        skipped: cleanSkipped,
        errors: cleanErrors,
        timeTakenMs: durationMs,
      });
    } catch (error: any) {
      console.log("Transaction committed? NO");
      console.log("Transaction rolled back? Rolling back...");
      await connection.rollback();
      console.log("Transaction rolled back? YES");

      console.log("SQL Error Details:");
      console.log("Error Message:", error?.message);
      console.log("Error Code:", error?.code);
      console.log("Error Number:", error?.errno);
      console.log("SQL State:", error?.sqlState);
      console.log("SQL Query:", error?.sql);

      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("General Handler Error:", error);
    return Response.json({ error: 'Import failed' }, { status: 500 });
  }
}
