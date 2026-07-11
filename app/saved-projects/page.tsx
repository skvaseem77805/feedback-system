'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Trash2, Bookmark } from 'lucide-react';
import { apiProjects, apiSaveProject } from '@/lib/api';
import type { ApiProject } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';

export default function SavedProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const currentStudentId = getCurrentStudentId() ?? '';

  useEffect(() => {
    if (!currentStudentId) {
      router.push('/auth');
      return;
    }

    const loadSavedProjects = async () => {
      try {
        const list = await apiProjects({ forUserId: currentStudentId || undefined });
        const saved = list.filter((p) => p.savedBy?.includes(currentStudentId));
        setProjects(saved);
      } catch (e) {
        console.error('Failed to load saved projects:', e);
      } finally {
        setLoading(false);
      }
    };

    loadSavedProjects();
  }, [currentStudentId, router]);

  const handleRemoveFromSaved = async (projectId: string) => {
    try {
      const res = await apiSaveProject(projectId, currentStudentId);
      if (!res.saved) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch (err) {
      console.error('Failed to remove project from saved', err);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Saved Projects
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Here are the projects you have bookmarked for quick access and reference.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            Loading saved projects...
          </div>
        ) : projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="p-5 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition group flex flex-col justify-between">
                <div className="space-y-4">
                  {project.thumbnailUrl && (
                    <div className="w-full h-48 rounded-md overflow-hidden bg-muted/20 border border-border/50">
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover hover:scale-105 smooth-transition duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg group-hover:text-primary smooth-transition line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">By {project.studentName}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground py-3 border-t border-b border-border/50 mb-4">
                    <div>
                      <div className="font-bold text-foreground">{project.likes}</div>
                      Likes
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{project.views}</div>
                      Views
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/projects/${encodeURIComponent(project.id)}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full smooth-button gap-2 bg-transparent">
                        <ExternalLink className="w-4 h-4" />
                        Open Project
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromSaved(project.id)}
                      className="smooth-button text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20 max-w-md mx-auto">
            <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2 text-lg font-semibold">No saved projects yet.</p>
            <p className="text-muted-foreground text-sm mb-6">Explore projects in the hub and click the bookmark icon to save them here.</p>
            <Button
              className="smooth-button bg-primary text-primary-foreground"
              onClick={() => router.push('/projects')}
            >
              Browse Projects
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
