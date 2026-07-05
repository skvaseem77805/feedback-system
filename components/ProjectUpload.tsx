'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { type AcademicYear, type Project } from '@/lib/data';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectUploadProps {
  academicYear: AcademicYear;
  studentId: string;
  studentName: string;
  onProjectUpload: (project: Project) => void;
}

export function ProjectUpload({
  academicYear,
  studentId,
  studentName,
  onProjectUpload,
}: ProjectUploadProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web',
    fileName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const categories = ['web', 'mobile', 'data', 'ai', 'game', 'other'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
      setFormData((prev) => ({
        ...prev,
        fileName: selectedFile.name,
      }));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Project title is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Project description is required');
      return;
    }
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);

    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newProject: Project = {
      id: Date.now().toString(),
      studentId,
      studentName,
      academicYear,
      title: formData.title,
      description: formData.description,
      fileName: formData.fileName,
      uploadedAt: new Date(),
      fileSize: file.size,
      category: formData.category,
      likes: 0,
      savedBy: [],
      collaborators: [studentId],
    };

    onProjectUpload(newProject);

    setIsSuccess(true);
    setFormData({ title: '', description: '', category: 'web', fileName: '' });
    setFile(null);
    setIsLoading(false);

    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">Upload Your Project</h2>
          <p className="text-muted-foreground">
            Share your amazing project with the campus community
          </p>
        </div>

        {isSuccess && (
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              Project uploaded successfully! It's now visible to other students.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                placeholder="e.g., Student Management System"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                disabled={isLoading}
                className="smooth-transition"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Project Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="category" className="smooth-transition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what your project does, key features, technology stack, and learning outcomes..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={isLoading}
              className="min-h-32 smooth-transition"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="file">Project File (ZIP, PDF, or Link)</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={isLoading}
                className="smooth-transition cursor-pointer"
                accept=".zip,.pdf,.txt,.doc,.docx,.xlsx,.csv"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Upload className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Max file size: 50MB. Supported formats: ZIP, PDF, DOC, DOCX, XLSX, CSV
            </p>
            {file && (
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-accent-foreground">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.title || !file}
            className="w-full smooth-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Project
              </>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
