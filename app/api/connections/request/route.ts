import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const fromId = (body?.fromStudentId ?? body?.from_student_id ?? '').trim();
    const toId = (body?.toStudentId ?? body?.to_student_id ?? '').trim();

    if (!fromId || !toId) {
      return Response.json({ error: 'fromStudentId and toStudentId required' }, { status: 400 });
    }
    if (fromId === toId) {
      return Response.json({ error: 'Cannot send request to self' }, { status: 400 });
    }

    // Check existing
    // We check if a pair exists in either direction
    const { data: existing, error: checkError } = await supabase
      .from('connection_requests')
      .select('status')
      .or(`and(from_student_id.eq.${fromId},to_student_id.eq.${toId}),and(from_student_id.eq.${toId},to_student_id.eq.${fromId})`)
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        return Response.json({ error: 'Already connected', alreadyConnected: true }, { status: 400 });
      }
      if (existing.status === 'pending') {
        return Response.json({ error: 'Request already pending', alreadyPending: true }, { status: 400 });
      }
    }

    const id = `conn-${Date.now()}`;
    const { error: insertError } = await supabase
      .from('connection_requests')
      .insert({ id, from_student_id: fromId, to_student_id: toId, status: 'pending' });

    if (insertError) throw insertError;

    return Response.json({ id, fromStudentId: fromId, toStudentId: toId, status: 'pending' });
  } catch (e) {
    console.error('POST /api/connections/request', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}
