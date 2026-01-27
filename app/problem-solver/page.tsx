'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, MessageSquare, Upload, Compass } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AIChat } from '@/components/AIChat';

type TabType = 'chat' | 'upload' | 'projects';

export default function ProblemSolverPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [selectedYear, setSelectedYear] = useState<'1st' | '2nd' | '3rd' | 'final'>('1st');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'chat', label: 'AI Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload Project', icon: <Upload className="w-4 h-4" /> },
    { id: 'projects', label: 'View Projects', icon: <Compass className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeIn">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-primary/20 smooth-transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Problem Solver
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Your complete hub for project assistance, uploads, and discovery
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 animate-slideUp flex-wrap" style={{ animationDelay: '0.1s' }}>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`gap-2 smooth-transition smooth-button ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                  : 'bg-card/50 text-foreground hover:bg-card border border-primary/20'
              }`}
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          {/* AI Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">Get Help with Your Projects</h2>
                <p className="text-muted-foreground">
                  Ask questions about coding, project ideas, debugging, or documentation. Responses are tailored to {selectedYear} year level.
                </p>
              </div>

              {/* Year Selector */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Select Your Academic Year:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['1st', '2nd', '3rd', 'final'].map((year) => (
                    <Button
                      key={year}
                      onClick={() => setSelectedYear(year as '1st' | '2nd' | '3rd' | 'final')}
                      className={`smooth-transition smooth-button ${
                        selectedYear === year
                          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                          : 'bg-card/50 text-foreground hover:bg-card border border-primary/20'
                      }`}
                    >
                      {year === 'final' ? 'Final Year' : `${year} Year`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid md:grid-cols-3 gap-4 my-6">
                {[
                  { title: 'Give me complete working code', icon: '📝', action: 'code' },
                  { title: 'How to debug errors', icon: '🐛', action: 'debug' },
                  { title: 'Project ideas', icon: '💡', action: 'ideas' },
                ].map((suggestion) => (
                  <Button
                    key={suggestion.action}
                    variant="outline"
                    className="h-auto py-4 px-4 justify-start flex-col items-start smooth-button hover:bg-primary/10 group bg-transparent"
                    onClick={() => {
                      // Scroll to chat
                      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                    }}
                  >
                    <span className="text-2xl mb-2 group-hover:scale-125 smooth-transition">{suggestion.icon}</span>
                    <span className="text-sm font-medium text-left">{suggestion.title}</span>
                  </Button>
                ))}
              </div>

              {/* AI Chat Component */}
              <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                <AIChat academicYear={selectedYear} autoMaximize={true} />
              </Card>
            </div>
          )}

          {/* Upload Project Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">Upload Your Project</h2>
                <p className="text-muted-foreground">
                  Share your projects with the community. Include descriptions and links to your work.
                </p>
              </div>

              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
                <div className="text-center space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-primary/50" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Upload?</h3>
                    <p className="text-muted-foreground mb-6">
                      Click below to navigate to the full upload form where you can add all project details.
                    </p>
                  </div>
                  <Link href="/upload">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 smooth-button gap-2">
                      <Upload className="w-4 h-4" />
                      Go to Upload
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* View Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">Discover Projects</h2>
                <p className="text-muted-foreground">
                  Browse projects from students across all years and departments. Find inspiration and learn from others.
                </p>
              </div>

              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
                <div className="text-center space-y-4">
                  <Compass className="w-12 h-12 mx-auto text-accent/50" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Explore Student Work</h3>
                    <p className="text-muted-foreground mb-6">
                      View all student projects, like them, save them, and find collaboration opportunities.
                    </p>
                  </div>
                  <Link href="/projects">
                    <Button className="bg-accent text-white hover:bg-accent/90 smooth-button gap-2">
                      <Compass className="w-4 h-4" />
                      View All Projects
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
