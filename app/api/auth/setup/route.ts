import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const studentId = (body?.studentId || '').trim().toUpperCase();
        const password = (body?.password || '');

        if (!studentId || !password) {
            return Response.json({ error: 'Student ID and password required' }, { status: 400 });
        }

        if (password.length < 6) {
            return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // 1. Check if user exists and password is NOT set
        const { data: student, error: fetchError } = await supabase
            .from('students')
            .select('id, password_hash')
            .eq('id', studentId)
            .single();

        if (fetchError || !student) {
            return Response.json({ error: 'Student found' }, { status: 404 });
        }

        if (student.password_hash) {
            return Response.json({ error: 'Password already set. Please login or contact admin.' }, { status: 400 });
        }

        // 2. Hash and Update
        const hashedPassword = await hashPassword(password);

        const { error: updateError } = await supabase
            .from('students')
            .update({ password_hash: hashedPassword })
            .eq('id', studentId);

        if (updateError) throw updateError;

        return Response.json({ success: true });
    } catch (e) {
        console.error('POST /api/auth/setup', e);
        return Response.json(
            { error: e instanceof Error ? e.message : 'Database error' },
            { status: 500 }
        );
    }
}
