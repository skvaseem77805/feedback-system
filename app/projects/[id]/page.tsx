'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Heart, Bookmark, User, Search, X, Loader2 } from 'lucide-react';
import { apiProject, apiViewProject, apiLikeProject, apiSaveProject, apiManageCollaborator } from '@/lib/api';
import type { ApiProject } from '@/lib/api';
import { getCurrentStudentId, ensureViewerToken } from '@/lib/statsTracker';
import { useSafeBack } from '@/hooks/useSafeBack';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const safeBack = useSafeBack();
  const rawId = params?.id as string;
  const projectId = rawId ? decodeURIComponent(rawId) : '';

  const [project, setProject] = useState<ApiProject | null>(null);
  const [views, setViews] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentStudentId = getCurrentStudentId();
  const isSaved = project?.savedBy?.includes(currentStudentId || '') ?? false;

  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [collabSearchQuery, setCollabSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingCollabId, setAddingCollabId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAddDrawerOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    } else {
      setCollabSearchQuery('');
      setSearchResults([]);
    }
  }, [isAddDrawerOpen]);

  useEffect(() => {
    const q = collabSearchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&limit=10`);
        if (res.ok) {
          const list = await res.json();
          const filtered = list.filter((s: any) => s.id !== project?.studentId);
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Failed to search students:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [collabSearchQuery, project?.studentId]);

  const handleAddCollaborator = async (studentId: string) => {
    if (!currentStudentId || !project) return;
    try {
      setAddingCollabId(studentId);
      await apiManageCollaborator({
        projectId: project.id,
        action: 'invite',
        studentId,
        ownerId: currentStudentId,
      });

      toast({
        title: "Collaborator Added Successfully",
        description: "An invitation has been sent to the student.",
      });

      setIsAddDrawerOpen(false);

      const updated = await apiProject(project.id, currentStudentId);
      if (updated) {
        setProject(updated);
      }
    } catch (err) {
      console.error('Failed to add collaborator:', err);
      toast({
        title: "Error",
        description: "Failed to add collaborator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingCollabId(null);
    }
  };

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

  const handleManageCollaborator = async (studentId: string, action: 'cancel' | 'invite' | 'remove') => {
    if (!currentStudentId || !project) return;
    try {
      await apiManageCollaborator({
        projectId: project.id,
        action,
        studentId,
        ownerId: currentStudentId,
      });

      // Reload project details to reflect updated state
      const updated = await apiProject(project.id, currentStudentId);
      if (updated) {
        setProject(updated);
      }
    } catch (err) {
      console.error('Failed to manage collaborator:', err);
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
          <Button variant="outline" onClick={() => safeBack('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-4' : 'py-10'}`}>
        <Button
          variant="ghost"
          className={isMobile ? "mb-3 text-xs h-8 px-2" : "mb-6"}
          onClick={() => safeBack('/projects')}
        >
          <ArrowLeft className={isMobile ? "w-3.5 h-3.5 mr-1" : "w-4 h-4 mr-2"} /> Back to Projects
        </Button>

        <Card className={`bg-card/70 backdrop-blur-sm border-primary/20 ${isMobile ? 'p-4 rounded-2xl' : 'p-8 rounded-3xl'}`}>
          <div className={`flex flex-col lg:flex-row ${isMobile ? 'gap-4' : 'gap-8'}`}>
            <div className="flex-1">
              <h1 className={`font-bold ${isMobile ? 'text-xl mb-2 font-extrabold text-foreground' : 'text-3xl mb-4'}`}>{project.title}</h1>
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
                    <p className={`whitespace-pre-line ${isMobile ? 'text-xs mb-3 font-medium text-muted-foreground leading-relaxed' : 'text-muted-foreground mb-6'}`}>{cleanDescription || 'No description available.'}</p>
                    <div className={isMobile ? 'mb-4' : 'mb-6'}>
                      <span className={`font-semibold text-muted-foreground block ${isMobile ? 'text-[10px] mb-0.5 uppercase tracking-wider' : 'text-sm mb-1'}`}>Project URL</span>
                      {isValidUrl(rawProjectUrl) ? (
                        <a
                          href={rawProjectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-blue-500 hover:text-blue-600 transition-colors duration-150 cursor-pointer break-all no-underline inline-block ${isMobile ? 'text-xs font-semibold' : 'text-sm'}`}
                          style={{ textDecoration: 'none' }}
                        >
                          {rawProjectUrl}
                        </a>
                      ) : (
                        <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>No project URL provided.</span>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className={`grid grid-cols-3 ${isMobile ? 'gap-2.5 mb-4' : 'gap-4 mb-6'}`}>
                <div className={`text-center ${isMobile ? 'rounded-xl bg-muted/15 p-2' : 'rounded-xl bg-muted/10 p-4'}`}>
                  <div className={`font-bold ${isMobile ? 'text-base font-extrabold text-foreground' : 'text-3xl'}`}>{project.likes}</div>
                  <div className={`uppercase text-muted-foreground tracking-[0.2em] flex items-center justify-center gap-1 ${isMobile ? 'text-[9px] mt-0.5 tracking-wider font-semibold' : 'text-xs mt-1'}`}>
                    <span className={isMobile ? 'text-xs' : ''}>❤️</span> Likes
                  </div>
                </div>
                <div className={`text-center ${isMobile ? 'rounded-xl bg-muted/15 p-2' : 'rounded-xl bg-muted/10 p-4'}`}>
                  <div className={`font-bold ${isMobile ? 'text-base font-extrabold text-foreground' : 'text-3xl'}`}>{views ?? project.views}</div>
                  <div className={`uppercase text-muted-foreground tracking-[0.2em] flex items-center justify-center gap-1 ${isMobile ? 'text-[9px] mt-0.5 tracking-wider font-semibold' : 'text-xs mt-1'}`}>
                    <span className={isMobile ? 'text-xs' : ''}>👁</span> Views
                  </div>
                </div>
                <div className={`text-center ${isMobile ? 'rounded-xl bg-muted/15 p-2' : 'rounded-xl bg-muted/10 p-4'}`}>
                  <div className={`font-bold ${isMobile ? 'text-base font-extrabold text-foreground' : 'text-3xl'}`}>{project.savedBy?.length ?? 0}</div>
                  <div className={`uppercase text-muted-foreground tracking-[0.2em] flex items-center justify-center gap-1 ${isMobile ? 'text-[9px] mt-0.5 tracking-wider font-semibold' : 'text-xs mt-1'}`}>
                    <span className={isMobile ? 'text-xs' : ''}>🔖</span> Saved
                  </div>
                </div>
              </div>

              <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
                <p className={isMobile ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground'}>Owner: <span className="font-semibold text-foreground">{project.studentName}</span></p>
                {project.collaboratorNames && project.collaboratorNames.length > 0 && (
                  <p className={isMobile ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground'}>Collaborators: <span className="font-semibold text-foreground">{project.collaboratorNames.join(', ')}</span></p>
                )}
                {project.fileName && (
                  <p className={isMobile ? 'text-xs text-muted-foreground' : 'text-sm text-muted-foreground'}>File: <span className="font-medium">{project.fileName}</span></p>
                )}
              </div>
            </div>

            {project.thumbnailUrl ? (
              <div className={`w-full overflow-hidden border border-white/10 bg-muted/10 shadow-sm ${isMobile ? 'max-w-[240px] rounded-2xl mx-auto mt-2' : 'max-w-md rounded-3xl'}`}>
                <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
              </div>
            ) : null}
          </div>

          <div className={`mt-6 flex flex-wrap items-center ${isMobile ? 'gap-2 justify-center' : 'gap-3 mt-8'}`}>
            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'default'}
              className="gap-2 shrink-0 smooth-transition"
              onClick={() => safeBack('/projects')}
            >
              <ArrowLeft className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> Back
            </Button>
            <Button
              variant={project.userHasLiked ? 'default' : 'outline'}
              size={isMobile ? 'sm' : 'default'}
              className={`gap-2 smooth-transition ${
                project.userHasLiked
                  ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                  : 'hover:text-red-500 hover:border-red-500 bg-transparent'
              }`}
              onClick={handleLike}
            >
              <Heart className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill={project.userHasLiked ? 'currentColor' : 'none'} />
              {project.userHasLiked ? 'Liked' : 'Like'}
            </Button>
            <Button
              variant={isSaved ? 'default' : 'outline'}
              size={isMobile ? 'sm' : 'default'}
              className={`gap-2 smooth-transition ${
                isSaved
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                  : 'hover:text-yellow-500 hover:border-yellow-500 bg-transparent'
              }`}
              onClick={handleSave}
            >
              <Bookmark className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            <Button
              variant="outline"
              size={isMobile ? 'sm' : 'default'}
              className="gap-2 smooth-transition hover:text-blue-500 hover:border-blue-500 bg-transparent"
              onClick={() => {
                const targetPath = project.studentId === currentStudentId
                  ? '/profile'
                  : `/student/${project.studentId}`;
                router.push(targetPath);
              }}
            >
              <User className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              Profile
            </Button>
          </div>
        </Card>

        {/* Manage Collaborators Section - ONLY FOR OWNER */}
        {project && project.studentId === currentStudentId && project.allCollaborators && (project.allCollaborators.length > 0 || isMobile) && (
          <div className={`bg-card border shadow-sm backdrop-blur-md text-left ${isMobile ? 'mt-4 p-4 rounded-2xl' : 'mt-8 p-8 sm:p-12 rounded-3xl'}`}>
            {isMobile ? (
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-extrabold text-foreground">Manage Collaborators</h2>
                <Button
                  onClick={() => setIsAddDrawerOpen(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-4 active:scale-95 transition-transform text-xs h-8"
                >
                  + Add
                </Button>
              </div>
            ) : (
              <h2 className="text-xl font-bold mb-6">Manage Collaborators</h2>
            )}
            <div className="space-y-3">
              {project.allCollaborators.map((collab: any) => (
                <div key={collab.studentId} className={`flex flex-col sm:flex-row sm:items-center justify-between border border-border/60 bg-muted/5 gap-3 ${isMobile ? 'p-3 rounded-xl' : 'p-4 rounded-2xl'}`}>
                  <div className="flex items-center gap-3">
                    {collab.avatar ? (
                      <img src={collab.avatar} alt={collab.name} className={`rounded-full object-cover border border-border ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`} />
                    ) : (
                      <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary ${isMobile ? 'w-10 h-10 text-lg' : 'w-12 h-12 text-xl'}`}>👤</div>
                    )}
                    <div>
                      <h4 className={`font-semibold text-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>{collab.name}</h4>
                      <p className={`text-muted-foreground font-mono ${isMobile ? 'text-[10px]' : 'text-xs'}`}>{collab.studentId}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          collab.status === 'ACCEPTED' ? 'bg-green-500' :
                          collab.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        <span className={`font-medium text-muted-foreground capitalize ${isMobile ? 'text-[10px]' : 'text-[11px]'}`}>
                          {collab.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {collab.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white ${isMobile ? 'text-[10px] h-7 px-2.5 rounded-lg' : ''}`}
                        onClick={() => handleManageCollaborator(collab.studentId, 'cancel')}
                      >
                        Cancel Invitation
                      </Button>
                    )}
                    {collab.status === 'REJECTED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`border-primary/30 text-primary hover:bg-primary hover:text-white ${isMobile ? 'text-[10px] h-7 px-2.5 rounded-lg' : ''}`}
                        onClick={() => handleManageCollaborator(collab.studentId, 'invite')}
                      >
                        Invite Again
                      </Button>
                    )}
                    {collab.status === 'ACCEPTED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={`border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white ${isMobile ? 'text-[10px] h-7 px-2.5 rounded-lg' : ''}`}
                        onClick={() => handleManageCollaborator(collab.studentId, 'remove')}
                      >
                        Remove Collaborator
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Add Collaborator Drawer */}
      <Drawer open={isAddDrawerOpen} onOpenChange={setIsAddDrawerOpen}>
        <DrawerContent className="p-5 pb-8 rounded-t-[24px] border-t bg-background max-h-[85vh] flex flex-col">
          <div className="sr-only">
            <DrawerTitle>Add Collaborators</DrawerTitle>
            <DrawerDescription>Search and add collaborators to your project</DrawerDescription>
          </div>

          <div className="flex items-center gap-3 w-full border-b pb-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search student by Name or Registration Number"
                value={collabSearchQuery}
                onChange={(e) => setCollabSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full rounded-full bg-muted/40 border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </Button>
            </DrawerClose>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Searching students...</p>
              </div>
            ) : collabSearchQuery.trim() && searchResults.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No students found matching "{collabSearchQuery}"
              </div>
            ) : !collabSearchQuery.trim() ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                Type student name or registration number to search
              </div>
            ) : (
              searchResults.map((student) => {
                const isAlreadyCollab = project?.allCollaborators?.some(
                  (c: any) => c.studentId === student.id
                );
                const isAdding = addingCollabId === student.id;

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover border border-border/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base font-semibold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className="font-bold text-xs text-foreground leading-snug">
                          {student.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {student.registrationNo || student.id}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          {student.department} • {student.academicYear || `${student.year} Year`}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isAlreadyCollab ? "ghost" : "outline"}
                      disabled={isAlreadyCollab || isAdding}
                      onClick={() => handleAddCollaborator(student.id)}
                      className={`text-xs font-semibold rounded-xl h-8 px-3 ${
                        isAlreadyCollab 
                          ? "bg-transparent text-muted-foreground/80 cursor-not-allowed border-none shadow-none" 
                          : "border-primary/20 text-primary hover:bg-primary/5 bg-transparent"
                      }`}
                    >
                      {isAdding ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : isAlreadyCollab ? (
                        "Already Added"
                      ) : (
                        "+ Add"
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
