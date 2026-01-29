import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studentId = (body?.studentId ?? body?.student_id ?? '').trim();
    const otherId = (body?.otherStudentId ?? body?.other_student_id ?? '').trim();

    if (!studentId || !otherId) {
      return Response.json({ error: 'studentId and otherStudentId required' }, { status: 400 });
    }

    // Update status to accepted
    const { data: updated, error: updateError } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .match({ from_student_id: otherId, to_student_id: studentId, status: 'pending' })
      .select();

    if (updateError) throw updateError;
    if (!updated || updated.length === 0) {
      return Response.json({ error: 'No pending request found to accept' }, { status: 404 });
    }

    // Update stats for both users
    // Need to increment 'connections' count for both

    // 1. Student ID
    const { data: s1 } = await supabase.from('student_stats').select('connections').eq('student_id', studentId).single();
    await supabase.from('student_stats').upsert({ student_id: studentId, connections: (s1?.connections || 0) + 1 });

    // 2. Other ID
    const { data: s2 } = await supabase.from('student_stats').select('connections').eq('student_id', otherId).single();
    await supabase.from('student_stats').upsert({ student_id: otherId, connections: (s2?.connections || 0) + 1 });

    return Response.json({ accepted: true });
  } catch (e) {
    console.error('POST /api/connections/accept', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
