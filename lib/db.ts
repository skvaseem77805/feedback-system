/**
 * MySQL database connection pool.
 * Uses DATABASE_URL or MYSQL_* env vars. Create .env from .env.example.
 */
import mysql from 'mysql2/promise';

function getConfig(): mysql.ConnectionOptions {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (rawUrl && rawUrl.startsWith('mysql://')) {
    try {
      const u = new URL(rawUrl);
      return {
        host: decodeURIComponent(u.hostname),
        port: parseInt(u.port || '3306', 10),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: decodeURIComponent(u.pathname?.replace(/^\//, '') || 'feedback_system'),
      };
    } catch {
      // fall through to MYSQL_*
    }
  }

  const envOrDefault = (value: string | undefined, fallback: string) =>
    value?.trim() || fallback;

  const port = Number.parseInt(envOrDefault(process.env.MYSQL_PORT, '3306'), 10);
  return {
    host: envOrDefault(process.env.MYSQL_HOST, 'localhost'),
    port: Number.isNaN(port) ? 3306 : port,
    user: envOrDefault(process.env.MYSQL_USER, 'root'),
    password: process.env.MYSQL_PASSWORD?.trim() || '',
    database: envOrDefault(process.env.MYSQL_DATABASE, 'feedback_system'),
  };
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const config = getConfig();
    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONN_LIMIT ?? 20),
      queueLimit: 0,
      // increase connect timeout for cloud hosts
      connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT ?? 10000),
    });
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: (string | number | null | Date)[]
): Promise<[T[], mysql.FieldPacket[]]> {
  const p = getPool();
  const start = Date.now();
  const res = (await p.query(sql, params)) as [T[], mysql.FieldPacket[]];
  const elapsed = Date.now() - start;
  const SLOW_MS = Number(process.env.DB_SLOW_QUERY_MS ?? 200);
  if (elapsed >= SLOW_MS) {
    try {
      // eslint-disable-next-line no-console
      console.warn(`Slow query (${elapsed}ms):`, sql, params ?? []);
    } catch {}
  }
  return res;
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
