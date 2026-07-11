'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, Bookmark } from 'lucide-react';
import { apiProject, apiViewProject, apiLikeProject, apiSaveProject } from '@/lib/api';
import type { ApiProject } from '@/lib/api';
import { getCurrentStudentId, ensureViewerToken } from '@/lib/statsTracker';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id as string;
  const projectId = rawId ? decodeURIComponent(rawId) : '';

  const [project, setProject] = useState<ApiProject | null>(null);
  const [views, setViews] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentStudentId = getCurrentStudentId();
  const isSaved = project?.savedBy?.includes(currentStudentId || '') ?? false;

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      setIsLoading(true);
      try {
        const studentId = getCurrentStudentId() || undefined;
        const loaded = await apiProject(projectId, studentId);
        if (!loaded) {
          setError('Project not found');
          setIsLoading(false);
          return;
        }

        setProject(loaded);

        const storageKey = studentId ? `viewed_proj_${studentId}` : 'viewed_proj_guest';
        const viewedStr = localStorage.getItem(storageKey) || '[]';
        let viewedList: string[] = [];
        try {
          viewedList = JSON.parse(viewedStr);
        } catch {}

        if (!viewedList.includes(projectId)) {
          const viewerToken = ensureViewerToken();
          const viewResult = await apiViewProject(projectId, studentId, viewerToken);
          setViews(viewResult.views);
          viewedList.push(projectId);
          localStorage.setItem(storageKey, JSON.stringify(viewedList));
        } else {
          setViews(loaded.views);
        }
      } catch (err) {
        console.error('Failed to load project details', err);
        setError('Unable to load project details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const handleLike = async () => {
    const studentId = getCurrentStudentId();
    if (!studentId) {
      router.push('/auth');
      return;
    }
    try {
      const res = await apiLikeProject(projectId, studentId);
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          likes: res.likes,
          userHasLiked: res.liked,
        };
      });
    } catch (err) {
      console.error('Failed to like project', err);
    }
  };

  const handleSave = async () => {
    const studentId = getCurrentStudentId();
    if (!studentId) {
      router.push('/auth');
      return;
    }
    try {
      const res = await apiSaveProject(projectId, studentId);
      setProject(prev => {
        if (!prev) return null;
        const currentSavedBy = prev.savedBy || [];
        const alreadySaved = currentSavedBy.includes(studentId);
        let nextSavedBy = [...currentSavedBy];
        if (alreadySaved && !res.saved) {
          nextSavedBy = nextSavedBy.filter(id => id !== studentId);
        } else if (!alreadySaved && res.saved) {
          nextSavedBy.push(studentId);
        }
        return {
          ...prev,
          savedBy: nextSavedBy,
        };
      });
    } catch (err) {
      console.error('Failed to save project', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-muted-foreground animate-pulse">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 px-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{error || 'Project not found'}</p>
          <Button variant="outline" onClick={() => router.push('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Button variant="ghost" className="mb-6" onClick={() => router.push('/projects')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>

        <Card className="p-8 bg-card/70 backdrop-blur-sm border-primary/20">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-4">{project.title}</h1>
              {(() => {
                const description = project.description || '';
                const urlMatch = description.match(/Project URL:\s*([^\s\n\r]+)/i);
                const rawProjectUrl = urlMatch ? urlMatch[1].trim() : '';
                const cleanDescription = description
                  .replace(/Project URL:\s*[^\s\n\r]+/i, '')
                  .replace(/\n\s*\n\s*\n/g, '\n\n')
                  .trim();

                const isValidUrl = (url: string) => {
                  try {
                    const parsed = new URL(url);
                    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
                  } catch {
                    return false;
                  }
                };

                return (
                  <>
                    <p className="text-muted-foreground mb-6 whitespace-pre-line">{cleanDescription || 'No description available.'}</p>
                    <div className="mb-6">
                      <span className="text-sm font-semibold text-muted-foreground block mb-1">Project URL</span>
                      {isValidUrl(rawProjectUrl) ? (
                        <a
                          href={rawProjectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 transition-colors duration-150 cursor-pointer break-all no-underline inline-block"
                          style={{ textDecoration: 'none' }}
                        >
                          {rawProjectUrl}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">No project URL provided.</span>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-muted/10 p-4 text-center">
                  <div className="text-3xl font-bold">{project.likes}</div>
                  <div className="text-xs uppercase text-muted-foreground tracking-[0.2em] mt-1 flex items-center justify-center gap-1">
                    <span>❤️</span> Likes
                  </div>
                </div>
                <div className="rounded-xl bg-muted/10 p-4 text-center">
                  <div className="text-3xl font-bold">{views ?? project.views}</div>
                  <div className="text-xs uppercase text-muted-foreground tracking-[0.2em] mt-1 flex items-center justify-center gap-1">
                    <span>👁</span> Views
                  </div>
                </div>
                <div className="rounded-xl bg-muted/10 p-4 text-center">
                  <div className="text-3xl font-bold">{project.savedBy?.length ?? 0}</div>
                  <div className="text-xs uppercase text-muted-foreground tracking-[0.2em] mt-1 flex items-center justify-center gap-1">
                    <span>🔖</span> Saved
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Uploaded by <span className="font-semibold text-foreground">{project.studentName}</span></p>
                {project.fileName && (
                  <p className="text-sm text-muted-foreground">File: <span className="font-medium">{project.fileName}</span></p>
                )}
              </div>
            </div>

            {project.thumbnailUrl ? (
              <div className="w-full max-w-md rounded-3xl overflow-hidden border border-white/10 bg-muted/10">
                <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-row items-center gap-3">
            <Button variant="outline" className="gap-2 shrink-0 smooth-transition" onClick={() => router.push('/projects')}>
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              variant={project.userHasLiked ? 'default' : 'outline'}
              className={`gap-2 smooth-transition ${
                project.userHasLiked
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : 'hover:text-red-500 hover:border-red-500 bg-transparent'
              }`}
              onClick={handleLike}
            >
              <Heart className="w-4 h-4" fill={project.userHasLiked ? 'currentColor' : 'none'} />
              {project.userHasLiked ? 'Liked' : 'Like'}
            </Button>
            <Button
              variant={isSaved ? 'default' : 'outline'}
              className={`gap-2 smooth-transition ${
                isSaved
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                  : 'hover:text-yellow-500 hover:border-yellow-500 bg-transparent'
              }`}
              onClick={handleSave}
            >
              <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
