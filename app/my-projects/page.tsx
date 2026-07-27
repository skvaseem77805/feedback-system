'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ArrowUpDown,
  Heart,
  Eye,
  Share2,
  Bookmark,
  FolderOpen,
  Sparkles,
  X,
  Calendar,
} from 'lucide-react';
import { apiProjects, apiLikeProject, apiSaveProject } from '@/lib/api';
import type { ApiProject } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import { ShareBottomSheet } from '@/components/ShareBottomSheet';
import { smartFilterItems } from '@/lib/smart-search';

import { loadPageState, savePageState, saveScrollPosition, restoreScrollPosition } from '@/lib/state-preservation';

export default function MyProjectsPage() {
  const router = useRouter();
  const savedState = loadPageState('my_projects', { searchQuery: '', sortOrder: 'latest' as 'latest' | 'oldest' });

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>(savedState.sortOrder);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareTitle, setShareTitle] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const currentStudentId = getCurrentStudentId() ?? '';

  useEffect(() => {
    savePageState('my_projects', { searchQuery, sortOrder });
  }, [searchQuery, sortOrder]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        saveScrollPosition('my_projects');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!currentStudentId) {
      router.push('/auth');
      return;
    }

    const loadMyProjects = async () => {
      try {
        setLoading(true);
        const list = await apiProjects({
          studentId: currentStudentId,
          forUserId: currentStudentId,
        });
        setProjects(list || []);
      } catch (err) {
        console.error('Failed to load my projects:', err);
      } finally {
        setLoading(false);
        restoreScrollPosition('my_projects');
      }
    };

    loadMyProjects();
  }, [currentStudentId, router]);

  // Handle outside click to hide search suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleShareClick = (projectId: string, title: string) => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/project/${projectId}`);
      setShareTitle(title);
      setShareOpen(true);
    }
  };

  // Filter projects by Title, Description, Category, Tech, Tags, etc.
  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return projects;
    return smartFilterItems(projects, q, [
      { field: 'title', weight: 2.0 },
      { field: 'description', weight: 1.5 },
      { field: 'category', weight: 1.2 },
      { field: 'studentDepartment', weight: 1.0 },
      { field: (p) => (p as any).technologies || (p as any).techStack, weight: 1.2 },
      { field: (p) => (p as any).tags, weight: 1.2 },
    ]);
  }, [projects, searchQuery]);

  // Suggestions for autocomplete (titles matching searchQuery)
  const titleSuggestions = searchQuery.trim()
    ? Array.from(
        new Set(
          filteredProjects.map((p) => p.title)
        )
      ).slice(0, 5)
    : [];

  // Sort projects: Latest vs Oldest
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const timeA = new Date(a.uploadedAt || 0).getTime();
    const timeB = new Date(b.uploadedAt || 0).getTime();
    return sortOrder === 'latest' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="min-h-screen bg-background pb-24 select-none antialiased">
      <Navbar />

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">
              My Projects
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Manage and view your uploaded projects
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none shadow-none font-bold text-xs px-3 py-1 rounded-full">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </Badge>
        </div>

        {/* Search Bar & Sort Dropdown */}
        <div className="flex gap-2 items-center">
          <div ref={searchContainerRef} className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by project title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-9 pr-8 h-9 text-xs rounded-xl bg-muted/40 border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Popup */}
            {showSuggestions && titleSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-xl shadow-lg z-50 overflow-hidden text-left">
                {titleSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted/50 transition-colors truncate block border-b border-border/20 last:border-none"
                  >
                    <span className="font-semibold">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
              className="h-9 px-2.5 bg-muted/40 text-foreground text-xs font-bold rounded-xl border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none pr-7"
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Project List / Cards */}
        {loading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 w-full bg-muted/40 animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : sortedProjects.length > 0 ? (
          <div className="space-y-4 pt-1">
            {sortedProjects.map((project) => {
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
                      <Link href={`/projects/${encodeURIComponent(project.id)}?from=my-projects`}>
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
                        href={`/projects/${encodeURIComponent(project.id)}?from=my-projects`}
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
                        onClick={() => handleShareClick(project.id, project.title)}
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
          <Card className="p-8 text-center bg-card/45 border-border/40 rounded-2xl space-y-3">
            <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                {searchQuery ? 'No matching projects found' : 'No projects uploaded yet'}
              </p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? 'Try searching for a different title.'
                  : 'Start uploading your projects to showcase them here!'}
              </p>
            </div>
            {searchQuery ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="rounded-xl font-bold text-xs"
              >
                Clear Search
              </Button>
            ) : (
              <Link href="/upload">
                <Button size="sm" className="rounded-xl font-bold text-xs text-white">
                  Upload Project
                </Button>
              </Link>
            )}
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
