'use client';

import Link from 'next/link';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { Compass, Upload, Users, LogOut, Zap, Brain, User, Network, MessageSquare, Send, Building2, LayoutDashboard, Menu, X, GraduationCap, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerClose } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

  const adminNavItems = [
    {
      href: '/admin/feedback',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
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
      href: '/feedback',
      label: 'Feedback',
      icon: Send,
    },
  ];

  const navItems = userType === 'admin' ? adminNavItems : defaultNavItems;

  return (
    <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
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
                  <span className="font-semibold text-sm hidden sm:inline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                    PROJECT HUB
                  </span>
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl border-0 bg-transparent shadow-none p-0 flex items-center justify-center">
                <DialogTitle className="sr-only">CRR Project Hub Logo</DialogTitle>
                <DialogDescription className="sr-only">Full screen preview of CRR Project Hub Logo</DialogDescription>
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
            {navItems.map((item) => (
              <Link href={item.href} key={item.label}>
                <Button variant="ghost" size="sm" className="gap-1 text-sm font-medium hover:text-primary smooth-transition">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
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
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="/admin/students">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Student Management
                        </Button>
                      </Link>
                      <Link href="/admin/feedback">
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <Send className="w-4 h-4" />
                          Feedback Management
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
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-2 text-sm">
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
        </div>
      </div>
    </nav>
  );
}
