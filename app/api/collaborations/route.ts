import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { parseStudentId } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = parseStudentId(searchParams.get('studentId') || '');

    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    // Query projects where the student is a COLLABORATOR and status is ACCEPTED
    const [rows] = await query<any>(
      `
      SELECT 
        p.id,
        p.title,
        p.category,
        p.thumbnail_url AS thumbnail_url,
        p.uploaded_at AS uploaded_at,
        p.description,
        owner.name AS owner_name,
        owner.id AS owner_id,
        c.role AS collab_role,
        c.updated_at AS date_joined,
        collab_student.skills AS collab_skills
      FROM collaborators c
      INNER JOIN projects p ON p.id = c.project_id
      INNER JOIN students owner ON owner.id = p.student_id
      INNER JOIN students collab_student ON collab_student.id = c.student_id
      WHERE c.student_id = ? 
        AND c.role = 'COLLABORATOR' 
        AND c.status = 'ACCEPTED'
      ORDER BY c.updated_at DESC
      `,
      [studentId]
    );

    const projects = (Array.isArray(rows) ? rows : []).map((r: any) => {
      let skills: string[] = [];
      if (r.collab_skills) {
        try {
          skills = typeof r.collab_skills === 'string' ? JSON.parse(r.collab_skills) : r.collab_skills;
        } catch {
          skills = [];
        }
      }

      // Map role dynamically based on student skills
      const lowercaseSkills = skills.map((s: string) => s.toLowerCase());
      const hasFrontend = lowercaseSkills.some((s: string) => 
        s.includes('react') || s.includes('vue') || s.includes('angular') || 
        s.includes('html') || s.includes('css') || s.includes('frontend') || 
        s.includes('ui') || s.includes('ux') || s.includes('next.js') || s.includes('nextjs')
      );
      const hasBackend = lowercaseSkills.some((s: string) => 
        s.includes('node') || s.includes('express') || s.includes('python') || 
        s.includes('sql') || s.includes('java') || s.includes('backend') || 
        s.includes('django') || s.includes('flask') || s.includes('mongo') || s.includes('c#')
      );

      let mappedRole = 'Collaborator';
      if (hasFrontend && hasBackend) {
        mappedRole = 'Full Stack Developer';
      } else if (hasFrontend) {
        mappedRole = 'Frontend Developer';
      } else if (hasBackend) {
        mappedRole = 'Backend Developer';
      }

      return {
        id: r.id,
        title: r.title,
        category: r.category,
        thumbnailUrl: r.thumbnail_url,
        uploadedAt: r.uploaded_at,
        description: r.description,
        ownerName: r.owner_name,
        ownerId: r.owner_id,
        role: mappedRole,
        dateJoined: r.date_joined,
        status: 'Active', // Default status as requested
      };
    });

    return Response.json(projects);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
