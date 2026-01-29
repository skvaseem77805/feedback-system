-- =============================================================================
-- Feedback System - Seed Data (run after schema.sql)
-- USE feedback_system; first, then run this file in MySQL Workbench.
-- =============================================================================
USE feedback_system;

-- Sample students (from CSE Section E roster)
INSERT INTO students (id, name, registration_no, unique_id, year, course, email, mobile_no, department, section) VALUES
('24B81A05Q5', 'NALLA NEELIMA', '24B81A05Q5', '2024ENG110200265', 2, 'B.Tech- CSE', 'NEELIMAHARI.396@GMAIL.COM', '8125342488', 'CSE', 'E'),
('24B81A05Q6', 'NALLAMELLI SANTHOSH KUMAR', '24B81A05Q6', '2024ENG110200266', 2, 'B.Tech- CSE', '', '9381416675', 'CSE', 'E'),
('24B81A05Q7', 'NALLAMOTHU GANDHARVA NARASIMHA NAIDU', '24B81A05Q7', '2024ENG110200267', 2, 'B.Tech- CSE', '', '9391330166', 'CSE', 'E'),
('24B81A05Q8', 'NALLAPU YASVARDHAN', '24B81A05Q8', '2024ENG110200268', 2, 'B.Tech- CSE', '', '8341011311', 'CSE', 'E'),
('24B81A05Q9', 'NANDA GOPAL KADALI', '24B81A05Q9', '2024ENG110200269', 2, 'B.Tech- CSE', 'siddusiva70600@gmail.com', '7330718747', 'CSE', 'E'),
('24B81A05R0', 'NARRA PALLAVI', '24B81A05R0', '2024ENG110200270', 2, 'B.Tech- CSE', '', '7093307431', 'CSE', 'E'),
('24B81A05R1', 'NAVYACHOWDARY VEGUNTA', '24B81A05R1', '2024ENG110210271', 2, 'B.Tech- CSE', 'navyachowdaryvegunta@gmail.com', '9963869698', 'CSE', 'E'),
('24B81A05R2', 'NELLURI HARSHA SAI VARDHINI', '24B81A05R2', '2024ENG110200272', 2, 'B.Tech- CSE', '', '7207288770', 'CSE', 'E'),
('24B81A05R3', 'NERSU YASASWINI', '24B81A05R3', '2024ENG110210273', 2, 'B.Tech- CSE', '', '9490460457', 'CSE', 'E'),
('24B81A05R4', 'NIMMAGADDA MAHIMA', '24B81A05R4', '2024ENG110200274', 2, 'B.Tech- CSE', 'prasadnimmagadda252@gmail', '9949567799', 'CSE', 'E'),
('24B81A05R5', 'NUTALAPATI HARSHITHA', '24B81A05R5', '2024ENG110200275', 2, 'B.Tech- CSE', 'nharshitha0606@gmail.com', '9391746794', 'CSE', 'E'),
('24B81A05R6', 'NUVVULA VARUN KRISHNA', '24B81A05R6', '2024ENG110210276', 2, 'B.Tech- CSE', 'varunkrishnanuvvula999@gmail.com', '7013739689', 'CSE', 'E'),
('24B81A05R7', 'OGIRALA ARUN KUMAR', '24B81A05R7', '2024ENG110200277', 2, 'B.Tech- CSE', '', '9391342570', 'CSE', 'E'),
('24B81A05R8', 'OMMI HARSHA VARDHAN', '24B81A05R8', '2024ENG110200278', 2, 'B.Tech- CSE', '', '6302283035', 'CSE', 'E'),
('24B81A05R9', 'PADIGA GOPICHAND', '24B81A05R9', '2024ENG110200279', 2, 'B.Tech- CSE', 'padigagopichand548@gmail.', '8688062205', 'CSE', 'E'),
('24B81A05S0', 'PAIDI DURGAPRASAD', '24B81A05S0', '2024ENG110200280', 2, 'B.Tech- CSE', 'paididurgaprasad28@gmail.', '6304739899', 'CSE', 'E'),
('24B81A05S1', 'PALADUGU YAMINI', '24B81A05S1', '2024ENG110200281', 2, 'B.Tech- CSE', '', '9110522687', 'CSE', 'E'),
('24B81A05S2', 'PALLAGANI SNEHA SRI', '24B81A05S2', '2024ENG110200282', 2, 'B.Tech- CSE', '', '9848320679', 'CSE', 'E'),
('24B81A05S3', 'PALLAPOLU NAGA CHARITA', '24B81A05S3', '2024ENG110200283', 2, 'B.Tech- CSE', '', '9989372885', 'CSE', 'E'),
('24B81A05S4', 'PALLAPOTHU JASWANTH KUMAR', '24B81A05S4', '2024ENG110210284', 2, 'B.Tech- CSE', 'jaswanthkumarpallpothu@gmail.com', '9866452793', 'CSE', 'E'),
('24B81A05S5', 'PALLI BHINDU SHALINI', '24B81A05S5', '2024ENG110210285', 2, 'B.Tech- CSE', 'bindushalini79@gmail.com', '6303744797', 'CSE', 'E')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), mobile_no = VALUES(mobile_no);

-- Initialize stats for all seeded students
INSERT INTO student_stats (student_id, projects_uploaded, connections, collaborations)
SELECT id, 0, 0, 0 FROM students
ON DUPLICATE KEY UPDATE student_id = student_id;

-- Sample projects (owned by seeded students)
INSERT INTO projects (id, student_id, title, description, category, likes, uploaded_at) VALUES
('proj1', '24B81A05Q5', 'AI-Powered Study Assistant', 'A web app that helps students organize notes and create study plans', 'Web Development', 234, '2024-01-15 10:00:00'),
('proj2', '24B81A05Q5', 'Real-time Chat Application', 'WebSocket-based chat with user authentication', 'Web Development', 189, '2024-01-10 10:00:00'),
('proj3', '24B81A05Q6', 'Mobile Banking App', 'Cross-platform mobile app with payment integration', 'Mobile App', 156, '2024-01-08 10:00:00')
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), likes = VALUES(likes);

-- Sample project collaborators & likes (optional)
INSERT IGNORE INTO project_collaborators (project_id, student_id) VALUES ('proj1', '24B81A05Q6');
INSERT IGNORE INTO project_likes (project_id, student_id) VALUES ('proj1', '24B81A05Q6'), ('proj1', '24B81A05Q7'), ('proj2', '24B81A05Q6');
INSERT IGNORE INTO project_saves (project_id, student_id) VALUES ('proj1', '24B81A05Q6'), ('proj1', '24B81A05Q7'), ('proj2', '24B81A05Q6'), ('proj3', '24B81A05Q5');

-- Sample connection request (optional)
INSERT IGNORE INTO connection_requests (id, from_student_id, to_student_id, status) VALUES
('conn1', '24B81A05Q5', '24B81A05Q6', 'accepted');
