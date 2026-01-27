'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, MessageSquare, User, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

interface Peer {
  id: string;
  name: string;
  year: string;
  department: string;
  interests: string[];
  projectTitle: string;
  lookingForCollaborators: boolean;
}

const samplePeers: Peer[] = [
  {
    id: '1',
    name: 'Raj Polimetla',
    year: '2024',
    department: 'CSE',
    interests: ['Web Development', 'AI/ML', 'Full Stack'],
    projectTitle: 'AI-Powered Study Assistant',
    lookingForCollaborators: true
  },
  {
    id: '2',
    name: 'Priya Singh',
    year: '2023',
    department: 'CSE',
    interests: ['Mobile App', 'UI/UX', 'React'],
    projectTitle: 'Campus Community App',
    lookingForCollaborators: true
  },
  {
    id: '3',
    name: 'Arun Kumar',
    year: '2022',
    department: 'IT',
    interests: ['Data Science', 'Python', 'Analytics'],
    projectTitle: 'Data Analytics Dashboard',
    lookingForCollaborators: false
  },
  {
    id: '4',
    name: 'Neha Patel',
    year: '2024',
    department: 'ECE',
    interests: ['IoT', 'Embedded Systems', 'Hardware'],
    projectTitle: 'IoT Weather Station',
    lookingForCollaborators: true
  },
  {
    id: '5',
    name: 'Vikram Reddy',
    year: '2023',
    department: 'CSE',
    interests: ['Backend', 'Databases', 'APIs'],
    projectTitle: 'E-Commerce Platform',
    lookingForCollaborators: true
  },
  {
    id: '6',
    name: 'Sophia Chen',
    year: '2025',
    department: 'CSE',
    interests: ['Machine Learning', 'Computer Vision', 'Python'],
    projectTitle: 'ML Image Recognition',
    lookingForCollaborators: false
  }
];

export default function CollaboratePage() {
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [onlyLooking, setOnlyLooking] = useState(false);

  const years = ['2025', '2024', '2023', '2022'];
  const departments = ['CSE', 'IT', 'ECE', 'Mechanical', 'Civil'];

  const filteredPeers = samplePeers.filter(peer => {
    const matchSearch =
      peer.name.toLowerCase().includes(search.toLowerCase()) ||
      peer.projectTitle.toLowerCase().includes(search.toLowerCase()) ||
      peer.interests.some(i => i.toLowerCase().includes(search.toLowerCase()));
    const matchYear = !filterYear || peer.year === filterYear;
    const matchDept = !filterDept || peer.department === filterDept;
    const matchLooking = !onlyLooking || peer.lookingForCollaborators;
    return matchSearch && matchYear && matchDept && matchLooking;
  });

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
        <Navbar />

        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold mb-2">Connect & Collaborate</h1>
              <p className="text-muted-foreground">
                Find peers working on similar projects and form teams for collaboration
              </p>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, project, or interests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex flex-wrap gap-4">
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
                  <p className="text-sm font-medium mb-2">Department</p>
                  <div className="flex gap-2">
                    <Button
                      variant={filterDept === '' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterDept('')}
                    >
                      All
                    </Button>
                    {departments.map(dept => (
                      <Button
                        key={dept}
                        variant={filterDept === dept ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterDept(dept)}
                      >
                        {dept}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    variant={onlyLooking ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOnlyLooking(!onlyLooking)}
                  >
                    Only Looking for Collaborators
                  </Button>
                </div>
              </div>
            </div>

            {/* Peers Grid */}
            {filteredPeers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredPeers.map(peer => (
                  <Card key={peer.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-primary" />
                            <h3 className="font-bold text-lg">{peer.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {peer.department} • Class of {peer.year}
                          </p>
                        </div>
                        {peer.lookingForCollaborators && (
                          <Badge className="bg-green-500/10 text-green-700 border-green-300">
                            Open to Collab
                          </Badge>
                        )}
                      </div>

                      {/* Project */}
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Current Project
                        </p>
                        <p className="font-medium">{peer.projectTitle}</p>
                      </div>

                      {/* Interests */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Interests & Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {peer.interests.map(interest => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1 gap-2" size="sm">
                          <MessageSquare className="w-4 h-4" />
                          Connect
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          Profile
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No peers found matching your criteria.</p>
                <Button variant="outline" onClick={() => { setSearch(''); setFilterYear(''); setFilterDept(''); setOnlyLooking(false); }}>
                  Clear Filters
                </Button>
              </Card>
            )}

            {/* Bottom CTA */}
            <Card className="p-8 bg-primary text-primary-foreground">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Want to Connect with More Peers?</h3>
                <p>Complete your profile to show up in search results and let others find you</p>
                <Button variant="secondary">
                  Update Your Profile
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </Suspense>
  );
}
