import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sid = (id || '').trim().toUpperCase();
    if (!sid) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from('students')
      .select('id, name, registration_no, unique_id, year, course, email, mobile_no, department, section, linkedin_url, bio, skills, avatar')
      .eq('id', sid)
      .single();

    if (error || !row) {
      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
        return Response.json({ error: 'Database error', details: error.message }, { status: 500 });
      }
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const academicYear = formatYear(row.year);

    // Supabase returns JSONB columns as parsed objects/arrays
    const skills = row.skills;

    return Response.json({
      id: row.id,
      userId: row.id,
      name: row.name,
      registrationNo: row.registration_no,
      uniqueId: row.unique_id,
      year: row.year,
      course: row.course,
      email: row.email || '',
      mobileNo: row.mobile_no || '',
      department: row.department || 'CSE',
      section: row.section || 'E',
      linkedinUrl: row.linkedin_url ?? undefined,
      bio: row.bio ?? undefined,
      skills: Array.isArray(skills) ? skills : (typeof skills === 'string' ? JSON.parse(skills) : undefined),
      avatar: row.avatar ?? undefined,
      academicYear,
    });
  } catch (e) {
    console.error('GET /api/students/[id]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Database error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const sid = (id || '').trim().toUpperCase();

    // Basic validation
    if (!sid) {
      return Response.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Filter allowed fields only. Explicitly ignoring 'name', 'department', 'registration_no'.
    // Allowed: email, linkedinUrl (mapped to linkedin_url), bio, avatar (profilePhoto), mobileNo (mobile_no), academicYear/year
    const updates: any = {};

    if (body.email !== undefined) updates.email = body.email;
    if (body.linkedinUrl !== undefined) updates.linkedin_url = body.linkedinUrl;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.avatar !== undefined || body.profilePhoto !== undefined) updates.avatar = body.avatar || body.profilePhoto;
    if (body.mobileNo !== undefined) updates.mobile_no = body.mobileNo;

    // Support updating academic year. The front-end sends 'academicYear' (strings like '1st','2nd','3rd','final').
    if (body.academicYear !== undefined) {
      const mapping: Record<string, number> = {
        '1st': 1,
        '2nd': 2,
        '3rd': 3,
        'final': 4,
        '4th': 4,
        'Final': 4,
      };
      const val = typeof body.academicYear === 'string' ? body.academicYear.trim() : String(body.academicYear);
      const mapped = mapping[val] ?? (Number(val) || undefined);
      if (mapped) updates.year = mapped;
    }

    // Also allow numeric 'year' to be passed directly
    if (body.year !== undefined) {
      const y = Number(body.year);
      if (!Number.isNaN(y) && y > 0) updates.year = y;
    }

    // Support updating skills - expect an array of strings (or JSON string)
    if (body.skills !== undefined) {
      if (Array.isArray(body.skills)) {
        updates.skills = body.skills;
      } else if (typeof body.skills === 'string') {
        try {
          updates.skills = JSON.parse(body.skills);
        } catch {
          updates.skills = [String(body.skills)];
        }
      }
    }

    // Check if there's anything to update
    if (Object.keys(updates).length === 0) {
      return Response.json({ message: 'No valid fields to update' });
    }

    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', sid);

    if (error) {
      console.error('Supabase PATCH error:', error);
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Profile updated' });

  } catch (e) {
    console.error('PATCH /api/students/[id]', e);
    return Response.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}

function formatYear(year: number): string {
  const m: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: 'Final' };
  return m[year] ?? `${year}th`;
}
