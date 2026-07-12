import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const [students] = await pool.query('SELECT COUNT(*) AS count FROM students') as any;
    const [projects] = await pool.query('SELECT COUNT(*) AS count FROM projects') as any;
    const [collaborators] = await pool.query('SELECT COUNT(*) AS count FROM collaborators') as any;
    const [student_stats] = await pool.query('SELECT COUNT(*) AS count FROM student_stats') as any;
    
    return Response.json({
      status: 'ok',
      counts: {
        students: students[0]?.count,
        projects: projects[0]?.count,
        collaborators: collaborators[0]?.count,
        student_stats: student_stats[0]?.count,
      }
    });
  } catch (err: any) {
    console.error('Health check failed', err);
    return Response.json({ status: 'error', details: err?.message || String(err) }, { status: 500 });
  }
}
