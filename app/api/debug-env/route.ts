import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const rawUrl = process.env.DATABASE_URL || '';
    let parsedHost = 'Not set';
    let parsedDb = 'Not set';
    
    if (rawUrl) {
      try {
        const u = new URL(rawUrl);
        parsedHost = u.hostname;
        parsedDb = u.pathname;
      } catch (e: any) {
        parsedHost = 'Error parsing: ' + e.message;
      }
    }

    const pool = getPool();
    
    // Get existing tables
    const [tables] = await pool.query('SHOW TABLES') as any;
    const tableNames = tables.map((t: any) => Object.values(t)[0]);

    // Describe projects table
    const [projectCols] = await pool.query('DESCRIBE projects') as any;
    const projectSchema = projectCols.map((c: any) => ({ Field: c.Field, Type: c.Type }));

    return Response.json({
      env: {
        DATABASE_URL_HOST: parsedHost,
        DATABASE_URL_DB: parsedDb,
        MYSQL_HOST: process.env.MYSQL_HOST || 'Not set',
        MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'Not set',
      },
      tableNames,
      projectSchema,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
