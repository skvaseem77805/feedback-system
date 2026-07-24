'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Heart,
  Eye,
  Share2,
  Bookmark,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { apiStudent, apiProjects, apiLikeProject, apiSaveProject } from '@/lib/api';
import type { ApiStudent, ApiProject } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import { useSafeBack } from '@/hooks/useSafeBack';
import { ShareBottomSheet } from '@/components/ShareBottomSheet';

export default function StudentProjectsPage() {
  const router = useRouter();
  const params = useParams();
  const safeBack = useSafeBack();

  const rawId = params?.id as string;
  const id = rawId ? decodeURIComponent(rawId) : '';

  const [student, setStudent] = useState<ApiStudent | null>(null);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareTitle, setShareTitle] = useState('');

  const currentStudentId = getCurrentStudentId() ?? '';

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [studentData, studentProjects] = await Promise.all([
          apiStudent(id),
          apiProjects({ studentId: id }),
        ]);

        setStudent(studentData);
        setProjects(studentProjects || []);
      } catch (err) {
        console.error('Error loading student projects page:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const toggleLike = async (project: ApiProject) => {
    if (!currentStudentId) return;
    try {
      const res = await apiLikeProject(project.id, currentStudentId);
      setProjects((prev) =>
        prev.map((q) =>
          q.id === project.id ? { ...q, likes: res.likes, userHasLiked: res.liked } : q
        )
      );
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const toggleSave = async (project: ApiProject) => {
    if (!currentStudentId) return;
    try {
      const res = await apiSaveProject(project.id, currentStudentId);
      setProjects((prev) =>
        prev.map((q) => {
          if (q.id !== project.id) return q;
          const alreadySaved = q.savedBy.includes(currentStudentId);
          let nextSavedBy = [...q.savedBy];
          if (alreadySaved && !res.saved) {
            nextSavedBy = nextSavedBy.filter((id) => id !== currentStudentId);
          } else if (!alreadySaved && res.saved) {
            nextSavedBy.push(currentStudentId);
          }
          return { ...q, savedBy: nextSavedBy };
        })
      );
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const handleShareClick = (project: ApiProject) => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/project/${project.id}`);
      setShareTitle(project.title);
      setShareOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 select-none antialiased">
      <Navbar />

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Top Bar with Back Button */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => safeBack(`/student/${encodeURIComponent(id)}`)}
            className="h-9 w-9 rounded-full active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>

          <div className="flex-1 min-w-0 text-left">
            <h1 className="text-lg font-extrabold text-foreground tracking-tight truncate">
              {student ? `${student.name}'s Projects` : 'Student Projects'}
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium truncate">
              {student
                ? `${student.academicYear} Year • ${student.department} • Section ${student.section}`
                : 'Projects uploaded by student'}
            </p>
          </div>

          <Badge className="bg-primary/10 text-primary border-none shadow-none font-bold text-xs px-2.5 py-1 rounded-full shrink-0">
            {projects.length}
          </Badge>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 w-full bg-muted/40 animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-4 pt-1">
            {projects.map((project) => {
              const isLiked = project.userHasLiked;
              const isSaved = project.savedBy?.includes(currentStudentId);

              return (
                <Card
                  key={project.id}
                  className="p-4 rounded-2xl bg-card/60 border border-border/45 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  {/* Optional Thumbnail */}
                  {project.thumbnailUrl && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted/40 border border-border/30">
                      <Link href={`/projects/${encodeURIComponent(project.id)}?from=student-projects`}>
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </Link>
                    </div>
                  )}

                  {/* Card Header & Content */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {project.category || 'Development'}
                      </span>
                      {project.uploadedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(project.uploadedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-foreground text-sm leading-snug line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Card Footer: Metrics & Actions */}
                  <div className="space-y-2.5 pt-2 border-t border-border/20">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold">
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleLike(project)}
                          className="flex items-center gap-1 active:scale-90 transition-transform"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 text-red-500 ${
                              isLiked ? 'fill-red-500' : ''
                            }`}
                          />
                          <span>{project.likes}</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>{project.views ?? 0}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => toggleSave(project)}
                        className="flex items-center gap-1 active:scale-90 transition-transform"
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            isSaved
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                        <span>{isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/projects/${encodeURIComponent(project.id)}?from=student-projects`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs py-3.5 rounded-xl border-none shadow-none h-8.5"
                        >
                          View Project
                        </Button>
                      </Link>
                      <Button
                        onClick={() => handleShareClick(project)}
                        variant="outline"
                        size="icon"
                        className="h-8.5 w-8.5 rounded-xl border-border/50 text-muted-foreground animate-none shrink-0"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center bg-card/45 border-border/40 rounded-2xl space-y-2">
            <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm font-bold text-foreground">No projects uploaded yet.</p>
            <p className="text-xs text-muted-foreground">
              This student has not shared any projects yet.
            </p>
          </Card>
        )}
      </main>

      <ShareBottomSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        title={shareTitle}
      />
    </div>
  );
}
