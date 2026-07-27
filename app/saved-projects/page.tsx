'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ExternalLink, Trash2, Bookmark, Share2, Search } from 'lucide-react';
import { apiProjects, apiSaveProject } from '@/lib/api';
import type { ApiProject } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import { ShareBottomSheet } from '@/components/ShareBottomSheet';
import { smartFilterItems } from '@/lib/smart-search';

import { loadPageState, savePageState, saveScrollPosition, restoreScrollPosition } from '@/lib/state-preservation';

export default function SavedProjectsPage() {
  const router = useRouter();
  const savedState = loadPageState('saved_projects', { searchQuery: '' });

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery);
  const [loading, setLoading] = useState(true);
  const currentStudentId = getCurrentStudentId() ?? '';

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");

  useEffect(() => {
    savePageState('saved_projects', { searchQuery });
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        saveScrollPosition('saved_projects');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleShareClick = (projectId: string, title: string) => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/project/${projectId}`);
      setShareTitle(title);
      setShareOpen(true);
    }
  };

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
        restoreScrollPosition('saved_projects');
      }
    };

    loadSavedProjects();
  }, [currentStudentId, router]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return projects;
    return smartFilterItems(projects, q, [
      { field: 'title', weight: 2.0 },
      { field: 'description', weight: 1.5 },
      { field: 'category', weight: 1.2 },
      { field: 'studentName', weight: 1.2 },
      { field: 'studentDepartment', weight: 1.0 },
      { field: (p) => (p as any).technologies || (p as any).techStack, weight: 1.2 },
      { field: (p) => (p as any).tags, weight: 1.2 },
    ]);
  }, [projects, searchQuery]);

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

        {/* Search Bar */}
        {projects.length > 0 && (
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search saved projects by title, desc, student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-xs sm:text-sm rounded-xl bg-card/60 border-border/60"
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            Loading saved projects...
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
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
                    <Link href={`/projects/${encodeURIComponent(project.id)}?from=saved`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full smooth-button gap-2 bg-transparent">
                        <ExternalLink className="w-4 h-4" />
                        Open Project
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShareClick(project.id, project.title)}
                      className="smooth-button text-muted-foreground hover:text-foreground h-9 w-9 border border-border/40 rounded-xl shrink-0"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
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
        ) : searchQuery ? (
          <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20 max-w-md mx-auto">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2 text-lg font-semibold">No saved projects found</p>
            <p className="text-muted-foreground text-sm mb-6">Try searching with a different keyword.</p>
            <Button
              className="smooth-button bg-primary text-primary-foreground font-bold text-xs"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          </Card>
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
      <ShareBottomSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        title={shareTitle}
      />
    </div>
  );
}
