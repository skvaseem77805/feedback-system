'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, Heart, Bookmark, Users } from 'lucide-react';
import { Suspense } from 'react';
import { apiProjects, apiLikeProject, apiSaveProject, apiJoinProject } from '@/lib/api';
import type { ApiProject } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import Loading from './loading';

const categories = ['Web Development', 'Mobile App', 'Data Science', 'IoT', 'Machine Learning'];
const years = ['1st', '2nd', '3rd', 'Final'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const currentStudentId = getCurrentStudentId() ?? '';

  useEffect(() => {
    // Read initial category parameter from URL on client mount
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat) {
        setFilterCategory(cat);
      }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await apiProjects({ forUserId: currentStudentId || undefined });
        setProjects(list);
      } catch (e) {
        console.error('Projects load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentStudentId]);

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.studentName.toLowerCase().includes(q);
    const matchYear = !filterYear || p.academicYear === filterYear;

    // Fuzzy matching for various category formats
    const matchCategory = !filterCategory || (() => {
      const pCat = p.category.toLowerCase().trim();
      const fCat = filterCategory.toLowerCase().trim();
      if (pCat === fCat) return true;
      if (fCat === 'ai / ml' || fCat === 'ai/ml' || fCat === 'machine learning' || fCat === 'ai') {
        return pCat === 'ai' || pCat === 'machine learning' || pCat === 'ml' || pCat === 'ai / ml';
      }
      if (fCat === 'web development' || fCat === 'web') {
        return pCat === 'web' || pCat === 'web development';
      }
      if (fCat === 'mobile app' || fCat === 'mobile') {
        return pCat === 'mobile' || pCat === 'mobile app';
      }
      if (fCat === 'cyber security' || fCat === 'security') {
        return pCat === 'security' || pCat === 'cyber security' || pCat === 'cybersecurity';
      }
      if (fCat === 'data science' || fCat === 'data') {
        return pCat === 'data' || pCat === 'data science';
      }
      if (fCat === 'others' || fCat === 'other') {
        return pCat === 'other' || pCat === 'others' || pCat === 'general';
      }
      return pCat.includes(fCat) || fCat.includes(pCat);
    })();

    return matchSearch && matchYear && matchCategory;
  });

  const toggleLike = async (project: ApiProject) => {
    if (!currentStudentId) return;
    try {
      const { likes } = await apiLikeProject(project.id, currentStudentId);
      setProjects((prev) =>
        prev.map((q) =>
          q.id === project.id ? { ...q, likes, userHasLiked: true } : q
        )
      );
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const toggleSave = async (project: ApiProject) => {
    if (!currentStudentId) return;
    try {
      await apiSaveProject(project.id, currentStudentId);
      setProjects((prev) =>
        prev.map((q) =>
          q.id === project.id
            ? { ...q, savedBy: q.savedBy.includes(currentStudentId) ? q.savedBy : [...q.savedBy, currentStudentId] }
            : q
        )
      );
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  const toggleCollaboration = async (project: ApiProject) => {
    if (!currentStudentId) return;
    try {
      const res = await apiJoinProject(project.id, currentStudentId);
      if (res.joined || res.already) {
        setProjects((prev) =>
          prev.map((q) =>
            q.id === project.id
              ? { ...q, collaborators: q.collaborators.includes(currentStudentId) ? q.collaborators : [...q.collaborators, currentStudentId] }
              : q
          )
        );
      }
    } catch (e) {
      console.error('Join error:', e);
    }
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
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading…</div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => {
                  const isLiked = !!project.userHasLiked;
                  const isSaved = currentStudentId ? project.savedBy.includes(currentStudentId) : false;
                  const hasJoined = currentStudentId ? project.collaborators.includes(currentStudentId) : false;

                  return (
                    <Card key={project.id} className="p-5 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition group flex flex-col">
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
                              onClick={() => toggleLike(project)}
                              className={`smooth-transition ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                            >
                              <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSave(project)}
                              className={`smooth-transition ${isSaved ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                            >
                              <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-primary/20 text-primary text-xs">{project.category}</Badge>
                          <Badge variant="outline" className="text-xs">{project.academicYear} Year</Badge>
                        </div>
                      </div>

                      {project.thumbnailUrl && (
                        <div className="w-full h-48 mb-4 rounded-md overflow-hidden bg-muted/20 border border-border/50">
                          <img
                            src={project.thumbnailUrl}
                            alt={project.title}
                            className="w-full h-full object-cover hover:scale-105 smooth-transition duration-500"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground py-3 border-t border-b border-border/50 mb-4">
                        <div>
                          <div className="font-bold text-foreground">{project.likes}</div>
                          Likes
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{project.collaborators?.length ?? 0}</div>
                          Collaborators
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{project.savedBy?.length ?? 0}</div>
                          Saved
                        </div>
                      </div>

                      <div className="space-y-2">
                        <a href={`#project-${project.id}`} className="block">
                          <Button variant="outline" size="sm" className="w-full smooth-button gap-2 bg-transparent">
                            <ExternalLink className="w-4 h-4" />
                            View Project
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          className={`w-full smooth-button ${hasJoined ? 'bg-green-500/20 text-green-500' : 'bg-primary text-primary-foreground'}`}
                          onClick={() => toggleCollaboration(project)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {hasJoined ? 'Joined' : 'Join Team'}
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
