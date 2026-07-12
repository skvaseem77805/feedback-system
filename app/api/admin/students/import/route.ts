import { NextRequest } from 'next/server';
import { getPool, query } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { buildStudentImportPreviewRows, extractRowsFromPdfText } from '@/lib/student-import';
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

  console.log("=== Student Import POST Entry ===");
  console.log("Headers:", Object.fromEntries(request.headers.entries()));
  console.log("Content-Type:", request.headers.get('content-type'));

  try {
    formData = await request.formData();
    console.log("FormData keys:", [...formData.keys()]);
    file = formData.get('file') as File | null;
    confirm = formData.get('confirm') === 'true';
    console.log("file:", file ? { name: file.name, size: file.size, type: file.type } : null);
    console.log("confirm:", confirm);
  } catch (err) {
    console.warn("Failed to parse request form data", err);
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

  try {
    if (!file) {
      logReturn400("No file provided", ["No file provided"]);
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      logReturn400("File too large", ["File size is " + file.size]);
      return Response.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    const fileType = getFileType(file.name);
    if (fileType === 'unknown') {
      logReturn400("Unsupported file type", ["Unsupported file type"]);
      return Response.json({ error: 'Unsupported file type. Please upload CSV, Excel, or PDF.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let rows: Record<string, unknown>[] = [];

    if (fileType === 'pdf') {
      const text = await parsePdfBuffer(bytes);
      if (!text) {
        logReturn400("Unsupported PDF format", ["Unsupported PDF format - no text extracted"]);
        return Response.json({ error: 'Unsupported PDF format. Please upload a structured student list.' }, { status: 400 });
      }
      rows = extractRowsFromPdfText(text);
      if (rows.length === 0) {
        logReturn400("Unsupported PDF format", ["Unsupported PDF format - 0 parsed rows"]);
        return Response.json({ error: 'Unsupported PDF format. Please upload a structured student list.' }, { status: 400 });
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
      logReturn400("Invalid file format", ["Empty parsed rows"]);
      return Response.json({ error: 'Invalid file format.' }, { status: 400 });
    }

    const firstRow = rows[0];
    const hasRoll = Object.keys(firstRow).some(k => /roll|reg|id/i.test(k));
    const hasName = Object.keys(firstRow).some(k => /name/i.test(k));
    const hasDept = Object.keys(firstRow).some(k => /branch|dept|course/i.test(k));
    const hasYear = Object.keys(firstRow).some(k => /year/i.test(k));
    
    if (!hasRoll || !hasName || !hasDept || !hasYear) {
      logReturn400("Invalid file format", ["Missing required columns: hasRoll=" + hasRoll + ", hasName=" + hasName + ", hasDept=" + hasDept + ", hasYear=" + hasYear]);
      return Response.json({ error: 'Invalid file format.' }, { status: 400 });
    }

    const existingRollNumbers = new Set<string>();
    const [studentRows] = await query<{ id: string }>(`SELECT id FROM students`);
    studentRows.forEach((row) => existingRollNumbers.add(String(row.id).toUpperCase()));

    const preview = buildStudentImportPreviewRows(rows, existingRollNumbers);
    const invalidRows = preview.filter((row) => !row.valid);

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

    if (invalidRows.length > 0) {
      logReturn400("Validation failed", invalidRows.map(r => `Row ${r.rowNumber}: ${r.errors.join(', ')}`), rows.length, preview);
      return Response.json({ error: 'Validation failed. Fix the errors and try again.', details: invalidRows }, { status: 400 });
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

      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      const validItems = preview.filter(item => {
        if (!item.valid) {
          skipped += 1;
          return false;
        }
        if (existingRollNumbers.has(item.rollNumber)) {
          updated += 1;
        } else {
          imported += 1;
        }
        return true;
      });

      const chunkSize = 1000;
      for (let i = 0; i < validItems.length; i += chunkSize) {
        const chunk = validItems.slice(i, i + chunkSize);
        
        const studentValues = chunk.map(item => [
          item.rollNumber,
          item.name,
          item.rollNumber,
          item.rollNumber,
          item.year,
          item.branch,
          item.email || '',
          item.phone || '',
          item.branch,
          'E',
          null
        ]);

        console.log("SQL Query: INSERT INTO students... (Bulk insert chunk size: " + chunk.length + ")");
        console.log("SQL parameters (first item preview):", studentValues[0]);
        await connection.query(
          `
          INSERT INTO students (
            id, name, registration_no, unique_id, year, course, email, mobile_no, department, section, password_hash
          ) VALUES ?
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            year = VALUES(year),
            course = VALUES(course),
            email = VALUES(email),
            mobile_no = VALUES(mobile_no),
            department = VALUES(department),
            section = VALUES(section),
            updated_at = CURRENT_TIMESTAMP
          `,
          [studentValues]
        );

        const statsValues = chunk.map(item => [
          item.rollNumber,
          0,
          0,
          0
        ]);

        console.log("SQL Query: INSERT INTO student_stats... (Bulk insert chunk size: " + chunk.length + ")");
        await connection.query(
          `
          INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations)
          VALUES ?
          ON DUPLICATE KEY UPDATE student_id = student_id
          `,
          [statsValues]
        );
      }

      console.log("Transaction committed? Committing...");
      await connection.commit();
      console.log("Transaction committed? YES");

      return Response.json({
        success: true,
        totalRecords: preview.length,
        imported,
        updated,
        skipped,
        errors,
        timeTakenMs: Date.now() - startedAt,
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
