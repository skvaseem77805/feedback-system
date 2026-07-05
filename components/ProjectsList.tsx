 'use client';

import React from 'react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Project, type AcademicYear } from '@/lib/data';
import { apiDeleteProject } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import {
  FileText,
  Calendar,
  User,
  FolderOpen,
  Smartphone,
  Database,
  Brain,
  Gamepad2,
  Trash2,
} from 'lucide-react';

interface ProjectsListProps {
  projects: Project[];
  filterByYear?: AcademicYear;
  onDelete?: (id: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  web: <GlobePlaceholder />,
  mobile: <Smartphone className="w-4 h-4" />,
  data: <Database className="w-4 h-4" />,
  ai: <Brain className="w-4 h-4" />,
  game: <Gamepad2 className="w-4 h-4" />,
  other: <FolderOpen className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  web: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  mobile: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  data: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ai: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  game: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

function GlobePlaceholder() {
  return <div className="w-4 h-4 rounded-full bg-primary/20" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function ProjectsListComponent({ projects, filterByYear, onDelete }: ProjectsListProps) {
  const [deleting, setDeleting] = React.useState<Record<string, boolean>>({});

  const filteredProjects = React.useMemo(
    () => (filterByYear ? projects.filter((p) => p.academicYear === filterByYear) : projects),
    [projects, filterByYear]
  );

  if (filteredProjects.length === 0) {
    return (
      <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20">
        <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground text-lg">
          {filterByYear ? `No projects uploaded yet for ${filterByYear} year` : 'No projects uploaded yet'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">Be the first to share your amazing work!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Recent Projects</h2>
        <p className="text-muted-foreground">
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} shared
        </p>
      </div>

      <div className="grid gap-4">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="p-5 hover-lift smooth-transition bg-card/50 backdrop-blur-sm border-primary/20 group">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-primary group-hover:text-accent smooth-transition truncate">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                </div>
                <Badge className={`shrink-0 gap-1 px-3 py-1 ${categoryColors[project.category] || categoryColors.other}`}>
                  {categoryIcons[project.category] || categoryIcons.other}
                  <span>{project.category.charAt(0).toUpperCase() + project.category.slice(1)}</span>
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{project.studentName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(project.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{formatFileSize(project.fileSize ?? 0)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {project.academicYear === 'final' ? 'Final Year' : `${project.academicYear} Year`}
                </Badge>

                {project.studentId === getCurrentStudentId() && (
                  <div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        const ok = confirm("Are you sure you want to delete this project? This cannot be undone.");
                        if (!ok) return;

                        const studentId = getCurrentStudentId();
                        if (!studentId) return;

                        setDeleting((prev) => ({ ...prev, [project.id]: true }));

                        try {
                          const res = await apiDeleteProject(project.id, studentId);
                          console.log('Delete Success:', res);
                          onDelete?.(project.id);
                        } catch (e) {
                          console.error('DELETE ERROR:', e);
                          alert('Failed to delete project.');
                        } finally {
                          setDeleting((prev) => ({ ...prev, [project.id]: false }));
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const ProjectsList = React.memo(ProjectsListComponent);
