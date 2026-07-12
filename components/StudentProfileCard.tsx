'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Linkedin, Github, Mail, ExternalLink } from 'lucide-react';
import { incrementConnections, incrementCollaborations, getCurrentStudentId } from '@/lib/statsTracker';
import type { StudentRecord } from '@/lib/students';

interface StudentProfileCardProps {
  student: StudentRecord;
  onSelect?: (student: StudentRecord) => void;
  /** When provided, called instead of localStorage stats (e.g. when using DB). */
  onIncrementStats?: (kind: 'connections' | 'collaborations') => void | Promise<void>;
}

export function StudentProfileCard({
  student,
  onSelect,
  onIncrementStats,
}: StudentProfileCardProps) {
  const [collaborateOpen, setCollaborateOpen] = useState(false);

  const inc = (kind: 'connections' | 'collaborations') => {
    const currentStudentId = getCurrentStudentId();
    if (!currentStudentId || currentStudentId === student.userId) return;
    if (onIncrementStats) {
      void Promise.resolve(onIncrementStats(kind));
    } else {
      if (kind === 'connections') incrementConnections(currentStudentId);
      else incrementCollaborations(currentStudentId);
    }
  };

  const handleConnect = () => {
    inc('connections');
    const linkedinUrl = student.linkedinUrl || 'https://linkedin.com';
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCollaborateLinkedIn = () => {
    inc('collaborations');
    const linkedinUrl = student.linkedinUrl || 'https://linkedin.com';
    window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
    setCollaborateOpen(false);
  };

  const handleCollaborateEmail = () => {
    inc('collaborations');
    if (student.email) {
      const subject = encodeURIComponent('Project Collaboration Request');
      const body = encodeURIComponent(
        `Hi ${student.name},\n\nI would like to collaborate with you on a project. Please let me know if you are interested!\n\nBest regards`
      );
      window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
    }
    setCollaborateOpen(false);
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition group overflow-hidden">
      <div className="space-y-4">
        {/* Header with initials */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
            {student.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <Badge className="bg-primary/20 text-primary text-xs">
            {student.department}
          </Badge>
        </div>

        {/* Student Info */}
        <div className="space-y-2">
          <h3 className="font-bold group-hover:text-primary smooth-transition line-clamp-2">
            {student.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {student.course}
          </p>
          <div className="flex flex-col gap-1">
            {student.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {student.email}
              </p>
            )}
            {/* {student.mobileNo && (
              <p className="text-xs text-muted-foreground">
                {student.mobileNo}
              </p>
            )} */}
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 space-y-2 border-t border-primary/10">
          {student.linkedinUrl ? (
            <Button
              asChild
              size="sm"
              className="w-full smooth-button bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => inc('connections')}
            >
              <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <Linkedin className="w-3 h-3 mr-1.5" />
                LinkedIn
              </a>
            </Button>
          ) : (
            <Button disabled variant="outline" size="sm" className="w-full smooth-button opacity-50">
              <Linkedin className="w-3 h-3 mr-1.5" />
              No LinkedIn
            </Button>
          )}

          {student.githubUrl ? (
            <Button
              asChild
              size="sm"
              className="w-full smooth-button bg-gray-800 text-white hover:bg-gray-900"
            >
              <a href={student.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <Github className="w-3 h-3 mr-1.5" />
                GitHub
              </a>
            </Button>
          ) : (
            <Button disabled variant="outline" size="sm" className="w-full smooth-button opacity-50">
              <Github className="w-3 h-3 mr-1.5" />
              No GitHub
            </Button>
          )}

          {/* Public View Profile Link */}
          <Button
            onClick={() => window.location.href = `/student/${student.userId}`}
            size="sm"
            variant="outline"
            className="w-full smooth-button bg-transparent hover:bg-primary/5"
          >
            <ExternalLink className="w-3 h-3 mr-1.5" />
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  );
}
