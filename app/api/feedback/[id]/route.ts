import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { read, resolved } = body;

    const existing = await queryOne<{ id: string }>('SELECT id FROM feedback WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Feedback record not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (typeof read === 'boolean') {
      updates.push('is_read = ?');
      values.push(read ? 1 : 0);
    }

    if (typeof resolved === 'boolean') {
      updates.push('is_resolved = ?');
      values.push(resolved ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No status updates provided' }, { status: 400 });
    }

    values.push(id);

    await query(`UPDATE feedback SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PATCH /api/feedback/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback status', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }

    await query('DELETE FROM feedback WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/feedback/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback record', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
