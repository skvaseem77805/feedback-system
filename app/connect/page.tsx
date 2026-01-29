'use client';

import { useState, useEffect, Suspense } from 'react';
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
} from 'lucide-react';
import { apiStudents, apiConnections, apiConnectionRequest, apiConnectionAccept } from '@/lib/api';
import type { ApiStudent } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import ConnectLoading from './loading';

function ConnectContent() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      }
    };
    load();
  }, [currentStudentId]);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const me = currentStudentId;
    const filtered = students.filter(
      (s) =>
        (!me || s.id !== me) &&
        (q === '' ||
          s.name.toLowerCase().includes(q) ||
          (s.bio && s.bio.toLowerCase().includes(q)) ||
          (s.skills && s.skills.some((sk) => sk.toLowerCase().includes(q))))
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students, currentStudentId]);

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

        {/* Search Bar */}
        <Card className="p-4 mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, skills, or interests..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 border-0 bg-transparent placeholder:text-muted-foreground"
            />
          </div>
        </Card>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['Web Development', 'Mobile Apps', 'AI/ML', 'Data Science'].map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer smooth-transition hover:bg-primary/20 hover:text-primary"
            >
              {tag}
            </Badge>
          ))}
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
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg group-hover:text-primary smooth-transition">
                        {student.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{student.academicYear} Year</p>
                    </div>
                  </div>
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
                      <Button variant="outline" size="sm" className="smooth-button bg-transparent">
                        View Profile
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
                    <Button
                      className="w-full smooth-button bg-primary text-primary-foreground"
                      size="sm"
                      onClick={() => handleSendRequest(student.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchQuery
                ? 'No students found matching your search'
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
