'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  UserPlus,
  MessageCircle,
  Zap,
  Filter,
} from 'lucide-react';
import { apiStudents, apiConnections, apiConnectionRequest, apiConnectionAccept } from '@/lib/api';
import type { ApiStudent } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import ConnectLoading from './loading';
import { smartFilterItems } from '@/lib/smart-search';

import { loadPageState, savePageState, saveScrollPosition, restoreScrollPosition } from '@/lib/state-preservation';

function ConnectContent() {
  const savedState = loadPageState('connect', {
    searchQuery: '',
    selectedYear: '',
    selectedBranch: '',
    selectedSection: '',
    selectedTag: '',
  });

  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery || '');
  const [selectedYear, setSelectedYear] = useState(savedState.selectedYear || '');
  const [selectedBranch, setSelectedBranch] = useState(savedState.selectedBranch || '');
  const [selectedSection, setSelectedSection] = useState(savedState.selectedSection || '');
  const [selectedTag, setSelectedTag] = useState(savedState.selectedTag || '');

  const [filteredStudents, setFilteredStudents] = useState<ApiStudent[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [connections, setConnections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const currentStudentId = getCurrentStudentId() ?? '';

  useEffect(() => {
    const load = async () => {
      try {
        const [list, conn] = await Promise.all([
          apiStudents(),
          currentStudentId ? apiConnections(currentStudentId) : { connections: [] as string[], sent: [] as string[], received: [] as string[] },
        ]);
        setStudents(list);
        setConnections(conn.connections);
        setSentRequests(conn.sent);
      } catch (e) {
        console.error('Connect load error:', e);
      } finally {
        setLoading(false);
        restoreScrollPosition('connect');
      }
    };
    load();
  }, [currentStudentId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        saveScrollPosition('connect');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    savePageState('connect', {
      searchQuery,
      selectedYear,
      selectedBranch,
      selectedSection,
      selectedTag,
    });

    const q = searchQuery.trim();
    const me = currentStudentId;
    let baseList = students.filter((s) => !me || s.id !== me);

    if (selectedYear) {
      baseList = baseList.filter((s) => (s.academicYear || s.year || '').toString().toLowerCase().includes(selectedYear.toLowerCase()));
    }
    if (selectedBranch) {
      baseList = baseList.filter((s) => s.department === selectedBranch);
    }
    if (selectedSection) {
      baseList = baseList.filter((s) => (s.section || '').toUpperCase() === selectedSection.toUpperCase());
    }
    if (selectedTag) {
      baseList = baseList.filter((s) =>
        (s.skills && s.skills.some((sk) => sk.toLowerCase().includes(selectedTag.toLowerCase()))) ||
        (s.bio && s.bio.toLowerCase().includes(selectedTag.toLowerCase()))
      );
    }

    if (!q) {
      setFilteredStudents(baseList);
    } else {
      const filtered = smartFilterItems(baseList, q, [
        { field: 'name', weight: 2.0 },
        { field: 'registrationNo', weight: 1.8 },
        { field: 'id', weight: 1.8 },
        { field: 'email', weight: 1.5 },
        { field: 'department', weight: 1.2 },
        { field: 'section', weight: 1.0 },
        { field: 'academicYear', weight: 1.0 },
        { field: (s) => (s.year ? `${s.year} year` : ''), weight: 1.0 },
        { field: 'bio', weight: 1.0 },
        { field: (s) => s.skills || [], weight: 1.2 },
      ]);
      setFilteredStudents(filtered);
    }
  }, [searchQuery, selectedYear, selectedBranch, selectedSection, selectedTag, students, currentStudentId]);

  const handleSearch = (query: string) => setSearchQuery(query);

  const handleSendRequest = async (targetStudentId: string) => {
    if (!currentStudentId) return;
    try {
      await apiConnectionRequest(currentStudentId, targetStudentId);
      setSentRequests((prev) => (prev.includes(targetStudentId) ? prev : [...prev, targetStudentId]));
    } catch (e) {
      console.error('Send request error:', e);
    }
  };

  const handleAcceptConnection = async (targetStudentId: string) => {
    if (!currentStudentId) return;
    try {
      await apiConnectionAccept(currentStudentId, targetStudentId);
      setConnections((prev) => (prev.includes(targetStudentId) ? prev : [...prev, targetStudentId]));
      setSentRequests((prev) => prev.filter((id) => id !== targetStudentId));
    } catch (e) {
      console.error('Accept connection error:', e);
    }
  };

  const isConnected = (studentId: string) => connections.includes(studentId);
  const hasRequestSent = (studentId: string) => sentRequests.includes(studentId);

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Connect with Peers
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Find and connect with students sharing similar interests and skills. Build collaborations and grow together.
          </p>
        </div>

        {/* Search Bar & Filters */}
        <Card className="p-4 mb-6 bg-card/50 backdrop-blur-sm border-primary/20 space-y-3">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, skills, or interests..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-background/80 text-foreground text-xs p-1.5 rounded-lg border border-input focus:outline-none"
              >
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-background/80 text-foreground text-xs p-1.5 rounded-lg border border-input focus:outline-none"
              >
                <option value="">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="CSY">CSY</option>
                <option value="AI&ML">AI&ML</option>
                <option value="AI&DS">AI&DS</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-background/80 text-foreground text-xs p-1.5 rounded-lg border border-input focus:outline-none"
              >
                <option value="">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
                <option value="E">Section E</option>
                <option value="F">Section F</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['Web Development', 'Mobile Apps', 'AI/ML', 'Data Science'].map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <Badge
                key={tag}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => setSelectedTag(isSelected ? '' : tag)}
                className={`cursor-pointer smooth-transition ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary/20 hover:text-primary'
                }`}
              >
                {tag}
              </Badge>
            );
          })}
        </div>

        {/* Students Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        ) : filteredStudents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition group"
              >
                {/* Header with Avatar */}
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/student/${student.id}`} className="flex items-center gap-4 flex-1 group-hover:opacity-90">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg group-hover:text-primary smooth-transition">
                        {student.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {student.academicYear} Year • {student.department} • Section {student.section || 'E'}
                      </p>
                    </div>
                  </Link>
                  <Badge className="bg-accent/20 text-accent text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>

                {/* Bio */}
                {student.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {student.bio}
                  </p>
                )}

                {/* Skills */}
                {student.skills && student.skills.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {student.skills.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-primary/10 text-primary text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {student.skills.length > 3 && (
                        <Badge
                          variant="secondary"
                          className="bg-muted/50 text-muted-foreground text-xs"
                        >
                          +{student.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center py-3 border-t border-b border-border/50">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">{student.projectsUploaded ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-accent">{student.connectionsCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Connections</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-secondary">{student.collaborationsCount ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Collabs</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isConnected(student.id) ? (
                    <>
                      <Button
                        className="flex-1 smooth-button bg-primary text-primary-foreground"
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="smooth-button bg-transparent" asChild>
                        <Link href={`/student/${student.id}`}>View Profile</Link>
                      </Button>
                    </>
                  ) : hasRequestSent(student.id) ? (
                    <Button
                      className="w-full smooth-button bg-accent/20 text-accent"
                      size="sm"
                      disabled
                    >
                      Request Sent
                    </Button>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <Button
                        className="flex-1 smooth-button bg-primary text-primary-foreground"
                        size="sm"
                        onClick={() => handleSendRequest(student.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline" size="sm" className="smooth-button bg-transparent" asChild>
                        <Link href={`/student/${student.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchQuery || selectedYear || selectedBranch || selectedSection || selectedTag
                ? 'No students found matching your filters'
                : 'Search for students to get started'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={<ConnectLoading />}>
      <ConnectContent />
    </Suspense>
  );
}
