'use client';
import { apiUpdateStudent } from "@/lib/api";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CollaborationsModal } from '@/components/CollaborationsModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ProjectsList } from '@/components/ProjectsList';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import type { Project, AcademicYear } from '@/lib/data';
import {
  Mail,
  Briefcase,
  Users,
  BookOpen,
  Network,
  Zap,
  Upload,
  Edit2,
  X,
  Code,
  Linkedin,
  MessageSquare,
  Bookmark,
  Github,
} from 'lucide-react';
import { getStudentStats, getCurrentStudentId, initializeStudentStats } from '@/lib/statsTracker';
import type { StudentStats } from '@/lib/statsTracker';
import { useIsMobile } from '@/hooks/use-mobile';

interface StudentData {
  name: string;
  studentId: string;
  department: string;
  year: string;
  section: string;
  email: string;
  profilePhoto?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills?: string[];
}

export default function ProfilePage() {
  const isMobile = useIsMobile();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<StudentData>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'collaborations') {
        setCollabModalOpen(true);
      }
    }
  }, []);

  // Initialize student data from localStorage and CSV
  useEffect(() => {
    const initializeStudent = async () => {
      // Get student ID from auth login
      const studentId = getCurrentStudentId();

      if (!studentId) {
        console.warn('No student ID found. Please log in first.');
        return;
      }

      const storageKey = `studentProfile_${studentId}`;
      const existing = localStorage.getItem(storageKey);
      console.log("existing =", existing);

      try {
        const { apiStudent, apiStats } = await import('@/lib/api');
        const [dbStudent, dbStats] = await Promise.all([apiStudent(studentId), apiStats(studentId).catch(() => null)]);
        if (dbStats) {
          setStats({
            projectsUploaded: dbStats.projectsUploaded,
            connections: dbStats.connections,
            collaborations: dbStats.collaborations,
          });
        } else {
          initializeStudentStats(studentId);
          setStats(getStudentStats(studentId));
        }
        if (dbStudent) {
          console.log("DB Student:", dbStudent);
          const newStudent: StudentData = {
            name: dbStudent.name,
            studentId: dbStudent.userId,
            department: dbStudent.department,
            year: dbStudent.academicYear,
            section: dbStudent.section || 'E',
            email: dbStudent.email || '',
            linkedinUrl: dbStudent.linkedinUrl || '',
            githubUrl: dbStudent.githubUrl || '',
            profilePhoto: dbStudent.avatar || undefined,
            skills: dbStudent.skills || [],
          };
          console.log("DB Student:", dbStudent);
          setStudentData(newStudent);
          localStorage.setItem(storageKey, JSON.stringify(newStudent));
        } else if (existing) {
          const parsed = JSON.parse(existing);
          setStudentData(parsed);
          if (parsed.profilePhoto) setPhotoPreview(parsed.profilePhoto);
        } else {
          const fallback: StudentData = {
            name: localStorage.getItem('studentName') || 'Your Name',
            studentId,
            department: localStorage.getItem('studentDepartment') || 'CSE',
            year: '2nd',
            section: localStorage.getItem('studentSection') || 'E',
            email: localStorage.getItem('studentEmail') || 'your.email@campus.edu',
            linkedinUrl: '',
            githubUrl: '',
            skills: [],
          };
          setStudentData(fallback);
          localStorage.setItem(storageKey, JSON.stringify(fallback));
        }
      } catch (error) {
        console.error('Error loading student data:', error);
        if (existing) {
          const parsed = JSON.parse(existing);
          setStudentData(parsed);
          if (parsed.profilePhoto) setPhotoPreview(parsed.profilePhoto);
        } else {
          initializeStudentStats(studentId);
          setStats(getStudentStats(studentId));
          const fallback: StudentData = {
            name: localStorage.getItem('studentName') || 'Your Name',
            studentId,
            department: localStorage.getItem('studentDepartment') || 'CSE',
            year: '2nd',
            section: localStorage.getItem('studentSection') || 'E',
            email: localStorage.getItem('studentEmail') || 'your.email@campus.edu',
            linkedinUrl: '',
            githubUrl: '',
          };
          setStudentData(fallback);
          localStorage.setItem(storageKey, JSON.stringify(fallback));
        }
      }
    };

    initializeStudent();

    const studentId = getCurrentStudentId();
    if (!studentId) return;
    const interval = setInterval(async () => {
      try {
        const { apiStats } = await import('@/lib/api');
        const s = await apiStats(studentId);
        setStats({ projectsUploaded: s.projectsUploaded, connections: s.connections, collaborations: s.collaborations });
      } catch {
        const cur = getCurrentStudentId();
        if (cur) setStats(getStudentStats(cur));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!studentData?.studentId) return;
      try {
        setProjectsLoading(true);
        const { apiProjects } = await import('@/lib/api');
        const p = await apiProjects({
          studentId: studentData.studentId,
          forUserId: studentData.studentId,
        });

        // Map ApiProject -> Project, normalize academicYear and uploadedAt types
        const normalizeAcademicYear = (val: any): AcademicYear => {
          const s = String(val || '').toLowerCase();
          if (s.startsWith('1')) return '1st';
          if (s.startsWith('2')) return '2nd';
          if (s.startsWith('3')) return '3rd';
          if (s.startsWith('4') || s.includes('final')) return 'final';
          if (s === '1st' || s === '2nd' || s === '3rd' || s === 'final') return s as AcademicYear;
          return 'final';
        };

        const mapped = p.map((pr: any) => ({
          id: pr.id,
          studentId: pr.studentId,
          studentName: pr.studentName,
          academicYear: normalizeAcademicYear(pr.academicYear),
          title: pr.title,
          description: pr.description || '',
          category: pr.category || 'other',
          uploadedAt: pr.uploadedAt ? new Date(pr.uploadedAt) : new Date(),
          likes: pr.likes || 0,
          savedBy: pr.savedBy || [],
          collaborators: pr.collaborators || [],
          thumbnailUrl: pr.thumbnailUrl,
          fileName: pr.fileName,
          fileSize: pr.fileSize,
          repostedBy: pr.repostedBy || [],
        }));

        if (!mounted) return;
        setUserProjects(mapped);
      } catch (e) {
        console.error('Failed to load user projects', e);
      } finally {
        if (mounted) setProjectsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [studentData]);

  const saveProfile = async () => {
    if (!studentData) return;
    if (isUploading) return;

    const githubUrl = editData.githubUrl !== undefined ? editData.githubUrl : studentData.githubUrl;
    if (githubUrl) {
      const trimmed = githubUrl.trim();
      const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+(\/)?$/;
      if (!githubRegex.test(trimmed)) {
        alert("Please enter a valid GitHub profile URL (e.g., https://github.com/username)");
        return;
      }
    }

    let avatarUrl = studentData.profilePhoto;
    setIsUploading(true);

    try {
      // Upload image to Cloudinary
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Image upload failed");
        }

        avatarUrl = data.url;
      }

      // Build payload
      const payload: any = {};

      if (editData.email !== undefined) {
        payload.email = editData.email;
      }

      if (editData.linkedinUrl !== undefined) {
        payload.linkedinUrl = editData.linkedinUrl;
      }

      if (editData.githubUrl !== undefined) {
        payload.githubUrl = editData.githubUrl;
      }

      if (editData.year && editData.year !== studentData.year) {
        payload.academicYear = editData.year;
      }

      if (editData.skills) {
        payload.skills = editData.skills;
      }

      if (avatarUrl !== studentData.profilePhoto) {
        payload.avatar = avatarUrl;
      }

      // Save locally
      const updated: StudentData = {
        ...studentData,
        ...editData,
        profilePhoto: avatarUrl,
      };

      localStorage.setItem(
        `studentProfile_${studentData.studentId}`,
        JSON.stringify(updated)
      );

      setStudentData(updated);

      // Save to backend
      if (Object.keys(payload).length > 0) {
        console.log("apiUpdateStudent =", apiUpdateStudent);
        const res = await apiUpdateStudent(studentData.studentId, payload);
        if (res.success && (payload.avatar !== undefined || payload.profilePhoto !== undefined)) {
          toast.success("Profile photo updated successfully.");
        }
      }

      setIsEditing(false);
      setEditData({});
      setSelectedFile(null);
    } catch (e) {
      console.error("Failed to save profile to server", e);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setEditData(prev => ({ ...prev, profilePhoto: result })); // Keep for immediate feedback
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    setIsPhotoMenuOpen(true);
  };

  const handleRemovePhoto = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!studentData) return;
    setIsUploading(true);

    try {
      const payload = {
        avatar: null,
      };

      const res = await apiUpdateStudent(studentData.studentId, payload);
      
      if (!res.success) {
        throw new Error(res.message || "Failed to remove photo on backend");
      }

      const updated: StudentData = {
        ...studentData,
        profilePhoto: undefined,
      };
      setStudentData(updated);
      setPhotoPreview(null);
      setSelectedFile(null);

      localStorage.setItem(
        `studentProfile_${studentData.studentId}`,
        JSON.stringify(updated)
      );

      toast.success("Profile photo removed successfully.");
      setIsConfirmRemoveOpen(false);
    } catch (err) {
      console.error("Failed to remove profile photo:", err);
      toast.error("Failed to remove profile photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConnectLinkedIn = () => {
    if (studentData?.linkedinUrl) {
      window.open(studentData.linkedinUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!studentData || !stats) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isMobile) {
    if (isEditing) {
      return (
        <>
          <div className="min-h-screen bg-background pb-20 select-none antialiased">
            <Navbar />
            <main className="px-4 py-4 space-y-4">
              <Card className="p-5 rounded-2xl bg-card border border-border/40 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border/20">
                  <h3 className="font-extrabold text-base tracking-tight text-foreground">Edit Profile</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({});
                      setPhotoPreview(studentData.profilePhoto || null);
                    }}
                    className="w-8 h-8 rounded-full animate-none"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>

                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center gap-2 py-2">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    {(photoPreview || studentData.profilePhoto) ? (
                      <img
                        src={photoPreview || studentData.profilePhoto || "/placeholder.svg"}
                        alt={studentData.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary/30"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                        {getInitials(studentData.name)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Tap photo to upload new avatar</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Name (Read Only)</label>
                  <Input value={studentData.name} disabled className="mt-1 bg-muted/40 rounded-xl" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Department</label>
                    <Input value={studentData.department} disabled className="mt-1 bg-muted/40 rounded-xl text-xs h-9" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Year</label>
                    <select
                      value={editData.year || studentData.year}
                      onChange={(e) => setEditData({ ...editData, year: e.target.value })}
                      className="mt-1 bg-muted/45 w-full p-2 rounded-xl text-xs h-9 border border-input focus:outline-none"
                    >
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="final">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-muted-foreground">Section</label>
                    <Input value={studentData.section || 'E'} disabled className="mt-1 bg-muted/40 rounded-xl text-xs h-9" />
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground -mt-2">
                  Section cannot be changed from official records.
                </p>
                
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={editData.email !== undefined ? editData.email : (studentData.email && studentData.email !== 'Not provided' ? studentData.email : '')}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">LinkedIn URL</label>
                  <Input
                    type="url"
                    value={editData.linkedinUrl !== undefined ? editData.linkedinUrl : (studentData.linkedinUrl || '')}
                    onChange={(e) => setEditData({ ...editData, linkedinUrl: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">GitHub URL</label>
                  <Input
                    type="url"
                    value={editData.githubUrl !== undefined ? editData.githubUrl : (studentData.githubUrl || '')}
                    onChange={(e) => setEditData({ ...editData, githubUrl: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>

                {/* Skills Editor */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Skills</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(editData.skills || studentData.skills || []).map((s) => (
                      <Badge key={s} variant="secondary" className="flex items-center gap-1 text-[10px] py-1 px-2.5 rounded-lg border-none">
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = (editData.skills || studentData.skills || []).filter(sk => sk !== s);
                            setEditData({ ...editData, skills: next });
                          }}
                          className="text-muted-foreground hover:text-destructive animate-none"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add skill..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && skillInput.trim()) {
                          e.preventDefault();
                          const existing = Array.from(new Set([...(editData.skills || studentData.skills || []), skillInput.trim()]));
                          setEditData({ ...editData, skills: existing });
                          setSkillInput('');
                        }
                      }}
                      className="h-9 text-xs rounded-xl"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!skillInput.trim()) return;
                        const existing = Array.from(new Set([...(editData.skills || studentData.skills || []), skillInput.trim()]));
                        setEditData({ ...editData, skills: existing });
                        setSkillInput('');
                      }}
                      className="h-9 px-3 rounded-xl font-bold text-xs text-white"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({});
                      setPhotoPreview(studentData.profilePhoto || null);
                    }}
                    variant="outline"
                    className="flex-1 rounded-xl py-5 font-bold text-xs"
                  >
                    Cancel
                  </Button>
                  <Button onClick={saveProfile} className="flex-1 rounded-xl py-5 font-bold text-xs text-white">
                    Save
                  </Button>
                </div>
              </Card>
            </main>
          </div>

          {/* Hidden file input for Replace Photo */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Mobile Bottom Sheet action menu */}
          <Drawer open={isPhotoMenuOpen} onOpenChange={setIsPhotoMenuOpen}>
            <DrawerContent className="p-4 rounded-t-2xl bg-white dark:bg-card">
              <DrawerHeader className="text-center pb-4">
                <DrawerTitle className="text-sm font-semibold text-muted-foreground">Profile Photo Management</DrawerTitle>
              </DrawerHeader>
              <div className="space-y-3 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPhotoMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full rounded-xl py-5 text-sm font-semibold flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  📷 Replace Photo
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setIsPhotoMenuOpen(false);
                    setIsConfirmRemoveOpen(true);
                  }}
                  className="w-full rounded-xl py-5 text-sm font-semibold flex items-center justify-center gap-2"
                  disabled={isUploading || (!photoPreview && !studentData.profilePhoto)}
                >
                  🗑 Remove Photo
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsPhotoMenuOpen(false)}
                  className="w-full rounded-xl py-5 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  ✕ Cancel
                </Button>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Remove Confirmation Dialog */}
          <AlertDialog open={isConfirmRemoveOpen} onOpenChange={setIsConfirmRemoveOpen}>
            <AlertDialogContent className="bg-white dark:bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Profile Photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your current profile picture will be removed. You can upload a new one anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUploading}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isUploading}
                  onClick={handleRemovePhoto}
                  className="bg-destructive hover:bg-destructive/90 text-white"
                >
                  {isUploading ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2 animate-spin text-white" />
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Global sonner toaster notifications */}
          <Toaster />
        </>
      );
    }

    return (
      <div className="min-h-screen bg-background pb-20 select-none antialiased">
        <Navbar />

        <main className="px-4 py-4 space-y-5">
          {/* Main Card */}
          <Card className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm space-y-4">
            {/* Image + Info Row */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-shrink-0">
                {(photoPreview || studentData.profilePhoto) ? (
                  <img
                    src={photoPreview || studentData.profilePhoto}
                    alt={studentData.name}
                    className="w-20 h-20 rounded-full object-cover border border-primary/10"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                    {getInitials(studentData.name)}
                  </div>
                )}
                {/* Available for Collaboration Green Dot Indicator */}
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-card" />
              </div>

              <div className="flex-1 min-w-0 space-y-1 text-left">
                <h2 className={`font-extrabold text-foreground tracking-tight leading-tight break-words ${
                  studentData.name.length > 25 ? 'text-[13px]' :
                  studentData.name.length > 18 ? 'text-base' : 'text-lg'
                }`}>
                  {studentData.name}
                </h2>
                <p className="text-xs font-semibold text-muted-foreground/80 break-all leading-normal">
                  Registration No: {studentData.studentId}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {studentData.year} Year • {studentData.department} • Section {studentData.section || 'E'}
                </p>
                <p className="text-[10px] text-muted-foreground/80 truncate font-medium">
                  Sir C.R. Reddy College of Engineering
                </p>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-[9px] mt-1.5">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Available for Collaboration
                </div>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-border/20 text-center">
              <div>
                <div className="font-extrabold text-foreground text-base leading-tight">
                  {stats.projectsUploaded}
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">Projects</span>
              </div>
              <div className="border-l border-border/20">
                <div className="font-extrabold text-foreground text-base leading-tight">
                  {stats.connections}
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">Connections</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-2.5">
              <Button
                onClick={() => {
                  setIsEditing(true);
                  setEditData({ skills: studentData.skills || [] });
                }}
                className="flex-1 bg-primary text-primary-foreground font-bold text-xs h-9.5 rounded-xl border-none shadow-none text-white"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
              <Link href="/saved-projects" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full font-bold text-xs h-9.5 rounded-xl border-border/50 shadow-none text-muted-foreground"
                >
                  <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                  Saved Projects
                </Button>
              </Link>
            </div>
          </Card>

          {/* Skills Section */}
          <div className="space-y-2.5 text-left">
            <h3 className="font-extrabold text-base tracking-tight text-foreground">Skills</h3>
            {studentData.skills && studentData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {studentData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm border-none select-none active:scale-95 transition-all duration-150"
                  >
                    <Code className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{skill}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <Card className="p-4 text-center bg-card/45 border-border/40 rounded-2xl">
                <p className="text-xs text-muted-foreground">No skills added yet.</p>
              </Card>
            )}
          </div>

          {/* My Projects Scroll List */}
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base tracking-tight text-foreground">My Projects</h3>
              <Badge className="bg-primary/10 text-primary border-none shadow-none font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                {userProjects.length}
              </Badge>
            </div>
            
            {userProjects.length > 0 ? (
              <div className="flex overflow-x-auto gap-3 pb-3 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
                {userProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="w-[280px] p-4 flex-shrink-0 bg-card/50 border border-border/45 rounded-2xl shadow-sm space-y-3.5 snap-start flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-sm truncate text-foreground leading-snug">{project.title}</h4>
                      <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                    
                    <div className="space-y-2.5 pt-2 border-t border-border/20">
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                        <span>{project.category}</span>
                        <span className="flex items-center gap-0.5">
                          👍 {project.likes}
                        </span>
                      </div>

                      <Link href={`/projects/${encodeURIComponent(project.id)}?from=profile`} className="block w-full">
                        <Button size="sm" className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] py-3.5 rounded-xl border-none shadow-none h-8.5">
                          View Project
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center bg-card/45 border-border/40 rounded-2xl">
                <p className="text-xs text-muted-foreground">No projects uploaded yet.</p>
              </Card>
            )}
          </div>

          {/* Connect Section */}
          <div className="space-y-3 pb-6">
            <h3 className="font-extrabold text-base tracking-tight text-foreground text-center">Connect</h3>
            <div className="flex gap-4 justify-center items-center pt-1">
              {studentData.githubUrl && (
                <a
                  href={studentData.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center border border-border/40 active:scale-90 transition-transform"
                >
                  <Github className="w-5 h-5 text-foreground" />
                </a>
              )}
              {studentData.linkedinUrl && (
                <a
                  href={studentData.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center border border-border/40 active:scale-90 transition-transform"
                >
                  <Linkedin className="w-5 h-5 text-blue-600 fill-blue-600/10" />
                </a>
              )}
              {studentData.email && (
                <a
                  href={`mailto:${studentData.email}`}
                  className="w-12 h-12 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center border border-border/40 active:scale-90 transition-transform"
                >
                  <Mail className="w-5 h-5 text-foreground" />
                </a>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <Card className="p-8 mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Profile Photo */}
           <div className="relative group">
  {(photoPreview || studentData.profilePhoto) ? (
    <img
      src={photoPreview || studentData.profilePhoto || "/placeholder.svg"}
      alt={studentData.name}
      className="w-24 h-24 rounded-full object-cover border-4 border-primary/30"
    />
  ) : (
    <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold">
      {getInitials(studentData.name)}
    </div>
  )}

  {isEditing && (
    <Popover open={isPhotoMenuOpen} onOpenChange={setIsPhotoMenuOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none outline-none"
        >
          <Upload className="w-5 h-5 text-white" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-56 p-2 rounded-xl border border-border shadow-lg bg-white dark:bg-card">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              setIsPhotoMenuOpen(false);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-semibold hover:bg-muted rounded-lg transition-colors border-none bg-transparent cursor-pointer text-foreground"
            disabled={isUploading}
          >
            📷 Replace Photo
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPhotoMenuOpen(false);
              setIsConfirmRemoveOpen(true);
            }}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
            disabled={isUploading || (!photoPreview && !studentData.profilePhoto)}
          >
            🗑 Remove Photo
          </button>
          <div className="h-px bg-border my-1" />
          <button
            type="button"
            onClick={() => setIsPhotoMenuOpen(false)}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-semibold hover:bg-muted rounded-lg transition-colors border-none bg-transparent cursor-pointer text-foreground"
          >
            ✕ Cancel
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )}
</div>

            {/* Profile Info */}
            {!isEditing ? (
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className={`font-bold tracking-tight break-words leading-tight ${
                    studentData.name.length > 25 ? 'text-xl' :
                    studentData.name.length > 18 ? 'text-2xl' : 'text-3xl'
                  }`}>{studentData.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4" />
                    {studentData.year} Year
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {studentData.email}
                  </div>
                  <Badge className="bg-primary/20 text-primary">
                    {studentData.department}
                  </Badge>
                  <Badge className="bg-accent/20 text-accent">
                    Section {studentData.section || 'E'}
                  </Badge>

                  {/* Skills display */}
                  {studentData.skills && studentData.skills.length > 0 && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-muted-foreground">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {studentData.skills.map((skill) => (
                          <Badge
                            key={skill}
                            className="h-9 px-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm border-none select-none active:scale-95 transition-all duration-150"
                          >
                            <Code className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{skill}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium">Student Name (Read Only)</label>
                  <Input
                    value={studentData.name}
                    disabled
                    className="mt-1 bg-muted cursor-not-allowed"
                    title="Name cannot be changed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Name cannot be changed from official records
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <Input
                      value={studentData.department}
                      disabled
                      className="mt-1 bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Cannot be changed - from official records
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <select
                      value={editData.year || studentData.year}
                      onChange={(e) => setEditData({ ...editData, year: e.target.value })}
                      className="mt-1 bg-muted w-full p-2 rounded h-10 border border-input bg-background"
                    >
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="final">4th Year</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select your academic year
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Section</label>
                    <Input
                      value={studentData.section || 'E'}
                      disabled
                      className="mt-1 bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Section cannot be changed from official records.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={editData.email !== undefined ? editData.email : (studentData.email && studentData.email !== 'Not provided' ? studentData.email : '')}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">LinkedIn Profile URL</label>
                  <Input
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={editData.linkedinUrl !== undefined ? editData.linkedinUrl : (studentData.linkedinUrl || '')}
                    onChange={(e) =>
                      setEditData({ ...editData, linkedinUrl: e.target.value })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for connection and collaboration features
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">GitHub Profile URL</label>
                  <Input
                    type="url"
                    placeholder="https://github.com/yourusername"
                    value={editData.githubUrl !== undefined ? editData.githubUrl : (studentData.githubUrl || '')}
                    onChange={(e) =>
                      setEditData({ ...editData, githubUrl: e.target.value })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your GitHub profile link (optional)
                  </p>
                </div>

                {/* Skills editor */}
                <div>
                  <label className="text-sm font-medium">Skills</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(editData.skills || studentData.skills || []).map((s) => (
                      <span key={s} className="inline-flex items-center gap-2 bg-muted/60 px-2 py-1 rounded-full text-xs">
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = (editData.skills || studentData.skills || []).filter(sk => sk !== s);
                            setEditData({ ...editData, skills: next });
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input
                      placeholder="Add a skill and press Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && skillInput.trim()) {
                          const existing = Array.from(new Set([...(editData.skills || studentData.skills || []), skillInput.trim()]));
                          setEditData({ ...editData, skills: existing });
                          setSkillInput('');
                        }
                      }}
                      className="flex-1 mt-0"
                    />
                    <Button
                      onClick={() => {
                        if (!skillInput.trim()) return;
                        const existing = Array.from(new Set([...(editData.skills || studentData.skills || []), skillInput.trim()]));
                        setEditData({ ...editData, skills: existing });
                        setSkillInput('');
                      }}
                      className="ml-1"
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Add skills that represent your expertise (e.g., React, Python)</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {!isEditing ? (
                <>
                  <Button
                    onClick={() => {
                      setIsEditing(true);
                      setEditData({ skills: studentData.skills || [] });
                    }}
                    className="smooth-button bg-primary text-primary-foreground"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Link href="/saved-projects" className="w-full">
                    <Button variant="outline" className="w-full smooth-button gap-2">
                      <Bookmark className="w-4 h-4" />
                      Saved Projects
                    </Button>
                  </Link>
                  {studentData.linkedinUrl && (
                    <Button
                      onClick={handleConnectLinkedIn}
                      className="smooth-button bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={saveProfile}
                    className="smooth-button bg-accent text-accent-foreground"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({});
                      setPhotoPreview(
                        studentData.profilePhoto || null
                      );
                    }}
                    variant="outline"
                    className="smooth-button"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Profile Statistics - Auto-updating from real activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-4 mb-8">
          {[
            {
              icon: BookOpen,
              label: 'Projects Uploaded',
              value: stats.projectsUploaded,
              color: 'from-blue-500 to-blue-600',
              clickable: false,
              description: 'Projects created by this user.',
            },
            {
              icon: Zap,
              label: 'Collaborations',
              value: stats.collaborations,
              color: 'from-purple-500 to-purple-600',
              clickable: true,
              description: 'Projects where this user is a collaborator.',
            },
          ].map((stat, idx) => (
            <Card
              key={idx}
              onClick={stat.clickable ? () => setCollabModalOpen(true) : undefined}
              className={`p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition relative overflow-hidden ${
                stat.clickable ? 'cursor-pointer hover:border-primary/50 hover:bg-card/75' : ''
              }`}
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 hover:opacity-5 smooth-transition pointer-events-none`}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-balance transition-all duration-300">
                      {stat.value}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Activity Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full md:w-fit grid-cols-3 gap-2 smooth-transition">
            <TabsTrigger value="overview" className="smooth-transition">
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects" className="smooth-transition">
              Projects
            </TabsTrigger>
            <TabsTrigger value="guide" className="smooth-transition">
              How It Works
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <h2 className="text-2xl font-bold">Your Profile Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                <h3 className="font-bold mb-3">Profile Completeness</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Basic Info</span>
                    <span className="text-xs text-accent">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Profile Photo</span>
                    <span
                      className={`text-xs ${photoPreview ? 'text-accent' : 'text-muted-foreground'
                        }`}
                    >
                      {photoPreview ? '✓ Added' : '○ Not Added'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LinkedIn Profile</span>
                    <span
                      className={`text-xs ${studentData.linkedinUrl ? 'text-accent' : 'text-muted-foreground'
                        }`}
                    >
                      {studentData.linkedinUrl ? '✓ Added' : '○ Not Added'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                <h3 className="font-bold mb-3">Student Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Student ID</p>
                    <p className="font-mono text-xs break-all">
                      {studentData.studentId}
                    </p>
                  </div>
                  {studentData.email && studentData.email !== 'Not provided' && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="break-all">{studentData.email}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Department, Year & Section</p>
                    <p>
                      {studentData.department} • {studentData.year} Year • Section {studentData.section || 'E'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <h2 className="text-2xl font-bold">Your Projects</h2>
            {projectsLoading ? (
              <p className="text-muted-foreground">Loading your projects...</p>
            ) : (
              <ProjectsList
                projects={userProjects}
                from="profile"
                onDelete={async (id) => {
                  setUserProjects((prev) => prev.filter((p) => p.id !== id));
                  try {
                    const studentId = getCurrentStudentId();
                    if (studentId) {
                      const { apiStats } = await import('@/lib/api');
                      const s = await apiStats(studentId);
                      setStats({ projectsUploaded: s.projectsUploaded, connections: s.connections, collaborations: s.collaborations });
                    }
                  } catch (e) {
                    console.error('Failed to reload stats after deletion:', e);
                  }
                }}
              />
            )}
          </TabsContent>

          {/* Guide Tab */}
          <TabsContent value="guide" className="space-y-4">
            <h2 className="text-2xl font-bold">How Statistics Are Tracked</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Projects Uploaded
                </h3>
                <p className="text-sm text-muted-foreground">
                  Automatically increments when you successfully upload a new project to the platform. Each upload is tracked independently.
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Network className="w-5 h-5 text-green-500" />
                  Connections
                </h3>
                <p className="text-sm text-muted-foreground">
                  Increments when you connect with another student via LinkedIn. Each connection is tracked and contributes to your network count.
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Collaborations
                </h3>
                <p className="text-sm text-muted-foreground">
                  Increments when you initiate a collaboration via LinkedIn or Email with another student. Every collaboration action is recorded.
                </p>
              </Card>

              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  Real-Time Updates
                </h3>
                <p className="text-sm text-muted-foreground">
                  All statistics update instantly without page reloads. Your profile reflects your activity in real-time across the platform.
                </p>
              </Card>
            </div>

            <Card className="p-6 bg-accent/10 border-accent/20">
              <h3 className="font-bold mb-2">✨ Smart Activity Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Your profile statistics are completely independent and student-specific. One student's actions never affect another's counts. All data persists across page refreshes and browser sessions using advanced localStorage management.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CollaborationsModal
        studentId={studentData.studentId}
        isOpen={collabModalOpen}
        onClose={() => setCollabModalOpen(false)}
      />

      {/* Hidden file input for Replace Photo */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Mobile Bottom Sheet action menu */}
      {isMobile && isEditing && (
        <Drawer open={isPhotoMenuOpen} onOpenChange={setIsPhotoMenuOpen}>
          <DrawerContent className="p-4 rounded-t-2xl bg-white dark:bg-card">
            <DrawerHeader className="text-center pb-4">
              <DrawerTitle className="text-sm font-semibold text-muted-foreground">Profile Photo Management</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-3 pb-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPhotoMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full rounded-xl py-5 text-sm font-semibold flex items-center justify-center gap-2"
                disabled={isUploading}
              >
                📷 Replace Photo
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setIsPhotoMenuOpen(false);
                  setIsConfirmRemoveOpen(true);
                }}
                className="w-full rounded-xl py-5 text-sm font-semibold flex items-center justify-center gap-2"
                disabled={isUploading || (!photoPreview && !studentData.profilePhoto)}
              >
                🗑 Remove Photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsPhotoMenuOpen(false)}
                className="w-full rounded-xl py-5 text-sm font-semibold flex items-center justify-center gap-2"
              >
                ✕ Cancel
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={isConfirmRemoveOpen} onOpenChange={setIsConfirmRemoveOpen}>
        <AlertDialogContent className="bg-white dark:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current profile picture will be removed. You can upload a new one anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUploading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isUploading}
              onClick={handleRemovePhoto}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isUploading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2 animate-spin text-white" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Global sonner toaster notifications */}
      <Toaster />
    </div>
  );
}
