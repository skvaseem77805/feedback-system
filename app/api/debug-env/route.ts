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

    // Try executing collaborators DDL and catch error
    let collabError = 'None';
    try {
      await pool.query(`
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
    } catch (e: any) {
      collabError = e.message;
    }

    return Response.json({
      env: {
        DATABASE_URL_HOST: parsedHost,
        DATABASE_URL_DB: parsedDb,
        MYSQL_HOST: process.env.MYSQL_HOST || 'Not set',
        MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'Not set',
      },
      tableNames,
      collabError,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
