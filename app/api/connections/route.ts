import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId')?.trim();
    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    // Fetch all requests involving this student
    const { data: reqList, error } = await supabase
      .from('connection_requests')
      .select('from_student_id, to_student_id, status')
      .or(`from_student_id.eq.${studentId},to_student_id.eq.${studentId}`);

    if (error) throw error;

    const connections: string[] = [];
    const sent: string[] = [];
    const received: string[] = [];

    for (const r of (reqList || [])) {
      const other = r.from_student_id === studentId ? r.to_student_id : r.from_student_id;
      if (r.status === 'accepted') {
        if (!connections.includes(other)) connections.push(other);
      } else if (r.status === 'pending') {
        if (r.from_student_id === studentId) {
          if (!sent.includes(other)) sent.push(other);
        } else {
          if (!received.includes(other)) received.push(other);
        }
      }
    }

    return Response.json({ connections, sent, received });
  } catch (e) {
    console.error('GET /api/connections', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
