'use client';

import { useState, useEffect, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Compass, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiProjects, apiStudents } from '@/lib/api';
import type { ApiProject, ApiStudent } from '@/lib/api';
import { cn } from '@/lib/utils';

import { smartFilterItems } from '@/lib/smart-search';

export const GlobalSearch = forwardRef<HTMLInputElement, { className?: string; inputClassName?: string }>(
  ({ className = '', inputClassName = '' }, ref) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projList, studList] = await Promise.all([
          apiProjects(),
          apiStudents()
        ]);
        setProjects(projList || []);
        setStudents(studList || []);
      } catch (err) {
        console.error('GlobalSearch projects load error:', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/projects?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  const getFilteredSuggestions = () => {
    const q = debouncedQuery.trim();
    if (!q) return { students: [], projects: [] };

    const matchedStudents = smartFilterItems(students, q, [
      { field: 'name', weight: 2.0 },
      { field: 'registrationNo', weight: 1.8 },
      { field: 'id', weight: 1.8 },
      { field: 'uniqueId', weight: 1.8 },
      { field: 'email', weight: 1.5 },
      { field: 'department', weight: 1.0 },
      { field: (s) => (s.year ? `${s.year} year` : ''), weight: 1.0 },
      { field: 'academicYear', weight: 1.0 },
      { field: 'section', weight: 1.0 },
      { field: 'skills', weight: 1.2 },
    ]).slice(0, 8);

    const matchedProjects = smartFilterItems(projects, q, [
      { field: 'title', weight: 2.0 },
      { field: 'studentName', weight: 1.8 },
      { field: 'studentId', weight: 1.5 },
      { field: 'category', weight: 1.3 },
      { field: 'studentDepartment', weight: 1.0 },
      { field: 'description', weight: 0.8 },
      { field: (p) => (p as any).technologies || (p as any).techStack, weight: 1.2 },
      { field: (p) => (p as any).tags, weight: 1.2 },
      { field: 'fileName', weight: 1.0 },
      { field: (p) => p.collaboratorNames || [], weight: 1.2 },
    ]).slice(0, 8);

    return { students: matchedStudents, projects: matchedProjects };
  };

  const highlightText = (text: string, query: string) => {
    if (!text) return '';
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-primary/25 text-primary font-semibold rounded-[2px] px-[2px]">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const { students: matchedStudents, projects: matchedProjects } = getFilteredSuggestions();
  const hasSuggestions = matchedStudents.length > 0 || matchedProjects.length > 0;

  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        ref={ref}
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearch}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className={cn(
          "pl-10 pr-4 py-2 text-sm h-10 rounded-xl border border-border/80 bg-background/50 hover:bg-background focus:bg-background shadow-lg transition-all",
          inputClassName
        )}
      />
      {showDropdown && searchQuery.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground border border-border/80 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[360px] overflow-y-auto backdrop-blur-md bg-card/95">
          {hasSuggestions ? (
            <div className="py-2 text-left">
              {matchedStudents.length > 0 && (
                <div>
                  <div className="px-4 py-1 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest border-b border-border/30 bg-muted/10 mb-1">
                    Students
                  </div>
                  {matchedStudents.map((s) => (
                    <div
                      key={s.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        router.push(`/student/${encodeURIComponent(s.id)}`);
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/80 cursor-pointer transition-colors duration-150 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                          👤 {highlightText(s.name, searchQuery)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono">{highlightText(s.id, searchQuery)}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>{s.academicYear} Year</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="uppercase">{s.department}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {matchedProjects.length > 0 && (
                <div className={matchedStudents.length > 0 ? 'mt-2' : ''}>
                  <div className="px-4 py-1 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest border-b border-border/30 bg-muted/10 mb-1">
                    Projects
                  </div>
                  {matchedProjects.map((p) => (
                    <div
                      key={p.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        router.push(`/projects/${encodeURIComponent(p.id)}`);
                        setSearchQuery('');
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/80 cursor-pointer transition-colors duration-150 group"
                    >
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.title}
                          className="w-8 h-8 rounded-lg object-cover border border-border/50 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground border">
                          <Compass className="w-4 h-4 text-muted-foreground/60" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                          📁 {highlightText(p.title, searchQuery)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <span>{p.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No matching projects found.
            </div>
          )}
        </div>
      )}
    </div>
  );
});

GlobalSearch.displayName = 'GlobalSearch';
