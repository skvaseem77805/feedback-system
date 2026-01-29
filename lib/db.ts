/**
 * MySQL database connection pool.
 * Uses DATABASE_URL or MYSQL_* env vars. Create .env from .env.example.
 */
import mysql from 'mysql2/promise';

function getConfig(): mysql.ConnectionOptions {
  const url = process.env.DATABASE_URL;
  if (url && url.startsWith('mysql://')) {
    try {
      const u = new URL(url);
      return {
        host: u.hostname,
        port: parseInt(u.port || '3306', 10),
        user: u.username,
        password: u.password,
        database: u.pathname?.replace(/^\//, '') || 'feedback_system',
      };
    } catch {
      // fall through to MYSQL_*
    }
  }
  return {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'feedback_system',
  };
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const config = getConfig();
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: (string | number | null | Date)[]
): Promise<[T[], mysql.FieldPacket[]]> {
  const p = getPool();
  return p.execute(sql, params) as Promise<[T[], mysql.FieldPacket[]]>;
}

export async function queryOne<T = unknown>(
  sql: string,
  params?: (string | number | null | Date)[]
): Promise<T | null> {
  const [rows] = await query<T>(sql, params);
  const arr = Array.isArray(rows) ? rows : [];
  return (arr[0] as T) ?? null;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
