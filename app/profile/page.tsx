'use client';
import { apiUpdateStudent } from "@/lib/api";
import React from "react"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ProjectsList } from '@/components/ProjectsList';
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
  Linkedin,
  MessageSquare,
  Bookmark,
} from 'lucide-react';
import { getStudentStats, getCurrentStudentId, initializeStudentStats } from '@/lib/statsTracker';
import type { StudentStats } from '@/lib/statsTracker';

interface StudentData {
  name: string;
  studentId: string;
  department: string;
  year: string;
  email: string;
  profilePhoto?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  skills?: string[];
}

export default function ProfilePage() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<StudentData>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
            email: dbStudent.email || 'Not provided',
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

    if (editData.email) {
      payload.email = editData.email;
    }

    if (editData.linkedinUrl) {
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
      await apiUpdateStudent(studentData.studentId, payload);
    }

    setIsEditing(false);
    setEditData({});
    setSelectedFile(null);
  } catch (e) {
    console.error("Failed to save profile to server", e);
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
    <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
      <Upload className="w-5 h-5 text-white" />
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </label>
  )}
</div>

            {/* Profile Info */}
            {!isEditing ? (
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-balance">{studentData.name}</h1>
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

                  {/* Skills display */}
                  {studentData.skills && studentData.skills.length > 0 && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-muted-foreground">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {studentData.skills.map((skill) => (
                          <Badge key={skill} className="bg-muted/20 text-muted-foreground text-xs">{skill}</Badge>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Department (From CSV)</label>
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
                      className="mt-1 bg-muted w-full p-2 rounded"
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
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={editData.email || studentData.email}
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
                    value={editData.linkedinUrl || studentData.linkedinUrl || ''}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: BookOpen,
              label: 'Projects Uploaded',
              value: stats.projectsUploaded,
              color: 'from-blue-500 to-blue-600',
            },
            {
              icon: Network,
              label: 'Connections',
              value: stats.connections,
              color: 'from-green-500 to-green-600',
            },
            {
              icon: Zap,
              label: 'Collaborations',
              value: stats.collaborations,
              color: 'from-purple-500 to-purple-600',
            },
          ].map((stat, idx) => (
            <Card
              key={idx}
              className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition relative overflow-hidden"
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${stat.color} opacity-0 hover:opacity-5 smooth-transition pointer-events-none`}
              />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-linear-to-br ${stat.color} flex items-center justify-center`}>
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
                  Auto-updated based on your activity
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
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="break-all">{studentData.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department & Year</p>
                    <p>
                      {studentData.department} - {studentData.year} Year
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
              <ProjectsList projects={userProjects} onDelete={(id) => setUserProjects(prev => prev.filter(p => p.id !== id))} />
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
    </div>
  );
}
