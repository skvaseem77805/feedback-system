'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, Upload, Users, LogOut, Zap, Brain, User, Network, MessageSquare, Send, Building2, LayoutDashboard, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerClose } from '@/components/ui/drawer';

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
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-bold text-xs">CRR</span>
            </div>
            <span className="font-bold hidden sm:inline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">PROJECT HUB</span>
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
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2 hover:text-primary smooth-transition">
                    <Building2 className="w-4 h-4" />
                    Home
                  </Button>
                </Link>
                <Link href={isLoggedIn ? '/profile' : '/auth'}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </Link>
                <Link href={isLoggedIn ? '/select-student' : '/auth'}>
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
                {/* <Link href="/problem-solver">
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
                </Link> */}
                <Link href="/feedback">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Send className="w-4 h-4" />
                    Feedback
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <Drawer direction="right">
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="gap-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </DrawerTrigger>

              <DrawerContent>
                <DrawerHeader>
                  <div className="flex items-center justify-between w-full">
                    <Link href="/" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="text-white font-bold text-xs">CRR</span>
                      </div>
                      <span className="font-bold">PROJECT HUB</span>
                    </Link>
                    <DrawerClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="w-5 h-5" />
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerHeader>

                <div className="p-4 space-y-2">
                  {userType === 'admin' ? (
                    <>
                      <Link href="/admin/feedback">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Feedback
                        </Button>
                      </Link>
                      <Link href="/">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <Building2 className="w-4 h-4" />
                          Home
                        </Button>
                      </Link>

                      <Link href={isLoggedIn ? '/profile' : '/auth'}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <User className="w-4 h-4" />
                          Profile
                        </Button>
                      </Link>

                      <Link href={isLoggedIn ? '/select-student' : '/auth'}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <Users className="w-4 h-4" />
                          Connect Student
                        </Button>
                      </Link>

                      <Link href="/projects">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <Compass className="w-4 h-4" />
                          Projects
                        </Button>
                      </Link>

                      <Link href="/feedback">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <Send className="w-4 h-4" />
                          Feedback
                        </Button>
                      </Link>
                    </>
                  )}

                  <div className="pt-2 border-t">
                    {isLoggedIn ? (
                      <DrawerClose asChild>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2">
                          <LogOut className="w-4 h-4" />
                          Logout
                        </Button>
                      </DrawerClose>
                    ) : (
                      <Link href="/auth">
                        <Button className="w-full">Login</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* <span className="text-xs text-muted-foreground px-2 hidden sm:inline">
                  {userType === 'admin' ? 'Admin' : userType === 'staff' ? 'Staff' : 'Student'}
                </span> */}
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
