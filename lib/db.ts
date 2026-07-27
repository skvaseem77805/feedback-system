/**
 * MySQL database connection pool.
 * Uses DATABASE_URL or MYSQL_* env vars. Create .env from .env.example.
 */
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

function ensureEnvLoaded() {
  if (process.env.MYSQL_HOST || process.env.MYSQLHOST || process.env.DATABASE_URL) {
    return;
  }
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        if (!line || line.trim().startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  } catch {
    // ignore
  }
}

function cleanValue(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^<|>$/g, '');
}

function getConfig(): mysql.ConnectionOptions {
  ensureEnvLoaded();

  let rawUrl = (process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PUBLIC_URL)?.trim();
  if (rawUrl) {
    rawUrl = cleanValue(rawUrl);
    if (rawUrl.startsWith('mysql://')) {
      try {
        const u = new URL(rawUrl);
        let host = decodeURIComponent(u.hostname);
        if (host === 'mysql.railway.internal') {
          host = 'hayabusa.proxy.rlwy.net';
        }
        return {
          host,
          port: parseInt(u.port || '3306', 10),
          user: decodeURIComponent(u.username),
          password: decodeURIComponent(u.password),
          database: decodeURIComponent(u.pathname?.replace(/^\//, '') || 'feedback_system'),
        };
      } catch {
        // fall through to MYSQL_*
      }
    }
  }

  const getEnv = (keyWithUnderscore: string, keyWithoutUnderscore: string, fallback: string) => {
    const val = process.env[keyWithUnderscore] || process.env[keyWithoutUnderscore];
    return cleanValue(val) || fallback;
  };

  let host = getEnv('MYSQL_HOST', 'MYSQLHOST', 'hayabusa.proxy.rlwy.net');
  if (host === 'mysql.railway.internal') {
    host = 'hayabusa.proxy.rlwy.net';
  }

  const portStr = getEnv('MYSQL_PORT', 'MYSQLPORT', '47765');
  const port = Number.parseInt(portStr, 10);

  return {
    host,
    port: Number.isNaN(port) ? 47765 : port,
    user: getEnv('MYSQL_USER', 'MYSQLUSER', 'root'),
    password: cleanValue(process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD),
    database: getEnv('MYSQL_DATABASE', 'MYSQLDATABASE', 'feedback_system'),
  };
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const config = getConfig();
    console.log('--- Resolved MySQL Connection Configuration ---');
    console.log('Host:', config.host);
    console.log('Port:', config.port);
    console.log('User:', config.user);
    console.log('Database:', config.database);
    console.log('------------------------------------------------');

    if (config.host === 'localhost' || config.host === '127.0.0.1' || config.host === 'mysql.railway.internal') {
      console.warn(`[WARNING] Host resolved to '${config.host}'. Ensure public proxy host 'hayabusa.proxy.rlwy.net' is used for remote connection.`);
    }

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

let initPromise: Promise<void> | null = null;

async function ensureTables() {
  const p = getPool();

  // Check and add missing 'views' column in projects table if not exists
  const [cols] = await p.query('DESCRIBE projects') as any;
  const hasViews = cols.some((c: any) => c.Field === 'views');
  if (!hasViews) {
    await p.query('ALTER TABLE projects ADD COLUMN views INT UNSIGNED DEFAULT 0 AFTER likes');
  }

  // Check and add missing 'image_urls' column in projects table if not exists
  const hasImageUrls = cols.some((c: any) => c.Field === 'image_urls');
  if (!hasImageUrls) {
    await p.query('ALTER TABLE projects ADD COLUMN image_urls JSON DEFAULT NULL AFTER thumbnail_url');
  }

  // Check and add missing 'github_url' column in students table if not exists
  const [studentCols] = await p.query('DESCRIBE students') as any;
  const hasGithubUrl = studentCols.some((c: any) => c.Field === 'github_url');
  if (!hasGithubUrl) {
    await p.query('ALTER TABLE students ADD COLUMN github_url VARCHAR(500) DEFAULT NULL AFTER linkedin_url');
  }
  
  await p.query(`
    CREATE TABLE IF NOT EXISTS collaborators (
      id varchar(50) NOT NULL,
      project_id varchar(50) NOT NULL,
      student_id varchar(20) NOT NULL,
      role enum('OWNER','COLLABORATOR') NOT NULL DEFAULT 'COLLABORATOR',
      status enum('PENDING','ACCEPTED','REJECTED') NOT NULL DEFAULT 'PENDING',
      created_at datetime DEFAULT CURRENT_TIMESTAMP,
      updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_reposted tinyint NOT NULL DEFAULT '0',
      PRIMARY KEY (id),
      UNIQUE KEY uq_project_student_collab (project_id, student_id),
      KEY student_id (student_id),
      CONSTRAINT collaborators_ibfk_1 FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      CONSTRAINT collaborators_ibfk_2 FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id varchar(50) NOT NULL,
      receiver_id varchar(20) NOT NULL,
      sender_id varchar(20) NOT NULL,
      project_id varchar(50) DEFAULT NULL,
      type enum('LIKE','SAVE','COLLAB_REQUEST','COLLAB_ACCEPT','COLLAB_REJECT') NOT NULL,
      title varchar(255) NOT NULL,
      message text NOT NULL,
      is_read tinyint(1) NOT NULL DEFAULT '0',
      created_at datetime DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY receiver_id (receiver_id),
      KEY sender_id (sender_id),
      KEY project_id (project_id),
      CONSTRAINT notifications_ibfk_1 FOREIGN KEY (receiver_id) REFERENCES students (id) ON DELETE CASCADE,
      CONSTRAINT notifications_ibfk_2 FOREIGN KEY (sender_id) REFERENCES students (id) ON DELETE CASCADE,
      CONSTRAINT notifications_ibfk_3 FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  // Auto-seed owner collaborator records for existing projects
  await p.query(`
    INSERT IGNORE INTO collaborators (id, project_id, student_id, role, status)
    SELECT CONCAT('collab-owner-', id), id, student_id, 'OWNER', 'ACCEPTED'
    FROM projects
  `);

  // Ensure 'password_hash' and 'email_verified' columns exist in 'students' table
  const [studentsCols] = await p.query('DESCRIBE students') as any;
  const hasPasswordHash = studentsCols.some((c: any) => c.Field === 'password_hash');
  if (!hasPasswordHash) {
    await p.query('ALTER TABLE students ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER avatar');
  }
  const hasEmailVerified = studentsCols.some((c: any) => c.Field === 'email_verified');
  if (!hasEmailVerified) {
    await p.query('ALTER TABLE students ADD COLUMN email_verified TINYINT(1) DEFAULT 0 AFTER password_hash');
  }

  await p.query(`
    CREATE TABLE IF NOT EXISTS otps (
      email VARCHAR(255) PRIMARY KEY,
      otp VARCHAR(6) NOT NULL,
      expiry DATETIME NOT NULL,
      created_time DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id VARCHAR(50) PRIMARY KEY,
      user_role VARCHAR(20) NOT NULL DEFAULT 'student',
      user_id VARCHAR(50) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      is_resolved TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_feedback_created (created_at),
      KEY idx_feedback_user (user_id)
    ) ENGINE=InnoDB
  `);
}

export async function query<T = unknown>(
  sql: string,
  params?: (string | number | null | Date)[]
): Promise<[T[], mysql.FieldPacket[]]> {
  if (!initPromise) {
    initPromise = ensureTables();
  }
  await initPromise;

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
