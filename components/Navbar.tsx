'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, Upload, Users, LogOut, Zap, Brain, User, Network, MessageSquare, Send, Building2, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Navbar() {
  const router = useRouter();
  const [userType, setUserType] = useState<'student' | 'staff' | 'admin' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const type = localStorage.getItem('userType') as 'student' | 'staff' | 'admin' | null;
    setUserType(type);
  }, []);

  const handleLogout = () => {
    // Clear all session/auth data
    localStorage.removeItem('studentId');
    localStorage.removeItem('studentName');
    localStorage.removeItem('year');
    localStorage.removeItem('userType');
    localStorage.removeItem('staffId');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminId');
    setUserType(null);
    router.push('/');
  };

  if (!mounted) return null;

  const isLoggedIn = userType === 'student' || userType === 'staff' || userType === 'admin';

  return (
    <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">CRR</span>
            </div>
            <span className="font-bold hidden sm:inline">PROJECT HUB</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {userType === 'admin' ? (
              <>
                <Link href="/admin/feedback">
                  <Button variant="ghost" size="sm" className="gap-2 hover:text-primary smooth-transition">
                    <MessageSquare className="w-4 h-4" />
                    Feedback
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2 hover:text-primary smooth-transition">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/college">
                  <Button variant="ghost" size="sm" className="gap-2 hover:text-primary smooth-transition">
                    <Building2 className="w-4 h-4" />
                    College
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </Link>
                <Link href="/select-student">
                  <Button variant="ghost" size="sm" className="gap-2 hover:text-accent smooth-transition">
                    <Users className="w-4 h-4" />
                    <span className="hidden lg:inline text-xs">connect Student</span>
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Compass className="w-4 h-4" />
                    Projects
                  </Button>
                </Link>
                <Link href="/problem-solver">
                  <Button variant="ghost" size="sm" className="gap-2 hover:text-primary smooth-transition">
                    <MessageSquare className="w-4 h-4" />
                    AI Chat
                  </Button>
                </Link>
                <Link href="/connect">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Network className="w-4 h-4" />
                    Connect
                  </Button>
                </Link>
                <Link href="/collaborate-projects">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Users className="w-4 h-4" />
                    Collaborate
                  </Button>
                </Link>
                <Link href="/feedback">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Send className="w-4 h-4" />
                    Feedback
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <span className="text-xs text-muted-foreground px-2 hidden sm:inline">
                  {userType === 'admin' ? 'Admin' : userType === 'staff' ? 'Staff' : 'Student'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
