'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiCollaborations } from '@/lib/api';
import {
  Search,
  ExternalLink,
  Calendar,
  User,
  FolderOpen,
  Loader2,
  Bookmark,
} from 'lucide-react';
import { smartFilterItems } from '@/lib/smart-search';

interface CollaborationsModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CollaborativeProject {
  id: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  description: string;
  ownerName: string;
  ownerId: string;
  role: string;
  dateJoined: string;
  status: string;
}

export function CollaborationsModal({
  studentId,
  isOpen,
  onClose,
}: CollaborationsModalProps) {
  const [projects, setProjects] = useState<CollaborativeProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'recently_updated' | 'alphabetical'>('newest');

  // Load collaborative projects on open
  useEffect(() => {
    if (!isOpen || !studentId) return;

    const loadCollaborations = async () => {
      try {
        setLoading(true);
        const data = await apiCollaborations(studentId);
        setProjects(data);
      } catch (err) {
        console.error('Failed to load collaborations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCollaborations();
  }, [isOpen, studentId]);

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Filter
    if (searchQuery.trim()) {
      result = smartFilterItems(result, searchQuery.trim(), [
        { field: 'title', weight: 2.0 },
        { field: 'ownerName', weight: 1.8 },
        { field: 'category', weight: 1.5 },
        { field: 'description', weight: 1.0 },
      ]);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.dateJoined).getTime() - new Date(b.dateJoined).getTime();
      }
      if (sortBy === 'recently_updated') {
        return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 bg-card/95 backdrop-blur-md border-primary/20 shadow-2xl overflow-hidden rounded-xl">
        <DialogHeader className="border-b border-border/50 pb-4">
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-accent" />
            Collaborative Projects
          </DialogTitle>
        </DialogHeader>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 py-4 border-b border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Project Name, Owner, or Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-muted/40 border-primary/10 focus-visible:ring-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-muted/40 border border-primary/10 rounded-md p-2 text-sm text-foreground focus:ring-1 focus:ring-accent focus:outline-hidden"
            >
              <option value="newest">Newest Joined</option>
              <option value="oldest">Oldest Joined</option>
              <option value="recently_updated">Recently Updated</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Scrollable Project Cards */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-2">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading collaborations...</p>
            </div>
          ) : filteredAndSortedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAndSortedProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-col bg-muted/30 border border-primary/10 rounded-lg p-4 hover:border-primary/30 transition-all shadow-xs group"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-md overflow-hidden shrink-0 border border-primary/5 bg-linear-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <FolderOpen className="w-8 h-8 text-muted-foreground opacity-50" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base text-primary truncate group-hover:text-accent transition-colors">
                        {project.title}
                      </h4>
                      <Badge className="mt-1 bg-accent/15 text-accent hover:bg-accent/25 border-none text-[10px] py-0.5">
                        {project.category}
                      </Badge>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>Owner:</span>
                          <Link
                            href={`/student/${project.ownerId}`}
                            onClick={onClose}
                            className="text-primary hover:underline hover:text-accent font-medium truncate"
                          >
                            {project.ownerName}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role, Date Joined, Status and Open Project Button */}
                  <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Role</p>
                      <p className="font-medium text-foreground">{project.role}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Joined</p>
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{formatDate(project.dateJoined)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {project.status}
                      </span>
                    </div>
                    <div className="flex justify-end items-end">
                      <Button
                        asChild
                        size="sm"
                        className="smooth-button h-8 text-xs font-semibold"
                        onClick={onClose}
                      >
                        <Link href={`/projects/${project.id}?from=collaborations`} className="flex items-center gap-1">
                          Open Project
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-muted/10 rounded-lg border border-dashed border-primary/10">
              <FolderOpen className="w-12 h-12 text-muted-foreground opacity-30 mb-3" />
              <p className="font-bold text-primary text-lg">No collaborative projects yet.</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Collaborate with other students to see projects here.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
