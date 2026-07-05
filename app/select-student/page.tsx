'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StudentProfileCard } from '@/components/StudentProfileCard';
import { Search, Users, ArrowRight, ExternalLink } from 'lucide-react';
import type { ApiStudent } from '@/lib/api';

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
  };
}

export default function SelectStudentPage() {
  const router = useRouter();
  const [students, setStudents] = useState<ReturnType<typeof toRecord>[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ReturnType<typeof toRecord>[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<ReturnType<typeof toRecord> | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const { apiAdminStudents } = await import('@/lib/api');
        const list = await apiAdminStudents();
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = students.filter(
      student =>
        student.name.toLowerCase().includes(query.toLowerCase()) ||
        student.userId.toLowerCase().includes(query.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredStudents(filtered);
  };

  // switchToStudent removed for security


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
              onChange={(e) => handleSearch(e.target.value)}
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
                /* onSelect removed to prevent impersonation/login switching */
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
              onClick={() => handleSearch('')}
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
