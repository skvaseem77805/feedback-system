import { NextRequest } from 'next/server';
import { parsePositiveInt, parseString } from '@/lib/security';
import { getStudents } from '@/lib/services/students';

function formatYear(year: number): string {
  const m: Record<number, string> = {
    1: '1st',
    2: '2nd',
    3: '3rd',
    4: 'Final',
  };
  return m[year] ?? `${year}th`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parsePositiveInt(searchParams.get('limit'), 100, 0);
    let search = parseString(searchParams.get('search'));
    if (search.length > 100) {
      search = search.slice(0, 100);
    }
    const students = await getStudents({ limit, search: search || undefined });
    return Response.json(students);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}