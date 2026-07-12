'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudentProfileCard } from '@/components/StudentProfileCard';
import { Search, Users, ArrowRight, ExternalLink } from 'lucide-react';
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
    course: s.course ?? '',
    email: s.email,
    mobileNo: s.mobileNo,
    department: s.department,
    section: s.section,
    linkedinUrl: s.linkedinUrl,
    githubUrl: s.githubUrl,
    avatar: s.avatar,
  };
}

const years = ['1st', '2nd', '3rd', 'Final'];

export default function SelectStudentPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [students, setStudents] = useState<ReturnType<typeof toRecord>[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ReturnType<typeof toRecord>[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mobile filters state
  const [filterYear, setFilterYear] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [tempFilterYear, setTempFilterYear] = useState('');
  const [tempFilterDept, setTempFilterDept] = useState('');

  // Sync temp state when mobile filter opens
  useEffect(() => {
    if (isMobileFilterOpen) {
      setTempFilterYear(filterYear);
      setTempFilterDept(filterDept);
    }
  }, [isMobileFilterOpen]);

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

  // Filter logic (combining search, year, and department)
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
        !filterDept ||
        student.department?.toLowerCase().trim() === filterDept.toLowerCase().trim();

      return matchSearch && matchYear && matchDept;
    });
    setFilteredStudents(filtered);
  }, [searchQuery, filterYear, filterDept, students]);

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
          {/* Mobile search bar and filter button */}
          <div className="flex gap-2.5 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-muted/40 border-border/60 focus:bg-background h-10 text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsMobileFilterOpen(true)}
              className="rounded-xl border-border/60 font-bold text-xs h-10 px-4 flex items-center gap-1.5"
            >
              Filter
              {(filterYear || filterDept) && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </div>

          {/* Student Cards List */}
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 pt-1">
              {filteredStudents.map((student) => (
                <Card
                  key={student.userId}
                  className="p-3.5 rounded-2xl bg-card/45 border border-border/40 shadow-sm flex items-center justify-between gap-4 active:scale-[0.99] transition-transform duration-100 text-left"
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
                         String(student.year)} Year • {student.department}
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
                onClick={() => { setSearchQuery(''); setFilterYear(''); setFilterDept(''); }}
              >
                Clear Filters
              </Button>
            </Card>
          )}
        </main>

        {/* Premium Bottom Sheet Filter */}
        <Drawer open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <DrawerContent className="p-5 space-y-4 rounded-t-[24px] border-t bg-background">
            <VisuallyHidden>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>Filter students by year and department</DrawerDescription>
            </VisuallyHidden>
            <div className="mx-auto w-12 h-1 bg-muted rounded-full mb-1" />
            <DrawerTitle className="text-center font-bold text-base text-foreground mb-1">Filters</DrawerTitle>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Year</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={tempFilterYear === '' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => setTempFilterYear('')}
                  >
                    All
                  </Button>
                  {years.map(year => (
                    <Button
                      key={year}
                      variant={tempFilterYear === year ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => setTempFilterYear(year)}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-border/40 pt-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Department</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={tempFilterDept === '' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-lg text-xs"
                    onClick={() => setTempFilterDept('')}
                  >
                    All
                  </Button>
                  {['CSE', 'IT', 'ECE', 'Mechanical', 'Civil'].map(dept => (
                    <Button
                      key={dept}
                      variant={tempFilterDept === dept ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => setTempFilterDept(dept)}
                    >
                      {dept}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-border/40">
              <Button
                variant="outline"
                className="flex-1 rounded-xl text-xs font-bold py-5"
                onClick={() => {
                  setTempFilterYear('');
                  setTempFilterDept('');
                  setFilterYear('');
                  setFilterDept('');
                  setIsMobileFilterOpen(false);
                }}
              >
                Reset
              </Button>
              <Button
                className="flex-1 rounded-xl text-xs font-bold py-5 text-white"
                onClick={() => {
                  setFilterYear(tempFilterYear);
                  setFilterDept(tempFilterDept);
                  setIsMobileFilterOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Found <span className="font-semibold">{filteredStudents.length}</span> student{filteredStudents.length !== 1 ? 's' : ''}
          </p>
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
              onClick={() => setSearchQuery('')}
              variant="outline"
              className="smooth-button"
            >
              Clear search
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
