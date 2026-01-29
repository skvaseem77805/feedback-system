-- =============================================================================
-- Feedback System - MySQL Schema for MySQL Workbench
-- Run this script in MySQL Workbench to create the database and tables.
-- =============================================================================

-- Create and use database
CREATE DATABASE IF NOT EXISTS feedback_system
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE feedback_system;

-- -----------------------------------------------------------------------------
-- Students (college roster + profile fields)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(20) PRIMARY KEY COMMENT 'Registration no / userId',
  name VARCHAR(255) NOT NULL,
  registration_no VARCHAR(20) NOT NULL UNIQUE,
  unique_id VARCHAR(50),
  year TINYINT NOT NULL DEFAULT 2,
  course VARCHAR(100),
  email VARCHAR(255) DEFAULT '',
  mobile_no VARCHAR(20) DEFAULT '',
  department VARCHAR(50) DEFAULT 'CSE',
  section VARCHAR(10) DEFAULT 'E',
  linkedin_url VARCHAR(500) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  skills JSON DEFAULT NULL COMMENT 'Array of skill strings',
  avatar VARCHAR(500) DEFAULT NULL,
  password_hash VARCHAR(255) DEFAULT NULL COMMENT 'Optional; for real auth later',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_students_department (department),
  INDEX idx_students_year (year),
  INDEX idx_students_section (section)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  likes INT UNSIGNED DEFAULT 0,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  file_name VARCHAR(255) DEFAULT NULL,
  file_size BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_projects_student (student_id),
  INDEX idx_projects_category (category),
  INDEX idx_projects_uploaded (uploaded_at)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Project likes (student liked project)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_likes (
  project_id VARCHAR(50) NOT NULL,
  student_id VARCHAR(20) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, student_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Project saves (student saved project)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_saves (
  project_id VARCHAR(50) NOT NULL,
  student_id VARCHAR(20) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, student_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Project collaborators
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_collaborators (
  project_id VARCHAR(50) NOT NULL,
  student_id VARCHAR(20) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, student_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Connection requests (pending / accepted / rejected)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connection_requests (
  id VARCHAR(50) PRIMARY KEY,
  from_student_id VARCHAR(20) NOT NULL,
  to_student_id VARCHAR(20) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_connection_pair (from_student_id, to_student_id),
  FOREIGN KEY (from_student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (to_student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_connection_to_status (to_student_id, status),
  INDEX idx_connection_from (from_student_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Student stats (projects_uploaded, connections, collaborations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_stats (
  student_id VARCHAR(20) PRIMARY KEY,
  projects_uploaded INT UNSIGNED DEFAULT 0,
  connections INT UNSIGNED DEFAULT 0,
  collaborations INT UNSIGNED DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- End of schema
-- =============================================================================
