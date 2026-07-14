'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Heart, Bookmark, User, Search, X, Loader2, Pencil, Globe, ExternalLink, Calendar, Tag, Upload, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { apiProject, apiViewProject, apiLikeProject, apiSaveProject, apiManageCollaborator, apiDeleteProject } from '@/lib/api';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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

  const getProjectImages = (p: ApiProject) => {
    let list: string[] = [];
    if (p.imageUrls) {
      try {
        list = typeof p.imageUrls === 'string' ? JSON.parse(p.imageUrls) : p.imageUrls;
      } catch {
        list = [];
      }
    }
    if (!Array.isArray(list)) list = [];
    if (list.length === 0 && p.thumbnailUrl) {
      list = [p.thumbnailUrl];
    }
    return list;
  };

  const projectImages = project ? getProjectImages(project) : [];

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editGalleryImages, setEditGalleryImages] = useState<{ file?: File; preview: string; url?: string }[]>([]);

  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const diffX = touchStartX - touchEndX;
    const swipeThreshold = 50;
    if (diffX > swipeThreshold) {
      setFullscreenImageIndex((prev) => (prev + 1) % projectImages.length);
    } else if (diffX < -swipeThreshold) {
      setFullscreenImageIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length);
    }
  };

  useEffect(() => {
    if (isFullscreenOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreenOpen]);

  useEffect(() => {
    if (!isFullscreenOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const images = projectImages;
      if (images.length === 0) return;

      if (e.key === 'ArrowLeft') {
        setFullscreenImageIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setFullscreenImageIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'Escape') {
        setIsFullscreenOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreenOpen, projectImages]);

  useEffect(() => {
    setGalleryIndex(0);
  }, [project]);

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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCollaborators, setEditCollaborators] = useState<{ id: string; name: string; avatar: string | null }[]>([]);
  const [editCollabSearchQuery, setEditCollabSearchQuery] = useState('');
  const [editCollabSearchResults, setEditCollabSearchResults] = useState<any[]>([]);
  const [isEditCollabSearching, setIsEditCollabSearching] = useState(false);
  const [editProjectUrl, setEditProjectUrl] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProject = async () => {
    if (!project || !currentStudentId) return;
    setIsDeleting(true);
    try {
      const res = await apiDeleteProject(project.id, currentStudentId);
      if (res.deleted) {
        setIsDeleteConfirmOpen(false);
        toast({
          title: 'Success',
          description: 'Project deleted successfully.',
        });
        router.push('/projects');
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = project && currentStudentId && project.studentId?.toLowerCase().trim() === currentStudentId.toLowerCase().trim();

  const openEditModal = () => {
    if (!project) return;
    setEditTitle(project.title);
    
    const desc = project.description || '';
    const urlMatch = desc.match(/Project URL:\s*([^\s\n\r]+)/i);
    const rawUrl = urlMatch ? urlMatch[1].trim() : '';
    const cleanDesc = desc
      .replace(/Project URL:\s*[^\s\n\r]+/i, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
      
    setEditDescription(cleanDesc);
    setEditProjectUrl(rawUrl);
    setEditDepartment(project.studentDepartment || localStorage.getItem('studentDepartment') || 'CSE');
    
    const collabs = (project.allCollaborators || []).map((c: any) => ({
      id: c.studentId,
      name: c.name,
      avatar: c.avatar || null
    }));
    setEditCollaborators(collabs);
    setEditCollabSearchQuery('');
    setEditCollabSearchResults([]);

    let initialGallery: { url?: string; preview: string }[] = [];
    if (project.imageUrls && project.imageUrls.length > 0) {
      initialGallery = project.imageUrls.map((url: string) => ({ url, preview: url }));
    } else if (project.thumbnailUrl) {
      initialGallery = [{ url: project.thumbnailUrl, preview: project.thumbnailUrl }];
    }
    setEditGalleryImages(initialGallery);
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    if (!editTitle.trim()) {
      setEditError('Project title is required');
      return;
    }
    if (!editDescription.trim()) {
      setEditError('Project description is required');
      return;
    }
    if (!editDepartment) {
      setEditError('Please select a department');
      return;
    }

    // Project URL is now optional. Check format only if provided.
    if (editProjectUrl.trim()) {
      try {
        new URL(editProjectUrl.trim());
      } catch {
        setEditError('Please enter a valid URL');
        return;
      }
    }

    setIsSavingEdit(true);

    try {
      const finalImageUrls: string[] = [];
      for (const img of editGalleryImages) {
        if (img.url) {
          finalImageUrls.push(img.url);
        } else if (img.file) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', img.file);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Image upload failed');
          }
          finalImageUrls.push(data.url);
        }
      }

      const enhancedDescription = editProjectUrl.trim()
        ? `${editDescription.trim()}\n\nProject URL: ${editProjectUrl.trim()}`
        : editDescription.trim();

      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudentId,
          studentName: localStorage.getItem('studentName') || 'Student',
          title: editTitle.trim(),
          description: enhancedDescription,
          thumbnailUrl: finalImageUrls.length > 0 ? finalImageUrls[0] : '',
          imageUrls: finalImageUrls,
          department: editDepartment,
          collaborators: editCollaborators.map(c => c.id),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update project');
      }

      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });

      const updated = await apiProject(projectId, currentStudentId || undefined);
      if (updated) {
        setProject(updated);
        if (updated.studentId === currentStudentId) {
          localStorage.setItem('studentDepartment', editDepartment);
        }
      }

      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditError('');
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (editGalleryImages.length + files.length > 10) {
      setEditError('You can upload up to 10 project images.');
      return;
    }

    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const newImages: { file: File; preview: string }[] = [];

    for (const file of files) {
      if (!validFormats.includes(file.type)) {
        setEditError('Supported formats: JPG, JPEG, PNG, WEBP');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setEditError('Each image size should be less than 5MB');
        return;
      }
      newImages.push({
        file,
        preview: URL.createObjectURL(file)
      });
    }

    setEditGalleryImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveEditGalleryImage = (index: number) => {
    setEditGalleryImages(prev => {
      const updated = [...prev];
      if (updated[index].file) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  useEffect(() => {
    const q = editCollabSearchQuery.trim();
    if (!q) {
      setEditCollabSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsEditCollabSearching(true);
        const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&limit=10`);
        if (res.ok) {
          const list = await res.json();
          const ownerId = project?.studentId || currentStudentId || '';
          const filteredList = list.filter((s: any) => s.id?.toLowerCase().trim() !== ownerId.toLowerCase().trim());
          setEditCollabSearchResults(filteredList);
        }
      } catch (err) {
        console.error('Failed to search students', err);
      } finally {
        setIsEditCollabSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [editCollabSearchQuery, project, currentStudentId]);

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

  const description = project?.description || '';
  const urlMatch = description.match(/Project URL:\s*([^\s\n\r]+)/i);
  const rawProjectUrl = urlMatch ? urlMatch[1].trim() : '';
  const cleanDescription = description
    .replace(/Project URL:\s*[^\s\n\r]+/i, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  const getTitleClass = (text: string) => {
    const len = text.length;
    if (len > 50) return "text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight";
    if (len > 25) return "text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight";
    return "text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight";
  };

  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const renderGallery = (isMobileView: boolean) => {
    const images = projectImages;
    if (images.length === 0) {
      return (
        <div className={`relative flex items-center justify-center bg-muted/20 border border-border/40 aspect-video rounded-xl`}>
          <span className="text-sm text-muted-foreground font-medium">No images available</span>
        </div>
      );
    }

    const hasMultiple = images.length > 1;

    return (
      <div className={`relative group select-none overflow-hidden bg-black/5 dark:bg-black/40 border border-border/40 aspect-video rounded-xl`}>
        <img
          src={images[galleryIndex]}
          alt={project?.title || "Project image"}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => {
            setFullscreenImageIndex(galleryIndex);
            setIsFullscreenOpen(true);
          }}
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGalleryIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/85 hover:bg-background text-foreground shadow-sm flex items-center justify-center border border-border focus:outline-none cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGalleryIndex((prev) => (prev + 1) % images.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/85 hover:bg-background text-foreground shadow-sm flex items-center justify-center border border-border focus:outline-none cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="absolute bottom-4 right-4 px-3 py-1 rounded-md bg-black/60 text-white text-xs font-semibold tracking-wider backdrop-blur-sm">
              {galleryIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-muted-foreground animate-pulse">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 px-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{error || 'Project not found'}</p>
          <Button variant="outline" onClick={() => safeBack('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      <Navbar />
      {isMobile ? (
        <main className="px-4 py-4 space-y-4">
          {/* Back Button */}
          <div>
            <Button
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium"
              onClick={() => safeBack('/projects')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Projects
            </Button>
          </div>

          {/* 1. Large Gallery */}
          <div className="w-full">
            {renderGallery(true)}
          </div>

          {/* 2. Project Title */}
          <div className="space-y-0.5">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground leading-tight">
              {project.title}
            </h1>
          </div>

          {/* 3. Unified Metadata Card */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border/40 pt-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Owner</span>
              <span className="text-xs font-bold text-foreground">{project.studentName}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Department</span>
              <span className="text-xs font-bold text-foreground">{project.studentDepartment || 'CSE'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Year</span>
              <span className="text-xs font-bold text-foreground">{project.academicYear}</span>
            </div>
            {rawProjectUrl && isValidUrl(rawProjectUrl) && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Project URL</span>
                <a
                  href={rawProjectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 break-all"
                >
                  Link <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {project.collaboratorNames && project.collaboratorNames.length > 0 && (
              <div className="col-span-2 flex flex-col gap-0.5 border-t border-border/20 pt-2">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Collaborators</span>
                <span className="text-xs font-bold text-foreground">{project.collaboratorNames.join(', ')}</span>
              </div>
            )}
          </div>

          {/* 4. Description */}
          <div className="border-t border-border/40 pt-3 space-y-1">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">Description</span>
            <p className="whitespace-pre-line text-sm text-foreground/80 leading-relaxed font-sans font-normal">
              {cleanDescription || 'No description available.'}
            </p>
          </div>

          {/* 5. Compact Statistics */}
          <div className="border-t border-border/40 pt-3">
            <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-muted/30 border border-border/40 rounded-xl">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Likes</span>
                <span className="text-sm font-bold text-foreground">{project.likes}</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center border-x border-border/40">
                <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Views</span>
                <span className="text-sm font-bold text-foreground">{views ?? project.views}</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Saved</span>
                <span className="text-sm font-bold text-foreground">{project.savedBy?.length ?? 0}</span>
              </div>
            </div>
          </div>

          {/* 6. Action Buttons */}
          <div className="border-t border-border/40 pt-3">
            <div className={`grid gap-2.5 ${isOwner ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <Button
                variant={project.userHasLiked ? 'default' : 'outline'}
                className={`h-10 rounded-full font-medium gap-1.5 active:scale-95 cursor-pointer text-xs ${
                  project.userHasLiked
                    ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                    : 'hover:text-red-500 hover:border-red-500 bg-background text-foreground'
                }`}
                onClick={handleLike}
              >
                <Heart className="w-3.5 h-3.5" fill={project.userHasLiked ? 'currentColor' : 'none'} />
                {project.userHasLiked ? 'Liked' : 'Like'}
              </Button>

              <Button
                variant={isSaved ? 'default' : 'outline'}
                className={`h-10 rounded-full font-medium gap-1.5 active:scale-95 cursor-pointer text-xs ${
                  isSaved
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                    : 'hover:text-yellow-500 hover:border-yellow-500 bg-background text-foreground'
                }`}
                onClick={handleSave}
              >
                <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>

              {isOwner && (
                <Button
                  variant="outline"
                  className="h-10 rounded-full border border-red-500/80 hover:bg-red-50/10 text-red-500 hover:text-red-600 hover:border-red-600 font-medium gap-1.5 active:scale-95 cursor-pointer bg-background text-xs"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              )}

              <Button
                variant="outline"
                className={`h-10 rounded-full font-medium gap-1.5 hover:bg-muted/50 cursor-pointer text-foreground bg-background text-xs ${isOwner ? 'col-span-3' : 'col-span-2'}`}
                onClick={() => {
                  const targetPath = project.studentId === currentStudentId
                    ? '/profile'
                    : `/student/${project.studentId}`;
                  router.push(targetPath);
                }}
              >
                <User className="w-3.5 h-3.5" />
                View Profile
              </Button>

              {isOwner && (
                <Button
                  variant="outline"
                  className="h-10 rounded-full font-medium gap-1.5 col-span-3 border-dashed hover:bg-muted/50 cursor-pointer text-foreground bg-background text-xs"
                  onClick={openEditModal}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Project Details
                </Button>
              )}
            </div>
          </div>

          {/* 7. Manage Collaborators */}
          {project && isOwner && (
            <div className="border-t border-border/40 pt-3">
              <div className="border border-border/60 bg-muted/10 p-3.5 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Manage Collaborators ({project.allCollaborators?.length || 0})
                  </h3>
                  <Button
                    onClick={() => setIsAddDrawerOpen(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-full px-2.5 active:scale-95 text-[9px] h-6 cursor-pointer"
                  >
                    + Add
                  </Button>
                </div>
                {project.allCollaborators && project.allCollaborators.length > 0 ? (
                  <div
                    className={`divide-y divide-border/40 ${
                      project.allCollaborators.length > 3
                        ? 'max-h-[300px] overflow-y-auto overflow-x-hidden pr-2'
                        : ''
                    }`}
                    style={
                      project.allCollaborators.length > 3
                        ? {
                            WebkitOverflowScrolling: 'touch',
                            scrollbarWidth: 'thin',
                          }
                        : undefined
                    }
                  >
                    {project.allCollaborators.map((collab: any) => (
                      <div key={collab.studentId} className="py-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {collab.avatar ? (
                            <img src={collab.avatar} alt={collab.name} className="rounded-full object-cover border border-border w-7.5 h-7.5" />
                          ) : (
                            <div className="rounded-full bg-primary/10 flex items-center justify-center text-primary w-7.5 h-7.5 text-[10px] font-bold">
                              {collab.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-foreground text-xs">{collab.name}</h4>
                            <p className="text-muted-foreground font-mono text-[8px]">{collab.studentId}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                collab.status === 'ACCEPTED' ? 'bg-green-500' :
                                collab.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></span>
                              <span className="font-medium text-muted-foreground capitalize text-[8px]">{collab.status.toLowerCase()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {collab.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[8px] h-5.5 px-1.5 rounded cursor-pointer"
                              onClick={() => handleManageCollaborator(collab.studentId, 'cancel')}
                            >
                              Cancel
                            </Button>
                          )}
                          {collab.status === 'REJECTED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-primary/30 text-primary hover:bg-primary hover:text-white text-[8px] h-5.5 px-1.5 rounded cursor-pointer"
                              onClick={() => handleManageCollaborator(collab.studentId, 'invite')}
                            >
                              Reinvite
                            </Button>
                          )}
                          {collab.status === 'ACCEPTED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[8px] h-5.5 px-1.5 rounded cursor-pointer"
                              onClick={() => handleManageCollaborator(collab.studentId, 'remove')}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground text-center py-1.5">No collaborators added yet.</p>
                )}
              </div>
            </div>
          )}
        </main>
      ) : (
        <main className="max-w-[1400px] mx-auto px-6 py-12 md:py-20">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="h-auto p-0 hover:bg-transparent text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium"
              onClick={() => safeBack('/projects')}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
          </div>

          {/* Two Column Layout (60% Left, 40% Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-start">
            {/* LEFT (60%) */}
            <div className="lg:col-span-6 space-y-6">
              {renderGallery(false)}
            </div>

            {/* RIGHT (40%) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Project Title */}
              <div className="space-y-3">
                <h1 className={getTitleClass(project.title)}>
                  {project.title}
                </h1>
              </div>

              {/* Premium Info List */}
              <div className="border-t border-border/60 divide-y divide-border/40">
                <div className="py-4 flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</span>
                  <span className="text-sm font-bold text-foreground">{project.studentName}</span>
                </div>
                {project.collaboratorNames && project.collaboratorNames.length > 0 && (
                  <div className="py-4 flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Collaborators</span>
                    <span className="text-sm font-bold text-foreground">{project.collaboratorNames.join(', ')}</span>
                  </div>
                )}
                <div className="py-4 flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</span>
                  <span className="text-sm font-bold text-foreground">{project.academicYear}</span>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</span>
                  <span className="text-sm font-bold text-foreground">{project.studentDepartment || 'CSE'}</span>
                </div>
                {rawProjectUrl && isValidUrl(rawProjectUrl) && (
                  <div className="py-4 flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project URL</span>
                    <a
                      href={rawProjectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1.5 break-all text-right"
                    >
                      {rawProjectUrl.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</h3>
                <p className="whitespace-pre-line text-sm text-foreground/80 leading-relaxed font-sans font-normal">
                  {cleanDescription || 'No description available.'}
                </p>
              </div>

              {/* Compact Statistics */}
              <div className="grid grid-cols-3 gap-4 py-4 px-6 bg-muted/30 border border-border/40 rounded-xl">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Likes</span>
                  <span className="text-xl font-bold text-foreground">{project.likes}</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center border-x border-border/40">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Views</span>
                  <span className="text-xl font-bold text-foreground">{views ?? project.views}</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Saved</span>
                  <span className="text-xl font-bold text-foreground">{project.savedBy?.length ?? 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`grid gap-3 pt-2 ${isOwner ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <Button
                  variant={project.userHasLiked ? 'default' : 'outline'}
                  className={`h-11 rounded-xl font-medium gap-2 active:scale-95 cursor-pointer ${
                    project.userHasLiked
                      ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                      : 'hover:text-red-500 hover:border-red-500 bg-background text-foreground'
                  }`}
                  onClick={handleLike}
                >
                  <Heart className="w-4 h-4" fill={project.userHasLiked ? 'currentColor' : 'none'} />
                  {project.userHasLiked ? 'Liked' : 'Like'}
                </Button>

                <Button
                  variant={isSaved ? 'default' : 'outline'}
                  className={`h-11 rounded-xl font-medium gap-2 active:scale-95 cursor-pointer ${
                    isSaved
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500'
                      : 'hover:text-yellow-500 hover:border-yellow-500 bg-background text-foreground'
                  }`}
                  onClick={handleSave}
                >
                  <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? 'Saved' : 'Save'}
                </Button>

                {isOwner && (
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border border-red-500/80 hover:bg-red-50/10 text-red-500 hover:text-red-600 hover:border-red-600 font-medium gap-2 active:scale-95 cursor-pointer bg-background"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                )}

                <Button
                  variant="outline"
                  className={`h-11 rounded-xl font-medium gap-2 hover:bg-muted/50 cursor-pointer text-foreground bg-background ${isOwner ? 'col-span-3' : 'col-span-2'}`}
                  onClick={() => {
                    const targetPath = project.studentId === currentStudentId
                      ? '/profile'
                      : `/student/${project.studentId}`;
                    router.push(targetPath);
                  }}
                >
                  <User className="w-4 h-4" />
                  View Profile
                </Button>

                {isOwner && (
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl font-medium gap-2 col-span-3 border-dashed hover:bg-muted/50 cursor-pointer text-foreground bg-background"
                    onClick={openEditModal}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Project Details
                  </Button>
                )}
              </div>

              {/* Manage Collaborators Section */}
              {project && isOwner && (
                <div className="border border-border/60 bg-muted/10 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Manage Collaborators</h3>
                    <Button
                      onClick={() => setIsAddDrawerOpen(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-full px-4 active:scale-95 text-xs h-8 cursor-pointer"
                    >
                      + Add
                    </Button>
                  </div>
                  {project.allCollaborators && project.allCollaborators.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {project.allCollaborators.map((collab: any) => (
                        <div key={collab.studentId} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {collab.avatar ? (
                              <img src={collab.avatar} alt={collab.name} className="rounded-full object-cover border border-border w-9 h-9" />
                            ) : (
                              <div className="rounded-full bg-primary/10 flex items-center justify-center text-primary w-9 h-9 text-sm font-bold">
                                {collab.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-foreground text-xs">{collab.name}</h4>
                              <p className="text-muted-foreground font-mono text-[10px]">{collab.studentId}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  collab.status === 'ACCEPTED' ? 'bg-green-500' :
                                  collab.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></span>
                                <span className="font-medium text-muted-foreground capitalize text-[9px]">{collab.status.toLowerCase()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {collab.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[10px] h-7 px-2 rounded-lg cursor-pointer"
                                onClick={() => handleManageCollaborator(collab.studentId, 'cancel')}
                              >
                                Cancel
                              </Button>
                            )}
                            {collab.status === 'REJECTED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-primary/30 text-primary hover:bg-primary hover:text-white text-[10px] h-7 px-2 rounded-lg cursor-pointer"
                                onClick={() => handleManageCollaborator(collab.studentId, 'invite')}
                              >
                                Reinvite
                              </Button>
                            )}
                            {collab.status === 'ACCEPTED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-[10px] h-7 px-2 rounded-lg cursor-pointer"
                                onClick={() => handleManageCollaborator(collab.studentId, 'remove')}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No collaborators added yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* Edit Project Dialog (accessible on both Mobile and Desktop) */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[780px] w-full p-6 rounded-2xl bg-white dark:bg-card border border-border shadow-lg duration-200 flex flex-col max-h-[90vh]">
          <DialogHeader className="flex flex-row justify-between items-center border-b pb-4 mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">Edit Project</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-6 text-left max-h-[60vh]">
              {editError && (
                <div className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 p-3 rounded-lg text-xs font-semibold">
                  {editError}
                </div>
              )}

              {/* Section 1: Project Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1">
                  Section 1: Project Information
                </h3>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Project Title *
                  </label>
                  <Input
                    placeholder="Project Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-10 text-sm rounded-xl focus-visible:ring-primary focus-visible:border-primary border-border"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Description *
                  </label>
                  <Textarea
                    placeholder="Description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="text-sm rounded-xl min-h-[100px] focus-visible:ring-primary focus-visible:border-primary border-border"
                    required
                  />
                </div>
              </div>

              {/* Section 3: Links */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1">
                  Section 3: Project URL
                </h3>
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Project URL (Optional)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={editProjectUrl}
                    onChange={(e) => setEditProjectUrl(e.target.value)}
                    className="h-10 text-sm rounded-xl focus-visible:ring-primary focus-visible:border-primary border-border"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block leading-tight">
                    Link to your live project, GitHub repo, or portfolio
                  </span>
                </div>
              </div>

              {/* Section 4: Collaborators */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-1">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Section 4: Collaborators
                  </h3>
                  <span className="text-xs font-semibold text-muted-foreground">
                    ({editCollaborators.length} / 4)
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search student by Name or Registration Number"
                      value={editCollabSearchQuery}
                      onChange={(e) => setEditCollabSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full rounded-xl text-sm h-10 focus-visible:ring-primary focus-visible:border-primary border-border"
                    />

                    {isEditCollabSearching ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        Searching...
                      </div>
                    ) : editCollabSearchResults.length > 0 && (
                      <Card className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto border border-border shadow-lg bg-white dark:bg-card divide-y divide-border rounded-xl">
                        {editCollabSearchResults.map((student) => {
                          const isAlreadySelected = editCollaborators.some(c => c.id === student.id);
                          return (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                                    {student.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="text-left">
                                  <div className="font-semibold text-xs text-foreground">{student.name}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono">{student.id}</div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs rounded-lg h-7 px-2.5"
                                disabled={isAlreadySelected || editCollaborators.length >= 4}
                                onClick={() => {
                                  setEditCollaborators(prev => [...prev, student]);
                                  setEditCollabSearchQuery('');
                                  setEditCollabSearchResults([]);
                                }}
                              >
                                {isAlreadySelected ? 'Added' : 'Add'}
                              </Button>
                            </div>
                          );
                        })}
                      </Card>
                    )}
                  </div>

                  {editCollaborators.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editCollaborators.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-full border border-border/80 bg-muted/20 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
                        >
                          {student.avatar ? (
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-foreground max-w-[120px] truncate">{student.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">({student.id})</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditCollaborators(prev => prev.filter(c => c.id !== student.id));
                            }}
                            className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Project Gallery (Optional) */}
              <div className="space-y-4">
                <div className="flex flex-col">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1">
                    Section 5: Project Gallery (Optional)
                  </h3>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    You can upload up to 10 project images.
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {editGalleryImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted/10 group">
                      <img src={img.preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {/* Order Indicator */}
                      <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {idx + 1}
                      </span>
                      
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditGalleryImage(idx)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white active:scale-95 transition-transform"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {editGalleryImages.length < 10 && (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border/60 bg-muted/20 active:bg-muted/30 cursor-pointer transition-colors p-4 text-center">
                      <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                      <span className="text-xs font-semibold text-muted-foreground">Add Image</span>
                      <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP (Max 5MB)</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleEditGalleryChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex justify-between items-center pt-4 border-t mt-4 bg-white dark:bg-card">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="h-10 px-5 rounded-xl text-xs font-semibold"
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 px-5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-white"
                disabled={isSavingEdit}
              >
                {isSavingEdit ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] w-full p-6 rounded-2xl bg-white dark:bg-card border border-border shadow-lg">
          <DialogHeader className="border-b pb-3 mb-4 text-left">
            <DialogTitle className="text-lg font-bold text-foreground">Delete Project?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteProject}
              className="h-10 px-5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isFullscreenOpen && projectImages.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 text-white p-4 select-none antialiased"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div className="flex justify-between items-center w-full h-12 px-2 z-10">
            <div className="text-sm font-semibold tracking-wider opacity-90">
              {fullscreenImageIndex + 1} / {projectImages.length}
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Main Body */}
          <div className="relative flex-1 flex items-center justify-center w-full min-h-0">
            {/* Center Image */}
            <div className="relative max-w-full max-h-full flex items-center justify-center p-4">
              <img
                src={projectImages[fullscreenImageIndex]}
                alt={project?.title || 'Fullscreen project image'}
                className="max-w-full max-h-[70vh] md:max-h-[75vh] object-contain select-none shadow-2xl rounded-lg"
              />
            </div>

            {/* Left circular navigation arrow */}
            {projectImages.length > 1 && (
              <button
                type="button"
                onClick={() => setFullscreenImageIndex((prev) => (prev - 1 + projectImages.length) % projectImages.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/30 text-white shadow-md flex items-center justify-center focus:outline-none transition-none"
              >
                <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}

            {/* Right circular navigation arrow */}
            {projectImages.length > 1 && (
              <button
                type="button"
                onClick={() => setFullscreenImageIndex((prev) => (prev + 1) % projectImages.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/30 text-white shadow-md flex items-center justify-center focus:outline-none transition-none"
              >
                <ChevronRight className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails (Desktop Only) */}
          {!isMobile && projectImages.length > 1 && (
            <div className="w-full flex justify-center py-4 z-10 border-t border-white/10 bg-black/40">
              <div className="flex gap-2.5 overflow-x-auto pb-1 max-w-2xl scrollbar-none">
                {projectImages.map((imgUrl, idx) => {
                  const isActive = idx === fullscreenImageIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFullscreenImageIndex(idx)}
                      className="w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 focus:outline-none transition-none"
                      style={{
                        borderColor: isActive ? 'var(--primary, #3b82f6)' : 'transparent',
                        opacity: isActive ? 1 : 0.5,
                      }}
                    >
                      <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preload adjacent images */}
          <div style={{ display: 'none' }}>
            <img src={projectImages[(fullscreenImageIndex + 1) % projectImages.length]} alt="preload-next" />
            <img src={projectImages[(fullscreenImageIndex - 1 + projectImages.length) % projectImages.length]} alt="preload-prev" />
          </div>
        </div>
      )}
    </div>
  );
}
