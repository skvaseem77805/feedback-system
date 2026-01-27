'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { AIChat } from '@/components/AIChat';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AIChatPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<'1st' | '2nd' | '3rd' | 'final'>('1st');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with navigation */}
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
                AI Problem Solver Chat
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Get instant help with your projects and coding questions
              </p>
            </div>
          </div>
        </div>

        {/* Year selector */}
        <div className="mb-8 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <p className="text-sm font-medium text-foreground mb-3">Select Your Academic Year:</p>
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

        {/* Chat interface - fully maximized */}
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <AIChat academicYear={selectedYear} autoMaximize={true} />
        </div>
      </div>
    </div>
  );
}
