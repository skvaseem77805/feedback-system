'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ExternalLink,
  Heart,
  Bookmark,
  Users,
  Share2,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { likeProject, saveProject, joinCollaboration, mockProjects } from '@/lib/data';
import Loading from './loading';

const sampleProjects = Object.values(mockProjects).map(p => ({
  id: p.id,
  title: p.title,
  description: p.description,
  studentName: p.studentName,
  year: p.academicYear,
  category: p.category,
  department: 'CSE',
  projectUrl: `https://example.com/${p.id}`,
  likes: p.likes,
  createdAt: p.uploadedAt.toISOString().split('T')[0],
  savedBy: p.savedBy,
  collaborators: p.collaborators,
}));

const projectsData = [
  {
    id: '1',
    title: 'AI-Powered Study Assistant',
    description: 'A web app that helps students organize notes, create study plans, and practice with AI-generated quizzes.',
    studentName: 'Raj Polimetla',
    year: '2024',
    category: 'Web Development',
    department: 'CSE',
    projectUrl: 'https://example.com/study-assistant',
    likes: 234,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Campus Community App',
    description: 'Mobile app connecting students for events, study groups, and campus activities.',
    studentName: 'Priya Singh',
    year: '2023',
    category: 'Mobile App',
    department: 'CSE',
    projectUrl: 'https://example.com/campus-app',
    likes: 189,
    createdAt: '2024-01-10'
  },
  {
    id: '3',
    title: 'Data Analytics Dashboard',
    description: 'Interactive dashboard for analyzing student performance metrics and trends.',
    studentName: 'Arun Kumar',
    year: '2022',
    category: 'Data Science',
    department: 'IT',
    projectUrl: 'https://example.com/analytics',
    likes: 156,
    createdAt: '2024-01-08'
  },
  {
    id: '4',
    title: 'IoT Weather Station',
    description: 'Smart device project using IoT sensors to monitor and display real-time weather data.',
    studentName: 'Neha Patel',
    year: '2024',
    category: 'IoT',
    department: 'ECE',
    projectUrl: 'https://example.com/weather-iot',
    likes: 128,
    createdAt: '2024-01-05'
  },
  {
    id: '5',
    title: 'E-Commerce Platform',
    description: 'Full-stack e-commerce solution with payment integration and inventory management.',
    studentName: 'Vikram Reddy',
    year: '2023',
    category: 'Web Development',
    department: 'CSE',
    projectUrl: 'https://example.com/ecommerce',
    likes: 267,
    createdAt: '2024-01-02'
  },
  {
    id: '6',
    title: 'ML Image Recognition',
    description: 'Machine learning model for identifying and classifying objects in images using deep learning.',
    studentName: 'Sophia Chen',
    year: '2025',
    category: 'Machine Learning',
    department: 'CSE',
    projectUrl: 'https://example.com/ml-vision',
    likes: 198,
    createdAt: '2024-01-01'
  }
];

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [likedProjects, setLikedProjects] = useState<string[]>([]);
  const [savedProjects, setSavedProjects] = useState<string[]>([]);
  const [collaborationRequests, setCollaborationRequests] = useState<string[]>([]);
  const currentStudentId = 'student1';

  const categories = ['Web Development', 'Mobile App', 'Data Science', 'IoT', 'Machine Learning'];
  const years = ['2025', '2024', '2023', '2022'];

  const filteredProjects = projectsData.filter(project => {
    const matchSearch = 
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase()) ||
      project.studentName.toLowerCase().includes(search.toLowerCase());
    const matchYear = !filterYear || project.year === filterYear;
    const matchCategory = !filterCategory || project.category === filterCategory;
    return matchSearch && matchYear && matchCategory;
  });

  const toggleLike = (projectId: string) => {
    setLikedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleSave = (projectId: string) => {
    setSavedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleCollaboration = (projectId: string) => {
    setCollaborationRequests(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen gradient-bg">
        <Navbar />

        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Discover Student Projects
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Explore amazing projects from students across all years. Like, save, and collaborate on projects that inspire you.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search projects by title, description, or student name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div>
                  <p className="text-sm font-medium mb-2">Year</p>
                  <div className="flex gap-2">
                    <Button
                      variant={filterYear === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterYear('')}
                    >
                      All
                    </Button>
                    {years.map(year => (
                      <Button
                        key={year}
                        variant={filterYear === year ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterYear(year)}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Category</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filterCategory === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterCategory('')}
                    >
                      All
                    </Button>
                    {categories.map(cat => (
                      <Button
                        key={cat}
                        variant={filterCategory === cat ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => {
                  const isLiked = likedProjects.includes(project.id);
                  const isSaved = savedProjects.includes(project.id);
                  const hasCollaborationRequest = collaborationRequests.includes(project.id);

                  return (
                    <Card key={project.id} className="p-5 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition group flex flex-col">
                      {/* Header */}
                      <div className="flex-1 space-y-3 mb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg group-hover:text-primary smooth-transition line-clamp-2">
                              {project.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">By {project.studentName}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleLike(project.id)}
                              className={`smooth-transition ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                            >
                              <Heart
                                className="w-5 h-5"
                                fill={isLiked ? 'currentColor' : 'none'}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSave(project.id)}
                              className={`smooth-transition ${isSaved ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                            >
                              <Bookmark
                                className="w-5 h-5"
                                fill={isSaved ? 'currentColor' : 'none'}
                              />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-primary/20 text-primary text-xs">
                            {project.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.year} Year
                          </Badge>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground py-3 border-t border-b border-border/50 mb-4">
                        <div>
                          <div className="font-bold text-foreground">
                            {project.likes + (isLiked ? 1 : 0)}
                          </div>
                          Likes
                        </div>
                        <div>
                          <div className="font-bold text-foreground">
                            {project.collaborators?.length || 0}
                          </div>
                          Collaborators
                        </div>
                        <div>
                          <div className="font-bold text-foreground">
                            {project.savedBy?.length || 0}
                          </div>
                          Saved
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button variant="outline" size="sm" className="w-full smooth-button gap-2 bg-transparent">
                            <ExternalLink className="w-4 h-4" />
                            View Project
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          className={`w-full smooth-button ${hasCollaborationRequest ? 'bg-green-500/20 text-green-500' : 'bg-primary text-primary-foreground'}`}
                          onClick={() => toggleCollaboration(project.id)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {hasCollaborationRequest ? 'Request Sent' : 'Join Team'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4 text-lg">No projects found matching your search.</p>
                <Button 
                  className="smooth-button bg-primary text-primary-foreground"
                  onClick={() => { setSearch(''); setFilterYear(''); setFilterCategory(''); }}
                >
                  Clear Filters
                </Button>
              </Card>
            )}
          </div>
        </section>
      </div>
    </Suspense>
  );
}
