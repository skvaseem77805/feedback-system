import { query } from '@/lib/db';

export interface ImportBatchRecord {
  id: string;
  file_name: string;
  imported_by: string;
  created_at: string;
  total_records: number;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  duplicate_count: number;
  duration_ms: number;
  status: string;
  import_details?: string;
}

export interface ImportStatsFilter {
  fromDate?: string;
  toDate?: string;
  month?: string;
  year?: string;
}

let tablesInitialized = false;

export async function ensureImportTables() {
  if (tablesInitialized) return;
  try {
    // 1. Create import_batches table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id VARCHAR(64) PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        imported_by VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_records INT DEFAULT 0,
        imported_count INT DEFAULT 0,
        updated_count INT DEFAULT 0,
        skipped_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        duplicate_count INT DEFAULT 0,
        duration_ms INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Completed',
        import_details LONGTEXT
      )
    `);

    // 2. Ensure columns batch_id and import_type on students table
    try {
      await query(`ALTER TABLE students ADD COLUMN batch_id VARCHAR(64) NULL`);
    } catch {
      // Column already exists
    }
    try {
      await query(`ALTER TABLE students ADD COLUMN import_type VARCHAR(50) DEFAULT 'import'`);
    } catch {
      // Column already exists
    }

    tablesInitialized = true;
  } catch (err) {
    console.warn('ensureImportTables warning:', err);
  }
}

export async function generateBatchId(): Promise<string> {
  await ensureImportTables();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `IMP-${dateStr}-`;

  try {
    const [rows] = await query<any>(`
      SELECT id FROM import_batches
      WHERE id LIKE ?
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `, [`${prefix}%`]);

    if (rows && rows.length > 0) {
      const lastId = rows[0].id;
      const parts = lastId.split('-');
      const numPart = parseInt(parts[parts.length - 1] || '0', 10);
      const nextNum = String(numPart + 1).padStart(3, '0');
      return `${prefix}${nextNum}`;
    }
  } catch {
    // Fallback
  }

  return `${prefix}001`;
}

export async function recordImportBatch(batch: {
  id: string;
  file_name: string;
  imported_by: string;
  total_records: number;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  duplicate_count?: number;
  duration_ms: number;
  status?: string;
  import_details?: any;
}) {
  await ensureImportTables();
  const status = batch.status || (batch.failed_count > 0 ? (batch.imported_count > 0 ? 'Partial' : 'Failed') : 'Completed');
  const detailsJson = batch.import_details ? JSON.stringify(batch.import_details) : null;

  await query(`
    INSERT INTO import_batches (
      id, file_name, imported_by, created_at, total_records, imported_count,
      updated_count, skipped_count, failed_count, duplicate_count, duration_ms, status, import_details
    ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      total_records = VALUES(total_records),
      imported_count = VALUES(imported_count),
      updated_count = VALUES(updated_count),
      skipped_count = VALUES(skipped_count),
      failed_count = VALUES(failed_count),
      duplicate_count = VALUES(duplicate_count),
      duration_ms = VALUES(duration_ms),
      status = VALUES(status),
      import_details = VALUES(import_details)
  `, [
    batch.id,
    batch.file_name,
    batch.imported_by,
    batch.total_records,
    batch.imported_count,
    batch.updated_count,
    batch.skipped_count,
    batch.failed_count,
    batch.duplicate_count || 0,
    batch.duration_ms,
    status,
    detailsJson
  ]);
}

export async function getImportStats(filter: ImportStatsFilter) {
  await ensureImportTables();

  let studentWhere = 'WHERE 1=1';
  let batchWhere = 'WHERE 1=1';
  const studentParams: any[] = [];
  const batchParams: any[] = [];

  if (filter.fromDate) {
    studentWhere += ' AND created_at >= ?';
    studentParams.push(`${filter.fromDate} 00:00:00`);
    batchWhere += ' AND created_at >= ?';
    batchParams.push(`${filter.fromDate} 00:00:00`);
  }

  if (filter.toDate) {
    studentWhere += ' AND created_at <= ?';
    studentParams.push(`${filter.toDate} 23:59:59`);
    batchWhere += ' AND created_at <= ?';
    batchParams.push(`${filter.toDate} 23:59:59`);
  }

  if (filter.year) {
    studentWhere += ' AND YEAR(created_at) = ?';
    studentParams.push(filter.year);
    batchWhere += ' AND YEAR(created_at) = ?';
    batchParams.push(filter.year);
  }

  if (filter.month) {
    studentWhere += ' AND MONTH(created_at) = ?';
    studentParams.push(filter.month);
    batchWhere += ' AND MONTH(created_at) = ?';
    batchParams.push(filter.month);
  }

  // 1. Total Registered
  const [regRows] = await query<any>(`SELECT COUNT(*) as count FROM students ${studentWhere}`, studentParams);
  const totalRegistered = Number(regRows?.[0]?.count || 0);

  // 2. Manual Added
  const [manualRows] = await query<any>(`
    SELECT COUNT(*) as count FROM students ${studentWhere} AND import_type = 'manual'
  `, studentParams);
  const manualAdded = Number(manualRows?.[0]?.count || 0);

  // 3. Total Imported
  const [importedRows] = await query<any>(`
    SELECT COUNT(*) as count FROM students ${studentWhere}
    AND (import_type = 'import' OR (batch_id IS NOT NULL AND batch_id != '' AND (import_type IS NULL OR import_type != 'manual')))
  `, studentParams);
  const totalImported = Number(importedRows?.[0]?.count || 0);

  // 4. Today's Registrations & Today's Imports
  const [todayRegRows] = await query<any>(`
    SELECT COUNT(*) as count FROM students WHERE DATE(created_at) = CURDATE()
  `);
  const todayRegistrations = Number(todayRegRows?.[0]?.count || 0);

  const [todayImpRows] = await query<any>(`
    SELECT COUNT(*) as count FROM students
    WHERE DATE(created_at) = CURDATE()
    AND (import_type = 'import' OR (batch_id IS NOT NULL AND batch_id != '' AND (import_type IS NULL OR import_type != 'manual')))
  `);
  const todayImports = Number(todayImpRows?.[0]?.count || 0);

  // 5. Current Month Registrations & Current Month Imports
  const [monthRegRows] = await query<any>(`
    SELECT COUNT(*) as count FROM students
    WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
  `);
  const thisMonthRegistrations = Number(monthRegRows?.[0]?.count || 0);

  const [monthImpRows] = await query<any>(`
    SELECT COUNT(*) as count FROM students
    WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
    AND (import_type = 'import' OR (batch_id IS NOT NULL AND batch_id != '' AND (import_type IS NULL OR import_type != 'manual')))
  `);
  const thisMonthImports = Number(monthImpRows?.[0]?.count || 0);

  // 6. Failed Imports
  const [failedRows] = await query<any>(`
    SELECT COALESCE(SUM(failed_count), 0) as count FROM import_batches ${batchWhere}
  `, batchParams);
  const failedImports = Number(failedRows?.[0]?.count || 0);

  // 7. Daily Chart Data (grouped by date)
  const [dailyRows] = await query<any>(`
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') as date,
      COUNT(*) as total,
      SUM(CASE WHEN import_type = 'manual' THEN 1 ELSE 0 END) as manual,
      SUM(CASE WHEN import_type = 'import' OR (batch_id IS NOT NULL AND batch_id != '' AND (import_type IS NULL OR import_type != 'manual')) THEN 1 ELSE 0 END) as imported
    FROM students
    ${studentWhere}
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY date ASC
    LIMIT 30
  `, studentParams);

  const dailyRegistrations = (dailyRows || []).map((r: any) => ({
    date: r.date,
    total: Number(r.total || 0),
    imported: Number(r.imported || 0),
    manual: Number(r.manual || 0)
  }));

  return {
    totalRegistered,
    totalImported,
    manualAdded,
    todayRegistrations,
    todayImports,
    thisMonthRegistrations,
    thisMonthImports,
    failedImports,
    dailyRegistrations
  };
}

export async function getImportHistory(filter: ImportStatsFilter & { search?: string }) {
  await ensureImportTables();

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (filter.fromDate) {
    where += ' AND created_at >= ?';
    params.push(`${filter.fromDate} 00:00:00`);
  }

  if (filter.toDate) {
    where += ' AND created_at <= ?';
    params.push(`${filter.toDate} 23:59:59`);
  }

  if (filter.year) {
    where += ' AND YEAR(created_at) = ?';
    params.push(filter.year);
  }

  if (filter.month) {
    where += ' AND MONTH(created_at) = ?';
    params.push(filter.month);
  }

  if (filter.search) {
    where += ' AND (id LIKE ? OR file_name LIKE ? OR imported_by LIKE ?)';
    const s = `%${filter.search}%`;
    params.push(s, s, s);
  }

  const [rows] = await query<any>(`
    SELECT 
      id,
      file_name as fileName,
      imported_by as importedBy,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as createdAt,
      total_records as totalRecords,
      imported_count as importedCount,
      updated_count as updatedCount,
      skipped_count as skippedCount,
      failed_count as failedCount,
      duplicate_count as duplicateCount,
      duration_ms as durationMs,
      status,
      import_details as importDetails
    FROM import_batches
    ${where}
    ORDER BY created_at DESC
  `, params);

  return rows || [];
}

export async function deleteImportBatches(batchIds: string[]) {
  await ensureImportTables();
  if (!batchIds || batchIds.length === 0) return { deletedBatches: 0, deletedStudents: 0 };

  const placeholders = batchIds.map(() => '?').join(',');

  // 1. Delete students associated with these batch IDs
  const [studResult] = await query<any>(`
    DELETE FROM students WHERE batch_id IN (${placeholders})
  `, batchIds);

  // 2. Delete batches from import_batches table
  const [batchResult] = await query<any>(`
    DELETE FROM import_batches WHERE id IN (${placeholders})
  `, batchIds);

  return {
    deletedBatches: (batchResult as any)?.affectedRows || 0,
    deletedStudents: (studResult as any)?.affectedRows || 0
  };
}

export async function bulkModifyStudents(params: {
  batchIds?: string[];
  year?: string;
  section?: string;
  branch?: string;
}) {
  await ensureImportTables();
  const { batchIds, year, section, branch } = params;

  if (!batchIds || batchIds.length === 0) {
    return { updatedCount: 0 };
  }

  const updates: string[] = [];
  const sqlParams: any[] = [];

  if (year && year !== 'KEEP_EXISTING') {
    updates.push('year = ?');
    const yearNum = year === '1st' || year === '1' ? 1 : year === '2nd' || year === '2' ? 2 : year === '3rd' || year === '3' ? 3 : 4;
    sqlParams.push(yearNum);
  }

  if (section && section !== 'KEEP_EXISTING') {
    updates.push('section = ?');
    sqlParams.push(section);
  }

  if (branch && branch !== 'KEEP_EXISTING') {
    updates.push('department = ?');
    sqlParams.push(branch);
  }

  if (updates.length === 0) {
    return { updatedCount: 0 };
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');

  const placeholders = batchIds.map(() => '?').join(',');
  sqlParams.push(...batchIds);

  const [res] = await query<any>(`
    UPDATE students
    SET ${updates.join(', ')}
    WHERE batch_id IN (${placeholders})
  `, sqlParams);

  return {
    updatedCount: (res as any)?.affectedRows || 0
  };
}
