'use client';

import Link from 'next/link';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import {
  Compass,
  Upload,
  Users,
  LogOut,
  LogIn,
  Zap,
  Brain,
  User,
  Network,
  MessageSquare,
  Send,
  Building2,
  Menu,
  X,
  GraduationCap,
  Search,
  Bookmark,
  Bell,
  Home,
  ArrowLeft,
  Plus,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerClose,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useToast } from '@/hooks/use-toast';
import { useSafeBack } from '@/hooks/useSafeBack';
import { apiStudent } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const safeBack = useSafeBack();
  const { toast } = useToast();

  const [userType, setUserType] = useState<'student' | 'staff' | 'admin' | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Mobile navigation and preview states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Logo hold interaction refs
  const pressTimer = useRef<any>(null);
  const hasLongPressed = useRef(false);

  const startPress = () => {
    hasLongPressed.current = false;
    pressTimer.current = setTimeout(() => {
      hasLongPressed.current = true;
      setIsLogoModalOpen(true);
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 600);
  };

  const endPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (hasLongPressed.current) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      router.push("/");
    }
  };

  const focusHomeSearch = () => {
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

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

  const isLoggedIn = userType === 'student' || userType === 'staff' || userType === 'admin';

  // Load user info for mobile drawer
  useEffect(() => {
    if (mounted && isLoggedIn) {
      const studentId = localStorage.getItem("studentId");
      const name = localStorage.getItem("studentName") || localStorage.getItem("adminEmail") || "User";
      const dept = localStorage.getItem("studentDepartment") || "";
      const year = localStorage.getItem("year") || "";

      setUserInfo({
        id: studentId || localStorage.getItem("staffId") || localStorage.getItem("adminId"),
        name,
        dept,
        year: year ? `${year} Year` : "",
        userType,
      });

      if (studentId) {
        apiStudent(studentId)
          .then((data) => {
            if (data) {
              setUserInfo((prev: any) => ({
                ...prev,
                avatar: data.avatar,
                name: data.name,
                dept: data.department,
                year: data.academicYear ? `${data.academicYear} Year` : prev?.year,
              }));
            }
          })
          .catch((err) => console.error("Error loading user profile in Navbar:", err));
      }
    }
  }, [mounted, isLoggedIn, userType]);

  const handleLogout = () => {
    localStorage.removeItem('studentId');
    localStorage.removeItem('studentName');
    localStorage.removeItem('year');
    localStorage.removeItem('userType');
    localStorage.removeItem('staffId');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminId');
    setUserType(null);
    setUserInfo(null);
    setIsDrawerOpen(false);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/');
  };

  if (!mounted) return null;

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
    <>
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop & Tablet Layout */}
          <div className="hidden md:flex items-center justify-between h-16 w-full">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/crrprojecthublogo.png"
                  alt="CRR Project Hub Logo"
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  PROJECT HUB
                </span>
              </Link>

              <div className="flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        size="sm"
                        className="gap-2 smooth-transition rounded-full"
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2 text-muted-foreground hover:text-destructive smooth-transition rounded-full"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth">
                <Button size="sm">Login</Button>
              </Link>
            )}
          </div>

          {/* Mobile Layout (<768px) */}
          <div className="flex md:hidden items-center justify-between h-14 w-full">
            <div className="flex items-center gap-3">
              {pathname !== '/' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => safeBack("/")}
                  className="h-9 w-9 rounded-full active:scale-90 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Button>
              )}
              
              <div 
                className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform duration-150"
                onTouchStart={startPress}
                onTouchEnd={endPress}
                onMouseDown={startPress}
                onMouseUp={endPress}
                onClick={handleLogoClick}
              >
                <img
                  src="/crrprojecthublogo.png"
                  alt="College Logo"
                  className="w-8 h-8 rounded-full border border-border/40"
                />
                <span className="font-bold text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                  PROJECT HUB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {pathname === '/' && (
                <Button variant="ghost" size="icon" onClick={focusHomeSearch} className="h-9 w-9 rounded-full">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </Button>
              )}

              {/* Menu Drawer */}
              <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Menu className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85%] max-w-[360px] p-0 flex flex-col bg-background h-full">
                  <VisuallyHidden>
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>Mobile navigation drawer for secondary actions</SheetDescription>
                  </VisuallyHidden>
                  <SheetHeader className="p-0 border-b border-border/40">
                    <div className="p-5 flex flex-col items-center text-center space-y-3">
                      {isLoggedIn && userInfo ? (
                        <Link
                          href="/profile"
                          onClick={() => setIsDrawerOpen(false)}
                          className="flex flex-col items-center group w-full active:opacity-75 transition-opacity"
                        >
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner group-hover:scale-105 transition-transform duration-200">
                            {userInfo.avatar ? (
                              <img
                                src={userInfo.avatar}
                                alt={userInfo.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                {userInfo.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-foreground text-base mt-3 leading-tight line-clamp-1">
                            {userInfo.name}
                          </h4>
                          {userInfo.userType === 'student' ? (
                            <>
                              <p className="text-xs text-muted-foreground font-semibold mt-1">
                                {userInfo.dept} Department
                              </p>
                              <p className="text-[10px] text-primary/80 font-bold bg-primary/10 px-2 py-0.5 rounded-full mt-2">
                                {userInfo.year}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full mt-2">
                              {userInfo.userType}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <div className="w-full py-4 flex flex-col items-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <h4 className="font-bold text-foreground text-sm">Welcome to Project Hub</h4>
                          <Button
                            size="sm"
                            className="w-full max-w-[180px] bg-primary text-white rounded-full font-semibold"
                            onClick={() => {
                              setIsDrawerOpen(false);
                              router.push("/auth");
                            }}
                          >
                            Sign In / Register
                          </Button>
                        </div>
                      )}
                    </div>
                  </SheetHeader>

                  {/* Drawer Links - NO DUPLICATION of bottom nav items */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    <Link
                      href={isLoggedIn ? "/select-student" : "/auth"}
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted rounded-xl transition-colors text-foreground text-sm font-medium"
                    >
                      <span className="text-lg">👥</span>
                      <span>Connect Student</span>
                    </Link>

                    <Link
                      href={isLoggedIn ? "/saved-projects" : "/auth"}
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted rounded-xl transition-colors text-foreground text-sm font-medium"
                    >
                      <span className="text-lg">⭐</span>
                      <span>Saved Projects</span>
                    </Link>

                    <Link
                      href="/feedback"
                      onClick={() => setIsDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted rounded-xl transition-colors text-foreground text-sm font-medium"
                    >
                      <span className="text-lg">💬</span>
                      <span>Feedback</span>
                    </Link>

                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setIsAboutOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 active:bg-muted rounded-xl transition-colors text-foreground text-sm font-medium text-left"
                    >
                      <span className="text-lg">ℹ️</span>
                      <span>About Project Hub</span>
                    </button>
                  </div>

                  {isLoggedIn && (
                    <div className="p-4 border-t border-border/40">
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50/50 active:bg-red-50 rounded-xl"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold text-sm">Logout</span>
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (fixed bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-md border-t border-border/40 pb-safe shadow-lg flex justify-between items-center px-6 md:hidden">
        <button
          onClick={() => router.push('/')}
          className={`flex flex-col items-center gap-1 active:opacity-75 transition-opacity ${
            pathname === '/' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight">Home</span>
        </button>

        <button
          onClick={() => router.push('/projects')}
          className={`flex flex-col items-center gap-1 active:opacity-75 transition-opacity ${
            pathname === '/projects' || pathname.startsWith('/projects/') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight">Projects</span>
        </button>

        {/* Center Upload Button */}
        <div className="relative -top-3">
          <button 
            onClick={() => setIsUploadSheetOpen(true)}
            className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        <button
          onClick={() => router.push(isLoggedIn ? '/notifications' : '/auth')}
          className={`flex flex-col items-center gap-1 active:opacity-75 transition-opacity relative ${
            pathname === '/notifications' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
            )}
          </div>
          <span className="text-[9px] font-bold tracking-tight">Notifications</span>
        </button>

        <button
          onClick={() => router.push(isLoggedIn ? '/profile' : '/auth')}
          className={`flex flex-col items-center gap-1 active:opacity-75 transition-opacity ${
            pathname === '/profile' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-tight">Profile</span>
        </button>
      </nav>

      {/* Floating Upload Bottom Sheet (Drawer) */}
      <Drawer open={isUploadSheetOpen} onOpenChange={setIsUploadSheetOpen}>
        <DrawerContent className="p-5 space-y-4 rounded-t-[24px] border-t bg-background">
          <VisuallyHidden>
            <DrawerDescription>Upload actions and shortcuts</DrawerDescription>
          </VisuallyHidden>
          <div className="mx-auto w-12 h-1 bg-muted rounded-full mb-1" />
          <DrawerTitle className="text-center font-bold text-base text-foreground mb-2">Create & Manage</DrawerTitle>
          
          <div className="space-y-2.5">
            <button
              onClick={() => {
                setIsUploadSheetOpen(false);
                router.push(isLoggedIn ? "/upload" : "/auth");
              }}
              className="w-full flex items-center justify-between p-4 bg-muted/30 active:bg-muted/70 rounded-xl transition-colors text-left"
            >
              <span className="font-semibold text-foreground text-sm flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-primary stroke-[2.5]" />
                <span>Upload New Project</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => {
                setIsUploadSheetOpen(false);
                router.push(isLoggedIn ? "/profile" : "/auth");
              }}
              className="w-full flex items-center justify-between p-4 bg-muted/30 active:bg-muted/70 rounded-xl transition-colors text-left"
            >
              <span className="font-semibold text-foreground text-sm flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-primary stroke-[2.5]" />
                <span>My Projects</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => {
                setIsUploadSheetOpen(false);
                toast({
                  title: "Draft Projects",
                  description: "Draft projects feature is coming soon!",
                  duration: 2000,
                });
              }}
              className="w-full flex items-center justify-between p-4 bg-muted/30 active:bg-muted/70 rounded-xl transition-colors text-left"
            >
              <span className="font-semibold text-foreground text-sm flex items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-primary stroke-[2.5]" />
                <span>Draft Projects</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <DrawerClose asChild>
            <Button variant="outline" className="w-full py-5 rounded-xl font-bold text-xs mt-2 border-border/60">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>

      {/* About Project Hub Dialog */}
      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="max-w-[90%] rounded-2xl p-6 bg-background border border-border/40">
          <VisuallyHidden>
            <DialogDescription>Description of CRR Project Hub platform</DialogDescription>
          </VisuallyHidden>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Info className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center font-extrabold text-base">About CRR Project Hub</DialogTitle>
            <DialogDescription className="text-center text-xs leading-relaxed mt-2 text-muted-foreground">
              Sir C.R. Reddy College of Engineering's official Project Hub is a platform where students showcase their works, academic projects, research ideas, and connect with peers to collaborate on cutting-edge innovations.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 border-t border-border/40 flex justify-center">
            <Button
              className="bg-primary text-white font-bold text-xs py-4 px-8 rounded-xl shadow-lg shadow-primary/10"
              onClick={() => setIsAboutOpen(false)}
            >
              Okay, Got It
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* College Logo Enlarged Dialog */}
      <Dialog open={isLogoModalOpen} onOpenChange={setIsLogoModalOpen}>
        <DialogContent className="max-w-[85%] rounded-2xl p-6 bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
          <VisuallyHidden>
            <DialogTitle>College Logo Preview</DialogTitle>
            <DialogDescription>Enlarged logo preview of Sir C.R. Reddy College of Engineering</DialogDescription>
          </VisuallyHidden>
          
          <img
            src="/crrprojecthublogo.png"
            alt="Large College Logo"
            className="w-40 h-40 rounded-full object-contain mb-4 border border-white/20 shadow-lg"
          />
          <h3 className="font-extrabold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PROJECT HUB
          </h3>
          <p className="text-sm font-bold text-foreground mt-2">
            Sir C.R. Reddy College of Engineering
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Autonomous Institution
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
