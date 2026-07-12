'use client';

import Link from 'next/link';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { Compass, Upload, Users, LogOut, LogIn, Zap, Brain, User, Network, MessageSquare, Send, Building2, Menu, X, GraduationCap, Search, Bookmark, Bell } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerClose, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userType, setUserType] = useState<'student' | 'staff' | 'admin' | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = async () => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      setHasUnread(false);
      return;
    }
    try {
      const res = await fetch(`/api/notifications?studentId=${encodeURIComponent(studentId)}`);
      if (res.ok) {
        const data = await res.json();
        setHasUnread(Array.isArray(data) && data.some((n: any) => !n.isRead));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMounted(true);
    const type = localStorage.getItem('userType') as 'student' | 'staff' | 'admin' | null;
    setUserType(type);
  }, []);

  useEffect(() => {
    if (mounted) {
      checkUnread();
      window.addEventListener('notifications-changed', checkUnread);
      return () => window.removeEventListener('notifications-changed', checkUnread);
    }
  }, [mounted, userType]);

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

  const adminNavItems = [
    {
      href: '/admin/students',
      label: 'Student Management',
      icon: GraduationCap,
    },
    {
      href: '/admin/feedback',
      label: 'Feedback Management',
      icon: Send,
    },
  ];

  const defaultNavItems = [
    {
      href: '/',
      label: 'Home',
      icon: Building2,
    },
    {
      href: isLoggedIn ? '/profile' : '/auth',
      label: 'Profile',
      icon: User,
    },
    {
      href: isLoggedIn ? '/select-student' : '/auth',
      label: 'Connect Student',
      icon: Users,
    },
    {
      href: '/projects',
      label: 'Projects',
      icon: Compass,
    },
    {
      href: isLoggedIn ? '/saved-projects' : '/auth',
      label: 'Saved',
      icon: Bookmark,
    },
    {
      href: isLoggedIn ? '/notifications' : '/auth',
      label: 'Notifications',
      icon: Bell,
    },
    {
      href: '/feedback',
      label: 'Feedback',
      icon: Send,
    },
  ];

  const navItems = userType === 'admin' ? adminNavItems : defaultNavItems;

  return (
    <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop & Tablet Layout */}
        <div className="hidden md:flex items-center justify-between h-16 gap-4 w-full">
          <div className="flex items-center gap-1 min-w-[120px]">
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1">
                  <Image
                    src="/crrprojecthublogo.png"
                    alt="CRR Project Hub Logo"
                    width={42}
                    height={42}
                    className="rounded-full"
                  />
                  <span className="font-semibold text-sm inline whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                    PROJECT HUB
                  </span>
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl border-0 bg-transparent shadow-none p-0 flex items-center justify-center">
                <DialogHeader>
                  <VisuallyHidden>
                    <DialogTitle>CRR Project Hub Logo</DialogTitle>
                    <DialogDescription>Full screen preview of CRR Project Hub Logo</DialogDescription>
                  </VisuallyHidden>
                </DialogHeader>
                <Image
                  src="/crrprojecthublogo.png"
                  alt="CRR Project Hub Logo"
                  width={700}
                  height={700}
                  priority
                  className="rounded-full object-contain"
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="hidden md:flex flex-1 justify-center items-center gap-1 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isNotifications = item.label === 'Notifications';
              const isActive = (() => {
                if (item.href === '/') return pathname === '/';
                const targetPath = item.href === '/auth' 
                  ? (item.label === 'Profile' ? '/profile' 
                     : item.label === 'Connect Student' ? '/select-student' 
                     : item.label === 'Saved' ? '/saved-projects' 
                     : item.label === 'Notifications' ? '/notifications' : null)
                  : item.href;
                if (!targetPath) return false;
                
                if (targetPath === '/projects') {
                  return pathname === '/projects' || pathname.startsWith('/projects/');
                }
                return pathname === targetPath;
              })();
              return (
                <Link href={item.href} key={item.label}>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    size="sm" 
                    className={`gap-1 text-sm font-medium smooth-transition relative ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full font-semibold hover:bg-blue-100 hover:text-blue-700' 
                        : 'hover:text-primary'
                    }`}
                  >
                    <div className="relative flex items-center">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                      {isNotifications && hasUnread && (
                        <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-red-500 rounded-full border-none"></span>
                      )}
                    </div>
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {isLoggedIn ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-sm font-medium">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Link href="/auth">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>

        {/* Mobile Layout (<768px) */}
        <div className="flex md:hidden items-center justify-between h-16 w-full">
          {/* College Logo */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1">
                <Image
                  src="/crrprojecthublogo.png"
                  alt="CRR Project Hub Logo"
                  width={42}
                  height={42}
                  className="rounded-full"
                />
                <span className="font-semibold text-sm inline whitespace-nowrap bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                  PROJECT HUB
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl border-0 bg-transparent shadow-none p-0 flex items-center justify-center">
              <DialogHeader>
                <VisuallyHidden>
                  <DialogTitle>CRR Project Hub Logo</DialogTitle>
                  <DialogDescription>Full screen preview of CRR Project Hub Logo</DialogDescription>
                </VisuallyHidden>
              </DialogHeader>
              <Image
                src="/crrprojecthublogo.png"
                alt="CRR Project Hub Logo"
                width={700}
                height={700}
                priority
                className="rounded-full object-contain"
              />
            </DialogContent>
          </Dialog>

          {/* Home */}
          <Link href="/">
            <Button 
              variant={pathname === '/' ? 'secondary' : 'ghost'} 
              size="icon"
              className={`smooth-transition ${
                pathname === '/' 
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full' 
                  : ''
              }`}
            >
              <Building2 className={`w-5 h-5 ${pathname === '/' ? 'text-blue-600' : ''}`} />
            </Button>
          </Link>
 
          {/* Profile */}
          <Link href={isLoggedIn ? '/profile' : '/auth'}>
            <Button 
              variant={pathname === '/profile' ? 'secondary' : 'ghost'} 
              size="icon"
              className={`smooth-transition ${
                pathname === '/profile' 
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full' 
                  : ''
              }`}
            >
              <User className={`w-5 h-5 ${pathname === '/profile' ? 'text-blue-600' : ''}`} />
            </Button>
          </Link>
 
          {/* Projects */}
          <Link href="/projects">
            <Button 
              variant={pathname === '/projects' || pathname.startsWith('/projects/') ? 'secondary' : 'ghost'} 
              size="icon"
              className={`smooth-transition ${
                pathname === '/projects' || pathname.startsWith('/projects/') 
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full' 
                  : ''
              }`}
            >
              <Compass className={`w-5 h-5 ${pathname === '/projects' || pathname.startsWith('/projects/') ? 'text-blue-600' : ''}`} />
            </Button>
          </Link>

          {/* Logout */}
          {isLoggedIn ? (
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          ) : (
            <Link href="/auth">
              <Button variant="ghost" size="icon">
                <LogIn className="w-5 h-5" />
              </Button>
            </Link>
          )}

          {/* Hamburger Menu */}
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DrawerTrigger>

            <DrawerContent>
              <VisuallyHidden>
                <DrawerTitle>Navigation Menu</DrawerTitle>
                <DrawerDescription>Mobile navigation drawer</DrawerDescription>
              </VisuallyHidden>
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

                    <Link href="/admin/students">
                      <Button 
                        variant={pathname === '/admin/students' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`w-full justify-start gap-2 smooth-transition ${
                          pathname === '/admin/students' 
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full font-semibold hover:bg-blue-100' 
                            : ''
                        }`}
                      >
                        <GraduationCap className={`w-4 h-4 ${pathname === '/admin/students' ? 'text-blue-600' : ''}`} />
                        Student Management
                      </Button>
                    </Link>
                    <Link href="/admin/feedback">
                      <Button 
                        variant={pathname === '/admin/feedback' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`w-full justify-start gap-2 smooth-transition ${
                          pathname === '/admin/feedback' 
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full font-semibold hover:bg-blue-100' 
                            : ''
                        }`}
                      >
                        <Send className={`w-4 h-4 ${pathname === '/admin/feedback' ? 'text-blue-600' : ''}`} />
                        Feedback Management
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href={isLoggedIn ? '/saved-projects' : '/auth'}>
                      <Button 
                        variant={pathname === '/saved-projects' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`w-full justify-start gap-2 smooth-transition ${
                          pathname === '/saved-projects' 
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full font-semibold hover:bg-blue-100' 
                            : ''
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${pathname === '/saved-projects' ? 'text-blue-600' : ''}`} />
                        Saved
                      </Button>
                    </Link>
                    <Link href={isLoggedIn ? '/notifications' : '/auth'}>
                      <Button 
                        variant={pathname === '/notifications' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`w-full justify-start gap-2 smooth-transition ${
                          pathname === '/notifications' 
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full font-semibold hover:bg-blue-100' 
                            : ''
                        }`}
                      >
                        <div className="relative flex items-center">
                          <Bell className={`w-4 h-4 ${pathname === '/notifications' ? 'text-blue-600' : ''}`} />
                          {hasUnread && (
                            <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-red-500 rounded-full border-none"></span>
                          )}
                        </div>
                        Notifications
                      </Button>
                    </Link>
                    <Link href={isLoggedIn ? '/select-student' : '/auth'}>
                      <Button 
                        variant={pathname === '/select-student' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`w-full justify-start gap-2 smooth-transition ${
                          pathname === '/select-student' 
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full font-semibold hover:bg-blue-100' 
                            : ''
                        }`}
                      >
                        <Users className={`w-4 h-4 ${pathname === '/select-student' ? 'text-blue-600' : ''}`} />
                        Connect Student
                      </Button>
                    </Link>
                    <Link href="/feedback">
                      <Button 
                        variant={pathname === '/feedback' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        className={`w-full justify-start gap-2 smooth-transition ${
                          pathname === '/feedback' 
                            ? 'bg-blue-50 text-blue-600 border-2 border-blue-600 rounded-full font-semibold hover:bg-blue-100' 
                            : ''
                        }`}
                      >
                        <Send className={`w-4 h-4 ${pathname === '/feedback' ? 'text-blue-600' : ''}`} />
                        Feedback
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </nav>
  );
}
