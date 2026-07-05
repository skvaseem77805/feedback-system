# Student Management Module

## Overview
This module adds an admin-only Student Management section to the existing dashboard. It preserves the current login flows, feedback system, and student/staff experiences while introducing:

- Admin-only student import
- Validation and preview before database writes
- Transaction-based insert/update workflow
- Student table with search, filter, pagination, sorting, edit, delete, view, and export
- Downloadable import template
- Import reporting with counts and timing

## Security
- Frontend access is restricted to admin users only
- Backend APIs require admin authorization headers and return HTTP 403 for unauthorized requests
- Validation happens before any database write
- Database writes are executed inside transactions and rolled back on failure

## Data model
The existing students and student_stats tables are used. New indexes were added for faster filtering and lookup on student data.

## Files added
- app/admin/students/page.tsx
- app/api/admin/students/route.ts
- app/api/admin/students/[id]/route.ts
- app/api/admin/students/import/route.ts
- lib/student-import.ts
- lib/admin-auth.ts

## Notes
- PDF parsing uses the local pdf-parse package and does not rely on any external AI APIs.
- The implementation is production-oriented and keeps the current UI theme intact.
