'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  CheckCircle,
  Clock,
  Pause,
  MessageSquare,
  GitBranch,
} from 'lucide-react';
import { mockProjects, getStudentProfile, joinCollaboration } from '@/lib/data';
import type { Project, StudentProfile } from '@/lib/data';

export default function CollaborateProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(Object.values(mockProjects));
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'open'>('all');
  const [showNewCollaborationDialog, setShowNewCollaborationDialog] = useState(false);
  const [newCollaborationData, setNewCollaborationData] = useState({
    title: '',
    description: '',
    technologies: '',
  });
  const [userJoinedProjects, setUserJoinedProjects] = useState<string[]>([]);
  const currentStudentId = 'student1';
  const currentStudent = getStudentProfile(currentStudentId);

  useEffect(() => {
    let filtered = projects;

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus === 'open') {
      filtered = filtered.filter((p) => !p.collaborators.includes(currentStudentId));
    } else if (selectedStatus === 'active') {
      filtered = filtered.filter((p) => p.collaborators.includes(currentStudentId));
    }

    setFilteredProjects(filtered);
  }, [searchQuery, selectedStatus, projects]);

  const handleJoinProject = (projectId: string) => {
    if (joinCollaboration(projectId, currentStudentId)) {
      setUserJoinedProjects([...userJoinedProjects, projectId]);
      setProjects(projects.map((p) => (p.id === projectId ? { ...p, collaborators: [...p.collaborators, currentStudentId] } : p)));
    }
  };

  const handleCreateCollaboration = () => {
    if (newCollaborationData.title && newCollaborationData.description) {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        studentId: currentStudentId,
        studentName: currentStudent?.name || 'Anonymous',
        academicYear: currentStudent?.academicYear || '2nd',
        title: newCollaborationData.title,
        description: newCollaborationData.description,
        category: 'Collaboration',
        uploadedAt: new Date(),
        likes: 0,
        savedBy: [],
        collaborators: [currentStudentId],
      };
      setProjects([newProject, ...projects]);
      setShowNewCollaborationDialog(false);
      setNewCollaborationData({ title: '', description: '', technologies: '' });
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'paused') return <Pause className="w-4 h-4 text-yellow-500" />;
    return <Clock className="w-4 h-4 text-blue-500" />;
  };

  const isAlreadyJoined = (projectId: string) => userJoinedProjects.includes(projectId) || false;
  const isProjectOwner = (project: Project) => project.studentId === currentStudentId;

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Collaborative Projects
            </h1>
            <p className="text-muted-foreground">Join teams or create new collaborations with your peers</p>
          </div>
          <Button
            className="smooth-button bg-primary text-primary-foreground w-fit"
            onClick={() => setShowNewCollaborationDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Start a Collaboration
          </Button>
        </div>

        {/* Filter and Search */}
        <div className="space-y-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search collaborations by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="smooth-transition"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'open', 'active'] as const).map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  className="smooth-button capitalize"
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Collaboration Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const collaboratorCount = project.collaborators.length;
              const isJoined = project.collaborators.includes(currentStudentId);
              const isOwner = isProjectOwner(project);

              return (
                <Card
                  key={project.id}
                  className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition group flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg group-hover:text-primary smooth-transition line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Led by {project.studentName}
                      </p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-500 text-xs whitespace-nowrap ml-2">
                      <Users className="w-3 h-3 mr-1" />
                      {collaboratorCount}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {project.description}
                  </p>

                  {/* Category Badge */}
                  <div className="mb-4">
                    <Badge className="bg-accent/20 text-accent">
                      {project.category}
                    </Badge>
                  </div>

                  {/* Collaborators Preview */}
                  <div className="mb-4 pb-4 border-b border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Collaborators
                    </p>
                    <div className="flex items-center gap-2">
                      {project.collaborators.slice(0, 3).map((collab, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold"
                        >
                          {idx + 1}
                        </div>
                      ))}
                      {collaboratorCount > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{collaboratorCount - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 mt-auto">
                    {isJoined ? (
                      <>
                        <Button
                          className="w-full smooth-button bg-green-500/20 text-green-500"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          You're a Collaborator
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full smooth-button bg-transparent"
                          size="sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Discussion
                        </Button>
                      </>
                    ) : isOwner ? (
                      <Button
                        variant="outline"
                        className="w-full smooth-button bg-transparent"
                        size="sm"
                      >
                        <GitBranch className="w-4 h-4 mr-2" />
                        Manage Project
                      </Button>
                    ) : (
                      <Button
                        className="w-full smooth-button bg-primary text-primary-foreground"
                        size="sm"
                        onClick={() => handleJoinProject(project.id)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Join Team
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchQuery ? 'No collaborations found' : 'No active collaborations yet'}
            </p>
            {!searchQuery && (
              <Button
                className="mt-4 smooth-button bg-primary text-primary-foreground"
                onClick={() => setShowNewCollaborationDialog(true)}
              >
                Start the First One
              </Button>
            )}
          </Card>
        )}

        {/* New Collaboration Dialog */}
        <Dialog open={showNewCollaborationDialog} onOpenChange={setShowNewCollaborationDialog}>
          <DialogContent className="smooth-transition">
            <DialogHeader>
              <DialogTitle>Start a New Collaboration</DialogTitle>
              <DialogDescription>
                Create a new collaborative project and invite others to join
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Project Title</label>
                <Input
                  placeholder="Enter collaboration title"
                  value={newCollaborationData.title}
                  onChange={(e) =>
                    setNewCollaborationData({
                      ...newCollaborationData,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe your collaboration project"
                  value={newCollaborationData.description}
                  onChange={(e) =>
                    setNewCollaborationData({
                      ...newCollaborationData,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Technologies</label>
                <Input
                  placeholder="React, Node.js, Python, etc. (comma-separated)"
                  value={newCollaborationData.technologies}
                  onChange={(e) =>
                    setNewCollaborationData({
                      ...newCollaborationData,
                      technologies: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 smooth-button bg-primary text-primary-foreground"
                  onClick={handleCreateCollaboration}
                >
                  Create Collaboration
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 smooth-button bg-transparent"
                  onClick={() => setShowNewCollaborationDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
