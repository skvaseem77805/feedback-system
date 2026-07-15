'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, Heart, Bookmark, Users, Eye, X, SlidersHorizontal } from 'lucide-react';
import { Suspense } from 'react';
import { apiProjects, apiLikeProject, apiSaveProject, apiJoinProject, apiStudents } from '@/lib/api';
import type { ApiProject, ApiStudent } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import Loading from './loading';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const yearsList = [
  { value: '', label: 'All' },
  { value: '1st', label: '1st Year' },
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: 'Final', label: 'Final Year' },
];

const branchesList = [
  { value: '', label: 'All' },
  { value: 'CSE', label: 'CSE' },
  { value: 'CSY', label: 'CSY' },
  { value: 'AI&ML', label: 'AI&ML' },
  { value: 'AI&DS', label: 'AI&DS' },
  { value: 'IT', label: 'IT' },
  { value: 'ECE', label: 'ECE' },
  { value: 'EEE', label: 'EEE' },
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Civil', label: 'Civil' },
  { value: 'Other', label: 'Other' },
];

function ProjectsPageContent() {
  const isMobile = useIsMobile();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const currentStudentId = getCurrentStudentId() ?? '';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Load initial parameters from URL or sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      
      const savedSearch = searchParam !== null ? searchParam : (sessionStorage.getItem('projects_search') || '');
      const savedYear = sessionStorage.getItem('projects_filterYear') || '';
      const savedBranch = sessionStorage.getItem('projects_filterBranch') || '';
      const savedSection = sessionStorage.getItem('projects_filterSection') || '';
      
      setSearch(savedSearch);
      setFilterYear(savedYear);
      setFilterBranch(savedBranch);
      setFilterSection(savedSection);
    }
  }, []);

  // Update sessionStorage on state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('projects_search', search);
    }
  }, [search]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('projects_filterYear', filterYear);
    }
  }, [filterYear]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('projects_filterBranch', filterBranch);
    }
  }, [filterBranch]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('projects_filterSection', filterSection);
    }
  }, [filterSection]);

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

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const list = await apiStudents();
        setStudents(list);
      } catch (e) {
        console.error('Failed to load students for sections', e);
      }
    };
    loadStudents();
  }, []);

  const availableSections = useMemo(() => {
    if (!students || students.length === 0) {
      // Fallback: extract from projects list if students haven't loaded yet
      const projFiltered = filterBranch
        ? projects.filter(p => (p.studentDepartment || '').toLowerCase().trim() === filterBranch.toLowerCase().trim())
        : projects;
      return Array.from(
        new Set(
          projFiltered
            .map(p => (p.studentSection || '').trim().toUpperCase())
            .filter(s => s !== '')
        )
      ).sort();
    }

    const filtered = filterBranch
      ? students.filter((s) => {
          const d = (s.department || '').toLowerCase().trim();
          const f = filterBranch.toLowerCase().trim();
          if (f === 'cse') return d === 'cse';
          if (f === 'csy') return d === 'csy' || d.includes('csy');
          if (f === 'ai&ml') return d === 'ai & ml' || d === 'ai&ml' || d.includes('ai & ml') || d.includes('ai&ml');
          if (f === 'ai&ds') return d === 'ai & ds' || d === 'ai&ds' || d.includes('ai & ds') || d.includes('ai&ds');
          if (f === 'it') return d === 'it';
          if (f === 'ece') return d === 'ece';
          if (f === 'eee') return d === 'eee';
          if (f === 'mechanical') return d === 'mechanical';
          if (f === 'civil') return d === 'civil';
          if (f === 'other') {
            const known = ['cse', 'csy', 'ai & ml', 'ai&ml', 'ai & ds', 'ai&ds', 'it', 'ece', 'eee', 'mechanical', 'civil'];
            return !known.some(k => d === k || d.includes(k));
          }
          return d.includes(f);
        })
      : students;

    return Array.from(
      new Set(
        filtered
          .map(s => (s.section || '').trim().toUpperCase())
          .filter(s => s !== '')
      )
    ).sort();
  }, [students, projects, filterBranch]);

  // Reset section filter if not available in current branch
  useEffect(() => {
    if (filterSection && !availableSections.includes(filterSection)) {
      setFilterSection('');
    }
  }, [filterBranch, availableSections, filterSection]);

  const getRelevanceScore = (project: ApiProject, query: string) => {
    if (!query) return 0;
    const q = query.toLowerCase().trim();
    const title = (project.title || '').toLowerCase().trim();
    const name = (project.studentName || '').toLowerCase().trim();
    const sid = (project.studentId || '').toLowerCase().trim();
    const desc = (project.description || '').toLowerCase().trim();
    const cat = (project.category || '').toLowerCase().trim();
    const dept = (project.studentDepartment || '').toLowerCase().trim();
    const year = (project.academicYear || '').toLowerCase().trim();

    if (title === q) return 1000;
    if (title.startsWith(q)) return 500;
    if (title.includes(q)) return 400;
    if (name.startsWith(q)) return 300;
    if (name.includes(q)) return 250;
    if (sid.startsWith(q)) return 200;
    if (sid.includes(q)) return 150;
    if (desc.includes(q)) return 100;
    if (cat.includes(q)) return 80;
    if (dept.includes(q)) return 60;
    if (year.includes(q)) return 40;
    return 0;
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchYear = !filterYear || p.academicYear === filterYear;
        
        const matchBranch = !filterBranch || (() => {
          const d = (p.studentDepartment || '').toLowerCase().trim();
          const f = filterBranch.toLowerCase().trim();
          if (f === 'cse') return d === 'cse';
          if (f === 'csy') return d === 'csy' || d.includes('csy');
          if (f === 'ai&ml') return d === 'ai & ml' || d === 'ai&ml' || d.includes('ai & ml') || d.includes('ai&ml');
          if (f === 'ai&ds') return d === 'ai & ds' || d === 'ai&ds' || d.includes('ai & ds') || d.includes('ai&ds');
          if (f === 'it') return d === 'it';
          if (f === 'ece') return d === 'ece';
          if (f === 'eee') return d === 'eee';
          if (f === 'mechanical') return d === 'mechanical';
          if (f === 'civil') return d === 'civil';
          if (f === 'other') {
            const known = ['cse', 'csy', 'ai & ml', 'ai&ml', 'ai & ds', 'ai&ds', 'it', 'ece', 'eee', 'mechanical', 'civil'];
            return !known.some(k => d === k || d.includes(k));
          }
          return d.includes(f);
        })();

        const matchSection = !filterSection || (p.studentSection || '').toLowerCase().trim() === filterSection.toLowerCase().trim();

        if (!matchYear || !matchBranch || !matchSection) return false;

        const q = debouncedSearch.toLowerCase().trim();
        if (!q) return true;

        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const name = (p.studentName || '').toLowerCase();
        const sid = (p.studentId || '').toLowerCase();

        return (
          title.includes(q) ||
          desc.includes(q) ||
          name.includes(q) ||
          sid.includes(q) ||
          title.startsWith(q) || title.endsWith(q) ||
          name.startsWith(q) || name.endsWith(q) ||
          sid.startsWith(q) || sid.endsWith(q)
        );
      })
      .sort((a, b) => {
        const scoreA = getRelevanceScore(a, debouncedSearch);
        const scoreB = getRelevanceScore(b, debouncedSearch);
        return scoreB - scoreA;
      });
  }, [projects, filterYear, filterBranch, debouncedSearch]);

  const toggleLike = async (project: ApiProject) => {
    if (!currentStudentId) return;
    try {
      const res = await apiLikeProject(project.id, currentStudentId);
      setProjects((prev) =>
        prev.map((q) =>
          q.id === project.id ? { ...q, likes: res.likes, userHasLiked: res.liked } : q
        )
      );
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const toggleSave = async (project: ApiProject) => {
    if (!currentStudentId) return;
    try {
      const res = await apiSaveProject(project.id, currentStudentId);
      setProjects((prev) =>
        prev.map((q) => {
          if (q.id !== project.id) return q;
          const alreadySaved = q.savedBy.includes(currentStudentId);
          let nextSavedBy = [...q.savedBy];
          if (alreadySaved && !res.saved) {
            nextSavedBy = nextSavedBy.filter(id => id !== currentStudentId);
          } else if (!alreadySaved && res.saved) {
            nextSavedBy.push(currentStudentId);
          }
          return { ...q, savedBy: nextSavedBy };
        })
      );
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  // Render Mobile View layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20 select-none antialiased">
        <Navbar />

        <main className="px-4 py-4 space-y-4">
          {/* Mobile Search - Full Width with Filter Icon */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects by title, desc, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-20 rounded-xl bg-muted/40 border-border/60 focus:bg-background h-10 text-xs w-full"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold px-1"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterVisible(prev => !prev)}
                className={`p-1.5 rounded-lg active:scale-95 transition-none flex items-center justify-center border ${
                  isFilterVisible
                    ? 'bg-primary border-primary text-white'
                    : 'bg-background border-border/60 text-muted-foreground'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compact Filter Container */}
          {isFilterVisible && (
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-4">
              {/* Year Filters */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Year</p>
                <div className="flex flex-wrap gap-1.5">
                  {yearsList.map((y) => {
                    const isActive = filterYear === y.value;
                    return (
                      <button
                        key={y.value}
                        type="button"
                        onClick={() => setFilterYear(y.value)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${
                          isActive
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background text-foreground border-border/60'
                        }`}
                      >
                        {y.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Branch Filters */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Branch</p>
                <div className="flex flex-wrap gap-1.5">
                  {branchesList.map((b) => {
                    const isActive = filterBranch === b.value;
                    return (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => setFilterBranch(b.value)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${
                          isActive
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background text-foreground border-border/60'
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Section Filters */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Section</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterSection('')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${
                      filterSection === ''
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background text-foreground border-border/60'
                    }`}
                  >
                    All
                  </button>
                  {availableSections.map((s) => {
                    const isActive = filterSection === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilterSection(s)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${
                          isActive
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background text-foreground border-border/60'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Status */}
              {(filterYear || filterBranch || filterSection) && (
                <div className="flex justify-between items-center pt-2 text-[10px] text-muted-foreground font-medium border-t border-border/20">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Filters applied
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterYear('');
                      setFilterBranch('');
                      setFilterSection('');
                    }}
                    className="text-primary hover:underline font-bold"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Project List */}
          {loading ? (
            <div className="space-y-4 pt-2">
              <div className="h-48 w-full bg-muted/40 animate-pulse rounded-2xl" />
              <div className="h-48 w-full bg-muted/40 animate-pulse rounded-2xl" />
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 pt-1">
              {filteredProjects.map((project) => {
                const isLiked = !!project.userHasLiked;
                const isSaved = currentStudentId ? project.savedBy.includes(currentStudentId) : false;

                return (
                  <Card 
                    key={project.id} 
                    className="overflow-hidden rounded-2xl bg-card/45 border border-border/40 shadow-sm flex flex-col active:scale-[0.99] cursor-pointer transition-transform duration-100"
                  >
                    {project.thumbnailUrl ? (
                      <div className="w-full aspect-video relative bg-muted/20 border-b border-border/40 flex-shrink-0">
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <Badge className="absolute top-3 left-3 bg-black/60 text-white border-none font-bold text-[9px] px-2.5 py-0.5 rounded-full">
                          {project.category}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSave(project);
                          }}
                          className="absolute top-3 right-3 p-2 bg-black/40 active:bg-black/60 text-white rounded-full backdrop-blur-sm transition-transform active:scale-90"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 pt-4 pb-0 flex justify-between items-start">
                        <Badge className="bg-primary/10 text-primary border-none font-bold text-[9px] px-2.5 py-0.5 rounded-full shadow-none hover:bg-primary/20">
                          {project.category}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSave(project);
                          }}
                          className="p-1 text-muted-foreground active:scale-90 transition-transform"
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </button>
                      </div>
                    )}
                    
                    <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between text-left">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {project.academicYear} Year • {project.studentDepartment || 'CSE'} • Section {project.studentSection || 'E'}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-foreground text-sm tracking-tight leading-snug line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium pt-2 border-t border-border/20">
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleLike(project);
                              }}
                              className="flex items-center gap-0.5 active:scale-90 transition-transform font-bold"
                            >
                              <Heart className={`w-3.5 h-3.5 text-red-500 ${isLiked ? 'fill-red-500' : ''}`} />
                              <span>{project.likes}</span>
                            </button>
                            <span className="flex items-center gap-0.5 font-bold">
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span>{project.views ?? 0}</span>
                            </span>
                          </div>
                          
                          <span className="font-bold text-muted-foreground/80 truncate max-w-[100px]">
                            By {project.studentName}
                          </span>
                        </div>

                        <Link href={`/projects/${encodeURIComponent(project.id)}?from=projects`} className="block w-full">
                          <Button size="sm" className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs py-3.5 rounded-xl border-none shadow-none h-9">
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center bg-card/45 border-border/40 rounded-2xl">
              <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
              <p className="text-muted-foreground mb-1 text-sm font-bold">No projects found</p>
              <p className="text-xs text-muted-foreground mb-4">Try clearing filters or search query.</p>
              <Button
                size="sm"
                className="smooth-button text-xs font-bold rounded-xl"
                onClick={() => { setSearch(''); setFilterYear(''); setFilterBranch(''); setFilterSection(''); }}
              >
                Clear Filters
              </Button>
            </Card>
          )}
        </main>
      </div>
    );
  }

  // Render Desktop Layout (100% frozen / unmodified)
  return (
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
          {/* Search and Filters */}
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  placeholder="Search projects by title, description, or student name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 pr-24 h-11 rounded-xl bg-card border-border/60 focus:bg-background text-sm w-full"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="text-muted-foreground hover:text-foreground text-xs font-semibold px-1"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFilterVisible(prev => !prev)}
                    className={`p-1.5 rounded-lg active:scale-95 transition-none flex items-center justify-center border ${
                      isFilterVisible
                        ? 'bg-primary border-primary text-white'
                        : 'bg-background border-border/60 text-muted-foreground'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(filterYear || filterBranch || filterSection || search) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setFilterYear('');
                    setFilterBranch('');
                    setFilterSection('');
                  }}
                  className="h-11 px-5 rounded-xl border-border/60 font-bold text-xs hover:bg-muted/30"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Compact Filter Container */}
            {isFilterVisible && (
              <div className="bg-card/45 border border-border/40 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Year Filters */}
                <div className="flex items-center gap-6">
                  <div className="w-16 flex-shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Year
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {yearsList.map((y) => {
                      const isActive = filterYear === y.value;
                      return (
                        <button
                          key={y.value}
                          type="button"
                          onClick={() => setFilterYear(y.value)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${
                            isActive
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                          }`}
                        >
                          {y.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border/40" />

                {/* Branch Filters */}
                <div className="flex items-center gap-6">
                  <div className="w-16 flex-shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Branch
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {branchesList.map((b) => {
                      const isActive = filterBranch === b.value;
                      return (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => setFilterBranch(b.value)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${
                            isActive
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border/40" />

                {/* Section Filters */}
                <div className="flex items-center gap-6">
                  <div className="w-16 flex-shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Section
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterSection('')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${
                        filterSection === ''
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                      }`}
                    >
                      All
                    </button>
                    {availableSections.map((s) => {
                      const isActive = filterSection === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFilterSection(s)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${
                            isActive
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const isLiked = !!project.userHasLiked;
                const isSaved = currentStudentId ? project.savedBy.includes(currentStudentId) : false;

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

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-semibold">
                        <span>{project.academicYear} Year • {project.studentDepartment || 'CSE'} • Section {project.studentSection || 'E'}</span>
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
                        <div className="font-bold text-foreground">{project.views}</div>
                        Views
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{project.savedBy?.length ?? 0}</div>
                        Saved
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link href={`/projects/${encodeURIComponent(project.id)}?from=projects`} className="block">
                        <Button variant="outline" size="sm" className="w-full smooth-button gap-2 bg-transparent">
                          <ExternalLink className="w-4 h-4" />
                          View Project
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2 text-lg font-semibold">No matching projects found.</p>
              <p className="text-muted-foreground text-sm mb-6">Try searching by project title, student name, student ID, or category.</p>
              <Button
                className="smooth-button bg-primary text-primary-foreground"
                onClick={() => { setSearch(''); setFilterYear(''); setFilterBranch(''); setFilterSection(''); }}
              >
                Clear Filters
              </Button>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
