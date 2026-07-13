'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle, Search, X, Loader2 } from 'lucide-react';
import { incrementProjectsUploaded, getCurrentStudentId } from '@/lib/statsTracker';
import { apiCreateProject } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

interface FormData {
  title: string;
  description: string;
  projectUrl: string;
  category: string;
  department: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

function UploadPageContent() {
  const router = useRouter();

  const isMobile = useIsMobile();
  const [mobileYear, setMobileYear] = useState('');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const y = localStorage.getItem('year');
      if (y === '1') setMobileYear('1st Year');
      else if (y === '2') setMobileYear('2nd Year');
      else if (y === '3') setMobileYear('3rd Year');
      else if (y === '4') setMobileYear('Final Year');
    }
  }, []);

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', 'Final Year'];

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    projectUrl: '',
    category: '',
    department: '',
    videoUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [collabSearchQuery, setCollabSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
          const ownerId = getCurrentStudentId() || localStorage.getItem('studentId') || '';
          const filteredList = list.filter((s: any) => s.id !== ownerId);
          setSearchResults(filteredList);
        }
      } catch (err) {
        console.error('Failed to search students', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [collabSearchQuery]);

  useEffect(() => {
    // Check if user is logged in
    const studentId = localStorage.getItem('studentId');
    const staffId = localStorage.getItem('staffId');
    const adminId = localStorage.getItem('adminId');
    const userType = localStorage.getItem('userType');

    const authenticated = !!(studentId || staffId || adminId || userType);
    setIsLoggedIn(authenticated);
    setIsLoading(false);

    if (!authenticated) {
      // Store that user wants to go to upload page after login
      localStorage.setItem('redirectAfterLogin', '/upload');
      router.push('/auth');
    }
  }, [router]);

  const categories = ['Web Development', 'Mobile App', 'Data Science', 'IoT', 'Machine Learning', 'Other'];
  const departments = ['CSE', 'IT', 'ECE', 'Mechanical', 'Civil', 'Other'];
  const mobileDepartments = [
    'CSE',
    'CSM (Cyber Security)',
    'AI & ML',
    'AI & DS',
    'IT',
    'ECE',
    'Mechanical',
    'Civil',
    'Other'
  ];

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      setThumbnailFile(file);
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Project title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Project description is required');
      return false;
    }
    if (!formData.projectUrl.trim()) {
      setError('Project URL is required');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.department) {
      setError('Please select your department');
      return false;
    }

    // Basic URL validation
    try {
      new URL(formData.projectUrl);
    } catch {
      setError('Please enter a valid URL');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const studentId =
        getCurrentStudentId() || localStorage.getItem('studentId');

      if (!studentId) throw new Error('Student ID not found. Please log in again.');

      const enhancedDescription = `${formData.description}\n\nProject URL: ${formData.projectUrl}\n${formData.videoUrl ? `Video URL: ${formData.videoUrl}` : ''}`;

      let uploadedThumbnailUrl = '';

      if (thumbnailFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', thumbnailFile);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Image upload failed');
        }

        uploadedThumbnailUrl = data.url;
      }

      await apiCreateProject({
        studentId,
        studentName: localStorage.getItem('studentName') || 'Student',
        title: formData.title,
        description: enhancedDescription,
        category: formData.category,
        thumbnailUrl: uploadedThumbnailUrl,
        collaborators: selectedCollaborators.map((c) => c.id),
      });

      incrementProjectsUploaded(studentId);
      setSuccess(true);

      setTimeout(() => router.push('/projects'), 500);

    } catch (e) {
      console.error('Upload failed:', e);
      setError(e instanceof Error ? e.message : 'Failed to upload project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
          <Navbar />
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto text-center">
              <div className="animate-spin">
                <svg className="w-8 h-8 text-primary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
        <Navbar />
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must be logged in to upload a project.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push('/auth')}
              className="w-full mt-4"
              size="lg"
            >
              Go to Login
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-background pb-36 select-none antialiased">
        <Navbar />

        <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
          {success ? (
            <div className="bg-white dark:bg-card border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[24px] p-6 text-center space-y-4 py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-xl font-extrabold text-foreground">Project Uploaded Successfully!</h2>
              <p className="text-xs text-muted-foreground">
                Your project is now live and visible to all students.
              </p>
              <p className="text-[11px] text-muted-foreground animate-pulse">
                Redirecting to projects page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="rounded-2xl border-red-500/20 bg-red-500/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
                </Alert>
              )}

              {/* Top Hero Section */}
              <div className="flex items-center gap-4 bg-white dark:bg-card border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[24px] p-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 animate-pulse">
                  <Upload className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="text-left">
                  <h1 className="text-base font-extrabold text-foreground leading-tight">Upload Your Project</h1>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Share your amazing work with the campus community.
                  </p>
                </div>
              </div>

              {/* CARD 1: Project Information */}
              <div className="bg-white dark:bg-card border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[24px] p-5 space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-1">
                  <span className="text-sm">📋</span>
                  <h3 className="font-extrabold text-xs tracking-wider uppercase text-muted-foreground">Project Details</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Project Title *
                    </label>
                    <Input
                      placeholder="e.g., AI-Powered Study Assistant"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      className="rounded-xl bg-muted/30 border-border/60 focus:bg-background h-10 text-xs px-3"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Project URL *
                    </label>
                    <Input
                      type="url"
                      placeholder="https://your-project-url.com"
                      value={formData.projectUrl}
                      onChange={(e) => handleChange('projectUrl', e.target.value)}
                      className="rounded-xl bg-muted/30 border-border/60 focus:bg-background h-10 text-xs px-3"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-border/60 rounded-xl bg-muted/30 text-foreground text-xs h-10 focus:bg-background focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Department *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-border/60 rounded-xl bg-muted/30 text-foreground text-xs h-10 focus:bg-background focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="">Select your department</option>
                      {mobileDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                      Year *
                    </label>
                    <select
                      value={mobileYear}
                      onChange={(e) => setMobileYear(e.target.value)}
                      className="w-full px-3 py-2 border border-border/60 rounded-xl bg-muted/30 text-foreground text-xs h-10 focus:bg-background focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="">Select year</option>
                      {yearOptions.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* CARD 2: Project Description */}
              <div className="bg-white dark:bg-card border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[24px] p-5 space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📝</span>
                    <h3 className="font-extrabold text-xs tracking-wider uppercase text-muted-foreground">Project Description</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {formData.description.length} / 500
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    placeholder="Describe your project in detail. Explain the problem, technologies used and features."
                    value={formData.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        handleChange('description', e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-border/60 rounded-2xl bg-muted/30 text-foreground text-xs resize-none h-32 focus:bg-background focus:ring-2 focus:ring-primary/20 leading-relaxed"
                    required
                  />
                </div>
              </div>

              {/* CARD 3: Cover Image */}
              <div className="bg-white dark:bg-card border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[24px] p-5 space-y-3 text-left">
                <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-1">
                  <span className="text-sm">🖼️</span>
                  <h3 className="font-extrabold text-xs tracking-wider uppercase text-muted-foreground">Cover Image</h3>
                </div>

                <input
                  type="file"
                  id="mobile-thumbnail-upload"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />

                {thumbnailPreview ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/40 group animate-in fade-in zoom-in-95 duration-200">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailFile(null);
                        setThumbnailPreview(null);
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="mobile-thumbnail-upload"
                    className="flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 active:bg-muted/30 cursor-pointer transition-colors p-4 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2.5">
                      <Upload className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-bold text-foreground">Upload Cover Image</span>
                    <span className="text-[10px] text-muted-foreground mt-1">JPG, PNG (Max 5MB)</span>
                    <span className="text-[9px] text-muted-foreground/80 mt-0.5">Recommended: 16:9 aspect ratio</span>
                  </label>
                )}
              </div>

              {/* CARD 4: Collaborators */}
              <div className="bg-white dark:bg-card border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[24px] p-5 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👥</span>
                    <h3 className="font-extrabold text-xs tracking-wider uppercase text-muted-foreground">Collaborators (Optional)</h3>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {selectedCollaborators.length} / 4
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground leading-normal mb-3">
                    Search and add classmates who worked on this project.
                  </p>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search student by Name or Registration Number"
                      value={collabSearchQuery}
                      onChange={(e) => setCollabSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full rounded-full bg-muted/40 border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20 text-xs h-10"
                    />
                    {isSearching && (
                      <p className="text-[10px] text-muted-foreground mt-1 animate-pulse pl-1">Searching...</p>
                    )}

                    {searchResults.length > 0 && (
                      <Card className="absolute z-10 w-full mt-1.5 max-h-52 overflow-y-auto border border-border/40 bg-background shadow-xl rounded-2xl p-2 space-y-1">
                        {searchResults.map((student) => {
                          const isAlreadySelected = selectedCollaborators.some(c => c.id === student.id);
                          return (
                            <div key={student.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-colors">
                              <div className="flex items-center gap-3">
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-9 h-9 rounded-full object-cover border border-border/40"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                                    {student.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="text-left">
                                  <div className="font-bold text-xs text-foreground">{student.name}</div>
                                  <div className="text-[9px] text-muted-foreground font-mono">{student.registrationNo || student.id}</div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant={isAlreadySelected ? "ghost" : "outline"}
                                disabled={isAlreadySelected || selectedCollaborators.length >= 4}
                                onClick={() => {
                                  setSelectedCollaborators(prev => [...prev, student]);
                                  setCollabSearchQuery('');
                                  setSearchResults([]);
                                }}
                                className="h-7 text-[10px] font-bold rounded-lg px-3"
                              >
                                {isAlreadySelected ? "Added" : "Add"}
                              </Button>
                            </div>
                          );
                        })}
                      </Card>
                    )}
                  </div>
                </div>

                {/* Selected collaborators list */}
                {selectedCollaborators.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-1 gap-2">
                      {selectedCollaborators.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/10">
                          <div className="flex items-center gap-2.5">
                            {student.avatar ? (
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-8 h-8 rounded-full object-cover border border-border/40"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                                {student.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="text-left">
                              <div className="font-bold text-xs text-foreground">{student.name}</div>
                              <div className="text-[9px] text-muted-foreground font-mono">{student.registrationNo || student.id}</div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive h-7 w-7 p-0 rounded-full"
                            onClick={() => {
                              setSelectedCollaborators(prev => prev.filter(c => c.id !== student.id));
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky bottom button */}
              <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/40 z-40">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold py-5 rounded-full shadow-lg text-xs h-12"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin animate-pulse" /> Uploading...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4" /> Upload Project
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 pb-20">
      <Navbar />

      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Upload Your Project</h1>
            <p className="text-muted-foreground">
              Share your amazing work with the campus community
            </p>
          </div>

          <Card className="p-8">
            {success ? (
              <div className="text-center space-y-4 py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold">Project Uploaded Successfully!</h2>
                <p className="text-muted-foreground">
                  Your project is now live and visible to all students.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to projects page...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Project Title *
                  </label>
                  <Input
                    placeholder="e.g., AI-Powered Study Assistant"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Project Description *
                  </label>
                  <textarea
                    placeholder="Describe your project in detail. What problem does it solve? What technologies did you use?"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none h-32"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Department *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                      required
                    >
                      <option value="">Select your department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Project URL *
                  </label>
                  <Input
                    type="url"
                    placeholder="https://your-project-url.com"
                    value={formData.projectUrl}
                    onChange={(e) => handleChange('projectUrl', e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Link to your live project, GitHub repo, or portfolio
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Demo Video URL (Optional)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.videoUrl}
                    onChange={(e) => handleChange('videoUrl', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    YouTube, Vimeo, or other video platform link
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Project Cover Photo (Optional)
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a cover image for your project card (Max 5MB)
                  </p>
                  {thumbnailPreview && (
                    <div className="mt-4">
                      <p className="text-xs font-medium mb-2">Preview:</p>
                      <div className="relative w-full h-48 rounded-md overflow-hidden border">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Collaborators Section */}
                <div className="border-t pt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Collaborators (Optional)</h3>
                    <p className="text-xs text-muted-foreground">
                      Search and add up to 4 classmates who worked with you on this project.
                    </p>
                  </div>

                  <div className="relative">
                    <label className="text-sm font-medium mb-2 block">
                      Search Student
                    </label>
                    <Input
                      type="text"
                      placeholder="Search by student name, roll number, or ID..."
                      value={collabSearchQuery}
                      onChange={(e) => setCollabSearchQuery(e.target.value)}
                    />
                    {isSearching && (
                      <p className="text-xs text-muted-foreground mt-1 animate-pulse">Searching...</p>
                    )}

                    {searchResults.length > 0 && (
                      <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto border border-primary/20 bg-card shadow-lg p-2 space-y-1">
                        {searchResults.map((student) => {
                          const isAlreadySelected = selectedCollaborators.some(c => c.id === student.id);
                          return (
                            <div key={student.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors duration-150">
                              <div className="flex items-center gap-3">
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                                    👤
                                  </div>
                                )}
                                <div className="text-left">
                                  <div className="font-semibold text-sm text-foreground flex items-center gap-1">
                                    <span>👤</span> {student.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">{student.id}</div>
                                  <div className="text-xs text-muted-foreground">{student.department}</div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant={isAlreadySelected ? "ghost" : "outline"}
                                disabled={isAlreadySelected || selectedCollaborators.length >= 4}
                                onClick={() => {
                                  setSelectedCollaborators(prev => [...prev, student]);
                                  setCollabSearchQuery('');
                                  setSearchResults([]);
                                }}
                              >
                                {isAlreadySelected ? "Added" : "Add"}
                              </Button>
                            </div>
                          );
                        })}
                      </Card>
                    )}
                  </div>

                  {selectedCollaborators.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium block">
                        Selected Collaborators ({selectedCollaborators.length}/4)
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {selectedCollaborators.map((student) => (
                          <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                            <div className="flex items-center gap-3">
                              {student.avatar ? (
                                <img
                                  src={student.avatar}
                                  alt={student.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
                                  👤
                                </div>
                              )}
                              <div className="text-left">
                                <div className="font-semibold text-xs text-foreground">{student.name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono">{student.id}</div>
                                <div className="text-[10px] text-yellow-500 font-medium">Status: Pending</div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedCollaborators(prev => prev.filter(c => c.id !== student.id));
                              }}
                            >
                              ❌
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Uploading...'
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Project
                    </>
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function UploadPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <UploadPageContent />
    </React.Suspense>
  );
}
