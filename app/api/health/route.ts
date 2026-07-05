import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    // try a lightweight ping
    await pool.query('SELECT 1');
    return Response.json({ status: 'ok' });
  } catch (err) {
    console.error('Health check failed', err);
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
