-- Add project views table and views counter to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS views INT UNSIGNED DEFAULT 0;

CREATE TABLE IF NOT EXISTS project_views (
  project_id VARCHAR(50) NOT NULL,
  viewer_token VARCHAR(128) DEFAULT NULL,
  viewer_student_id VARCHAR(20) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, viewer_token, viewer_student_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_project_views_project ON project_views (project_id);
CREATE INDEX idx_project_views_token ON project_views (viewer_token);
CREATE INDEX idx_project_views_student ON project_views (viewer_student_id);
