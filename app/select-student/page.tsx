'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudentProfileCard } from '@/components/StudentProfileCard';
import { Search, Users, ArrowRight, ExternalLink, SlidersHorizontal } from 'lucide-react';
import type { ApiStudent } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Link from 'next/link';

function toRecord(s: ApiStudent) {
  return {
    userId: s.userId,
    name: s.name,
    registrationNo: s.registrationNo,
    uniqueId: s.uniqueId ?? '',
    year: s.year,
    email: s.email,
    department: s.department,
    section: s.section,
    linkedinUrl: s.linkedinUrl,
    githubUrl: s.githubUrl,
    avatar: s.avatar,
  };
}

const years = [
  { value: '1st', label: '1st Year' },
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: 'Final', label: 'Final Year' },
];

const branches = [
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

export default function SelectStudentPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [students, setStudents] = useState<ReturnType<typeof toRecord>[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ReturnType<typeof toRecord>[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [filterYear, setFilterYear] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { apiStudents } = await import('@/lib/api');
        const list = await apiStudents();
        const recs = list.map(toRecord);
        setStudents(recs);
        setFilteredStudents(recs);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudents();
  }, []);

  const availableSections = useMemo(() => {
    if (!students || students.length === 0) return [];
    const filtered = filterDept
      ? students.filter((s) => {
        const d = (s.department || '').toLowerCase().trim();
        const f = filterDept.toLowerCase().trim();
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
  }, [students, filterDept]);

  // Reset section filter if not available in current department
  useEffect(() => {
    if (filterSection && !availableSections.includes(filterSection)) {
      setFilterSection('');
    }
  }, [filterDept, availableSections, filterSection]);

  // Filter logic (combining search, year, department, and section)
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = students.filter((student) => {
      const matchSearch =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.userId.toLowerCase().includes(q) ||
        (student.email && student.email.toLowerCase().includes(q));

      const matchYear =
        !filterYear ||
        (student.year !== undefined && student.year !== null && (
          String(student.year).toLowerCase().trim() === filterYear.toLowerCase().trim() ||
          (filterYear === '1st' && String(student.year) === '1') ||
          (filterYear === '2nd' && String(student.year) === '2') ||
          (filterYear === '3rd' && String(student.year) === '3') ||
          (filterYear === 'Final' && String(student.year) === '4')
        ));

      const matchDept =
        !filterDept || (() => {
          const d = (student.department || '').toLowerCase().trim();
          const f = filterDept.toLowerCase().trim();
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

      const matchSection =
        !filterSection ||
        (student.section || '').toLowerCase().trim() === filterSection.toLowerCase().trim();

      return matchSearch && matchYear && matchDept && matchSection;
    });
    setFilteredStudents(filtered);
  }, [searchQuery, filterYear, filterDept, filterSection, students]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  // Render Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background pb-20 select-none antialiased">
        <Navbar />

        <main className="px-4 py-4 space-y-4">
          {/* Mobile search bar and filter icon */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students by name, ID, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20 rounded-xl bg-muted/40 border-border/60 focus:bg-background h-10 text-xs w-full"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold px-1"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterVisible(prev => !prev)}
                className={`p-1.5 rounded-lg active:scale-95 transition-none flex items-center justify-center border ${isFilterVisible
                    ? 'bg-primary border-primary text-white'
                    : 'bg-background border-border/60 text-muted-foreground'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compact Filter Panel */}
          {isFilterVisible && (
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-4">
              {/* Year Filters */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Year</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterYear('')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${filterYear === ''
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background text-foreground border-border/60'
                      }`}
                  >
                    All
                  </button>
                  {years.map((y) => (
                    <button
                      key={y.value}
                      type="button"
                      onClick={() => setFilterYear(y.value)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${filterYear === y.value
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background text-foreground border-border/60'
                        }`}
                    >
                      {y.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Department Filters */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Branch</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterDept('')}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${filterDept === ''
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background text-foreground border-border/60'
                      }`}
                  >
                    All
                  </button>
                  {branches.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setFilterDept(b.value)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${filterDept === b.value
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background text-foreground border-border/60'
                        }`}
                    >
                      {b.label}
                    </button>
                  ))}
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
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${filterSection === ''
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background text-foreground border-border/60'
                      }`}
                  >
                    All
                  </button>
                  {availableSections.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterSection(s)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-none ${filterSection === s
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background text-foreground border-border/60'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Status */}
              {(filterYear || filterDept || filterSection) && (
                <div className="flex justify-between items-center pt-2 text-[10px] text-muted-foreground font-medium border-t border-border/20">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Filters applied
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterYear('');
                      setFilterDept('');
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

          {/* Student Cards List */}
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 pt-1">
              {filteredStudents.map((student) => (
                <Card
                  key={student.userId}
                  className="p-3.5 rounded-2xl bg-card/45 border border-border/40 shadow-sm flex items-center justify-between gap-4 active:scale-[0.99] cursor-pointer transition-transform duration-100 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center flex-shrink-0 border border-border/40">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-bold text-primary">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <h4 className="font-extrabold text-foreground text-sm tracking-tight truncate leading-snug">
                        {student.name}
                      </h4>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        {String(student.year) === '1' ? '1st' :
                          String(student.year) === '2' ? '2nd' :
                            String(student.year) === '3' ? '3rd' :
                              String(student.year) === '4' ? 'Final' :
                                String(student.year)} Year • {student.department} • Section {student.section || 'E'}
                      </p>
                      <p className="text-[9px] text-muted-foreground/85 truncate">
                        Sir C.R. Reddy College of Engineering
                      </p>
                    </div>
                  </div>

                  <Link href={`/student/${student.userId}`} className="flex-shrink-0">
                    <Button size="sm" className="bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] px-3.5 h-7.5 rounded-xl border-none shadow-none">
                      View Profile
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-card/45 border-border/40 rounded-2xl">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
              <p className="text-muted-foreground mb-1 text-sm font-bold">No students found</p>
              <p className="text-xs text-muted-foreground mb-4">Try clearing filters or search query.</p>
              <Button
                size="sm"
                className="smooth-button text-xs font-bold rounded-xl"
                onClick={() => { setSearchQuery(''); setFilterYear(''); setFilterDept(''); setFilterSection(''); }}
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Student Community</span>
          </div>
          <h1 className="text-4xl font-bold text-balance">
            Browse & Connect with Students
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            Discover fellow students in your department, connect via LinkedIn, and collaborate on projects
          </p>
        </div>

        {/* Search Bar and filter button inside */}
        <div className="mb-8 space-y-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-24 h-12 rounded-xl bg-card border-border/60 focus:bg-background text-sm w-full"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold px-1"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsFilterVisible(prev => !prev)}
                className={`p-1.5 rounded-lg active:scale-95 transition-none flex items-center justify-center border ${isFilterVisible
                    ? 'bg-primary border-primary text-white'
                    : 'bg-background border-border/60 text-muted-foreground'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compact Filter Panel */}
          {isFilterVisible && (
            <div className="bg-card/45 border border-border/40 rounded-2xl p-5 shadow-sm space-y-4 text-left">
              {/* Year Filters */}
              <div className="flex items-center gap-6">
                <div className="w-16 flex-shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Year
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterYear('')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${filterYear === ''
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                      }`}
                  >
                    All
                  </button>
                  {years.map((y) => (
                    <button
                      key={y.value}
                      type="button"
                      onClick={() => setFilterYear(y.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${filterYear === y.value
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                        }`}
                    >
                      {y.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Department/Branch Filters */}
              <div className="flex items-center gap-6">
                <div className="w-16 flex-shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Branch
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterDept('')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${filterDept === ''
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                      }`}
                  >
                    All
                  </button>
                  {branches.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setFilterDept(b.value)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${filterDept === b.value
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                        }`}
                    >
                      {b.label}
                    </button>
                  ))}
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${filterSection === ''
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                      }`}
                  >
                    All
                  </button>
                  {availableSections.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFilterSection(s)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-none duration-150 ${filterSection === s
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
            <p>
              Found <span className="font-semibold">{filteredStudents.length}</span> student{filteredStudents.length !== 1 ? 's' : ''}
            </p>
            {(filterYear || filterDept || filterSection) && (
              <button
                type="button"
                onClick={() => {
                  setFilterYear('');
                  setFilterDept('');
                  setFilterSection('');
                }}
                className="text-xs text-primary font-bold hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentProfileCard
                key={student.userId}
                student={student as import('@/lib/students').StudentRecord}
                onIncrementStats={async (kind) => {
                  const { getCurrentStudentId } = await import('@/lib/statsTracker');
                  const { apiStatsIncrement } = await import('@/lib/api');
                  const id = getCurrentStudentId();
                  if (id) await apiStatsIncrement(id, kind === 'connections' ? { connections: 1 } : { collaborations: 1 });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <Users className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <p className="text-lg text-muted-foreground">No students found matching your search</p>
            <Button
              onClick={() => { setSearchQuery(''); setFilterYear(''); setFilterDept(''); setFilterSection(''); }}
              variant="outline"
              className="smooth-button"
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 pt-12 border-t border-primary/10">
          <h2 className="text-2xl font-bold mb-8 text-center">Connect & Collaborate</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mx-auto">
                <ExternalLink className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-bold">Connect via LinkedIn</h3>
              <p className="text-sm text-muted-foreground">
                Click "Connect" to visit any student's LinkedIn profile and add them to your network
              </p>
            </div>

            <div className="p-6 rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-bold">Collaborate</h3>
              <p className="text-sm text-muted-foreground">
                Choose to collaborate via LinkedIn message or email. Your collaboration count automatically increments
              </p>
            </div>

            <div className="p-6 rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto">
                <ArrowRight className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-bold">Real-Time Stats</h3>
              <p className="text-sm text-muted-foreground">
                Your profile automatically tracks connections and collaborations. Visit your profile to see stats
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
