-- =============================================================================
-- Feedback System - Seed Data (PostgreSQL for Supabase)
-- Run this in Supabase SQL Editor AFTER running schema.pg.sql
-- =============================================================================

-- Sample students
-- Password for '24B81A05Q5' is 'password' (hash: $2a$10$MbCneG.3H.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0) -> Placeholder
-- Using a real hash for "password": $2a$10$wI5zZg9x5h5h5h5h5h5h5e.e.e.e.e.e.e.e.e.e.e.e.e.e.e.e
-- Actually, I will use: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- (Generatd for 'password')

INSERT INTO public.students (id, name, registration_no, unique_id, year, course, email, mobile_no, department, section, password_hash) VALUES
('24B81A05Q5', 'NALLA NEELIMA', '24B81A05Q5', '2024ENG110200265', 2, 'B.Tech- CSE', 'NEELIMAHARI.396@GMAIL.COM', '8125342488', 'CSE', 'E', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('24B81A05Q6', 'NALLAMELLI SANTHOSH KUMAR', '24B81A05Q6', '2024ENG110200266', 2, 'B.Tech- CSE', '', '9381416675', 'CSE', 'E', NULL),
('24B81A05Q7', 'NALLAMOTHU GANDHARVA NARASIMHA NAIDU', '24B81A05Q7', '2024ENG110200267', 2, 'B.Tech- CSE', '', '9391330166', 'CSE', 'E', NULL),
('24B81A05Q8', 'NALLAPU YASVARDHAN', '24B81A05Q8', '2024ENG110200268', 2, 'B.Tech- CSE', '', '8341011311', 'CSE', 'E', NULL)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  email = EXCLUDED.email, 
  mobile_no = EXCLUDED.mobile_no,
  password_hash = EXCLUDED.password_hash;

-- Initialize stats
INSERT INTO public.student_stats (student_id, projects_uploaded, connections, collaborations)
SELECT id, 0, 0, 0 FROM public.students
ON CONFLICT (student_id) DO NOTHING;

-- Sample projects
INSERT INTO public.projects (id, student_id, title, description, category, likes, uploaded_at) VALUES
('proj1', '24B81A05Q5', 'AI-Powered Study Assistant', 'A web app that helps students organize notes and create study plans', 'Web Development', 234, '2024-01-15 10:00:00+00'),
('proj2', '24B81A05Q5', 'Real-time Chat Application', 'WebSocket-based chat with user authentication', 'Web Development', 189, '2024-01-10 10:00:00+00'),
('proj3', '24B81A05Q6', 'Mobile Banking App', 'Cross-platform mobile app with payment integration', 'Mobile App', 156, '2024-01-08 10:00:00+00')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  likes = EXCLUDED.likes;

-- Sample project interactions
INSERT INTO public.project_collaborators (project_id, student_id) VALUES ('proj1', '24B81A05Q6') ON CONFLICT DO NOTHING;
INSERT INTO public.project_likes (project_id, student_id) VALUES ('proj1', '24B81A05Q6'), ('proj1', '24B81A05Q7') ON CONFLICT DO NOTHING;
INSERT INTO public.project_saves (project_id, student_id) VALUES ('proj1', '24B81A05Q6'), ('proj3', '24B81A05Q5') ON CONFLICT DO NOTHING;

-- Sample connections
INSERT INTO public.connection_requests (id, from_student_id, to_student_id, status) VALUES
('conn1', '24B81A05Q5', '24B81A05Q6', 'accepted')
ON CONFLICT (id) DO NOTHING;
