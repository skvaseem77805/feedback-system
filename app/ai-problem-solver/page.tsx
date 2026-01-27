'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YearSelector } from '@/components/YearSelector';
import { AIChat } from '@/components/AIChat';
import { ProjectUpload } from '@/components/ProjectUpload';
import { StatisticsDashboard } from '@/components/StatisticsDashboard';
import { ProjectsList } from '@/components/ProjectsList';
import { Navbar } from '@/components/Navbar';
import { type AcademicYear, type Project } from '@/lib/data';
import { ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Check } from 'lucide-react'; // Import Check component

export default function AIProblemSolverPage() {
  const [selectedYear, setSelectedYear] = useState<AcademicYear>('1st');
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      studentId: 'student-1',
      studentName: 'Alex Johnson',
      academicYear: '1st',
      title: 'Weather App with React',
      description: 'A responsive weather application that fetches real-time data using OpenWeather API. Features include current weather, 5-day forecast, and search functionality.',
      fileName: 'weather-app.zip',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      fileSize: 2.5 * 1024 * 1024,
      category: 'web',
    },
    {
      id: '2',
      studentId: 'student-2',
      studentName: 'Sarah Chen',
      academicYear: '2nd',
      title: 'Social Media Platform',
      description: 'A full-stack social media application with user authentication, post creation, likes, comments, and real-time notifications. Built with React and Node.js.',
      fileName: 'social-platform.zip',
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      fileSize: 8.3 * 1024 * 1024,
      category: 'web',
    },
    {
      id: '3',
      studentId: 'student-3',
      studentName: 'Marcus Williams',
      academicYear: '3rd',
      title: 'Machine Learning Model for Image Classification',
      description: 'Deep learning model using TensorFlow and Keras for classifying images with 95% accuracy. Includes data preprocessing, model training, and evaluation metrics.',
      fileName: 'ml-model.zip',
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      fileSize: 15.7 * 1024 * 1024,
      category: 'ai',
    },
    {
      id: '4',
      studentId: 'student-4',
      studentName: 'Emily Rodriguez',
      academicYear: 'final',
      title: 'Enterprise Resource Planning System',
      description: 'Comprehensive ERP system with inventory management, accounting, HR modules. Deployed on AWS with microservices architecture and advanced analytics dashboard.',
      fileName: 'erp-system.zip',
      uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      fileSize: 25.1 * 1024 * 1024,
      category: 'web',
    },
    {
      id: '5',
      studentId: 'student-5',
      studentName: 'David Lee',
      academicYear: '2nd',
      title: 'Mobile Fitness Tracker',
      description: 'Cross-platform mobile app for tracking workouts, calories, and fitness goals. Features workout recommendations based on user activity.',
      fileName: 'fitness-tracker.zip',
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      fileSize: 4.2 * 1024 * 1024,
      category: 'mobile',
    },
  ]);
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('studentId') || `student-${Date.now()}`;
    const name = localStorage.getItem('studentName') || 'Guest Student';
    setStudentId(id);
    setStudentName(name);
    localStorage.setItem('studentId', id);
    localStorage.setItem('studentName', name);
    setIsLoaded(true);
  }, []);

  const handleProjectUpload = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/30 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-primary/15 text-primary border border-primary/30 fade-in backdrop-blur-sm hover:bg-primary/20 smooth-transition cursor-default">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">AI-Powered Learning Assistant</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight slide-up">
            AI Problem Solver
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              For Every Academic Year
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance slide-up leading-relaxed">
            Get personalized project guidance with working code examples, upload your projects, and collaborate with peers. Our AI adapts to your academic year level.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 slide-up">
            <div className="flex items-center gap-2 text-sm text-primary/80 backdrop-blur-sm bg-primary/10 px-4 py-2 rounded-lg">
              <Check className="w-4 h-4 text-green-500" />
              Complete working code examples
            </div>
            <div className="flex items-center gap-2 text-sm text-primary/80 backdrop-blur-sm bg-primary/10 px-4 py-2 rounded-lg">
              <Check className="w-4 h-4 text-green-500" />
              Year-specific guidance
            </div>
            <div className="flex items-center gap-2 text-sm text-primary/80 backdrop-blur-sm bg-primary/10 px-4 py-2 rounded-lg">
              <Check className="w-4 h-4 text-green-500" />
              Real-time feedback
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Year Selector */}
          <YearSelector selectedYear={selectedYear} onSelectYear={setSelectedYear} />

          {/* Tabs for different features */}
          <Tabs defaultValue="chat" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-fit smooth-transition">
              <TabsTrigger value="chat" className="smooth-transition">
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="upload" className="smooth-transition">
                Upload Project
              </TabsTrigger>
              <TabsTrigger value="projects" className="smooth-transition">
                View Projects
              </TabsTrigger>
            </TabsList>

            {/* AI Chat Tab */}
            <TabsContent value="chat" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-1">
                  Get Help with Your Projects
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions about coding, project ideas, debugging, or documentation. Responses are tailored to {selectedYear} year level.
                </p>
              </div>
              <AIChat academicYear={selectedYear} />
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <ProjectUpload
                academicYear={selectedYear}
                studentId={studentId}
                studentName={studentName}
                onProjectUpload={handleProjectUpload}
              />
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              <ProjectsList projects={projects} filterByYear={selectedYear} />
            </TabsContent>
          </Tabs>

          {/* Statistics */}
          <div className="mt-12 pt-12 border-t">
            <StatisticsDashboard projects={projects} />
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <Link href="/projects">
              <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 hover-lift smooth-transition group cursor-pointer">
                <h3 className="font-semibold text-primary group-hover:text-accent smooth-transition mb-2">
                  Browse All Projects
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Explore projects from students across all years
                </p>
                <div className="flex items-center gap-2 text-primary text-sm">
                  <span>View Gallery</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/collaborate">
              <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-primary/20 hover-lift smooth-transition group cursor-pointer">
                <h3 className="font-semibold text-primary group-hover:text-accent smooth-transition mb-2">
                  Find Collaborators
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with peers working on similar projects
                </p>
                <div className="flex items-center gap-2 text-primary text-sm">
                  <span>Connect Now</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/ai-generator">
              <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/30 hover-lift smooth-transition group cursor-pointer">
                <h3 className="font-semibold text-primary group-hover:text-accent smooth-transition mb-2">
                  Generate Code
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Let AI generate code from your project ideas
                </p>
                <div className="flex items-center gap-2 text-primary text-sm">
                  <span>Start Generating</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
