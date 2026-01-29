'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { incrementProjectsUploaded, getCurrentStudentId } from '@/lib/statsTracker';

interface FormData {
  title: string;
  description: string;
  projectUrl: string;
  category: string;
  department: string;
  videoUrl?: string;
}

export default function UploadPage() {
  const router = useRouter();
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

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const studentId = localStorage.getItem('studentId');
    const staffId = localStorage.getItem('staffId');
    const adminId = localStorage.getItem('adminId');
    const userType = localStorage.getItem('userType');

    // Check if any user type is logged in
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

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
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
      const studentId = getCurrentStudentId();
      if (!studentId) {
        throw new Error("Student ID not found");
      }

      const { apiCreateProject } = await import('@/lib/api');

      // We need to implement proper URL storage in the next iteration or schema update.
      // For now, let's append URL to description so it's not lost.

      const enhancedDescription = `${formData.description}\n\nProject URL: ${formData.projectUrl}\n${formData.videoUrl ? `Video URL: ${formData.videoUrl}` : ''}`;

      await apiCreateProject({
        studentId,
        studentName: localStorage.getItem('studentName') || 'Student',
        title: formData.title,
        description: enhancedDescription,
        category: formData.category,
      });

      incrementProjectsUploaded(studentId);
      setSuccess(true);
      setTimeout(() => {
        router.push('/projects');
      }, 2000);

    } catch (e) {
      console.error('Upload failed', e);
      setError('Failed to upload project. Please try again.');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
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
