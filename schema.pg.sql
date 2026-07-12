-- =============================================================================
-- Feedback System - PostgreSQL Schema for Supabase
-- Run this script in the Supabase SQL Editor.
-- =============================================================================

-- Enable UUID extension (optional, using varchar for IDs to match existing, but UUID is better for logic)
-- We will stick to the existing ID format (strings) to minimize application changes.

-- -----------------------------------------------------------------------------
-- Students (college roster + profile fields)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
  id VARCHAR(20) PRIMARY KEY, -- Registration no / userId
  name VARCHAR(255) NOT NULL,
  registration_no VARCHAR(20) NOT NULL UNIQUE,
  unique_id VARCHAR(50),
  year SMALLINT NOT NULL DEFAULT 2,
  course VARCHAR(100),
  email VARCHAR(255) DEFAULT '',
  mobile_no VARCHAR(20) DEFAULT '',
  department VARCHAR(50) DEFAULT 'CSE',
  section VARCHAR(10) DEFAULT 'E',
  linkedin_url VARCHAR(500) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  skills JSONB DEFAULT NULL, -- Changed from JSON to JSONB
  avatar VARCHAR(500) DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index creation
CREATE INDEX IF NOT EXISTS idx_students_department ON public.students (department);
CREATE INDEX IF NOT EXISTS idx_students_year ON public.students (year);
CREATE INDEX IF NOT EXISTS idx_students_section ON public.students (section);
CREATE INDEX IF NOT EXISTS idx_students_registration ON public.students (registration_no);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students (email);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students (name);

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  likes INT DEFAULT 0,
  views INT DEFAULT 0,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  file_size BIGINT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_views (
  project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  viewer_token VARCHAR(128) NOT NULL DEFAULT '',
  viewer_student_id VARCHAR(20) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, viewer_token, viewer_student_id)
);

CREATE INDEX IF NOT EXISTS idx_project_views_project ON public.project_views (project_id);
CREATE INDEX IF NOT EXISTS idx_project_views_token ON public.project_views (viewer_token);
CREATE INDEX IF NOT EXISTS idx_project_views_student ON public.project_views (viewer_student_id);

CREATE INDEX IF NOT EXISTS idx_projects_student ON public.projects (student_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects (category);
CREATE INDEX IF NOT EXISTS idx_projects_uploaded ON public.projects (uploaded_at);

-- -----------------------------------------------------------------------------
-- Project likes (student liked project)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_likes (
  project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, student_id)
);

-- -----------------------------------------------------------------------------
-- Project saves (student saved project)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_saves (
  project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, student_id)
);

-- -----------------------------------------------------------------------------
-- Project collaborators
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, student_id)
);

-- -----------------------------------------------------------------------------
-- Connection requests
-- -----------------------------------------------------------------------------
-- Create ENUM type for status if not exists
DO $$ BEGIN
    CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id VARCHAR(50) PRIMARY KEY,
  from_student_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  to_student_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_connection_pair UNIQUE (from_student_id, to_student_id)
);

CREATE INDEX IF NOT EXISTS idx_connection_to_status ON public.connection_requests (to_student_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_from ON public.connection_requests (from_student_id);

-- -----------------------------------------------------------------------------
-- Student stats
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_stats (
  student_id VARCHAR(20) PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  projects_uploaded INT DEFAULT 0,
  connections INT DEFAULT 0,
  collaborations INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Collaborators
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE collab_role AS ENUM ('OWNER', 'COLLABORATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE collab_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.collaborators (
  id VARCHAR(50) PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  role collab_role NOT NULL DEFAULT 'COLLABORATOR',
  status collab_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_reposted SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT uq_project_student_collab UNIQUE (project_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_student ON public.collaborators (student_id);

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('LIKE', 'SAVE', 'COLLAB_REQUEST', 'COLLAB_ACCEPT', 'COLLAB_REJECT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id VARCHAR(50) PRIMARY KEY,
  receiver_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  sender_id VARCHAR(20) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  project_id VARCHAR(50) REFERENCES public.projects(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON public.notifications (receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON public.notifications (sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project ON public.notifications (project_id);

-- =============================================================================
-- End of schema
-- =============================================================================
