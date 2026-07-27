"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { AIChat } from "@/components/AIChat";
import {
  Upload,
  Compass,
  Users,
  ArrowRight,
  Sparkles,
  Zap,
  ChevronRight,
  MessageSquare,
  Send,
  MessageCircle,
  BarChart,
  FolderOpen,
  GraduationCap,
  Heart,
  Eye,
  Globe,
  Smartphone,
  Brain,
  Cpu,
  Shield,
  Database,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiProjects, apiStudents } from "@/lib/api";
import { ShareBottomSheet } from "@/components/ShareBottomSheet";

export function HomeDesktop() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");

  const handleShareClick = (projectId: string, title: string) => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/project/${projectId}`);
      setShareTitle(title);
      setShareOpen(true);
    }
  };



  const [stats, setStats] = useState({
    projects: 0,
    students: 0,
    departments: 0,
    feedbacks: 0,
  });

  const [trendingProjects, setTrendingProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [loadingContributors, setLoadingContributors] = useState(true);

  const getCategoryColor = (category: string) => {
    const c = (category || '').toLowerCase();
    if (c.includes('web')) return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    if (c.includes('mobile')) return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    if (c.includes('ml') || c.includes('ai') || c.includes('learn')) return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    if (c.includes('iot')) return 'bg-pink-500/10 text-pink-400 border border-pink-500/20';
    if (c.includes('cyber') || c.includes('security')) return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (c.includes('data')) return 'bg-green-500/10 text-green-400 border border-green-500/20';
    return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  };

  useEffect(() => {
    // Check if user is logged in
    const studentId = localStorage.getItem("studentId");
    const staffId = localStorage.getItem("staffId");
    const adminId = localStorage.getItem("adminId");
    const userType = localStorage.getItem("userType");

    // Check if any user type is logged in
    const isLoggedIn = !!(studentId || staffId || adminId || userType);
    setIsLoggedIn(isLoggedIn);
    setIsLoaded(true);

    // Fetch dynamic home stats
    const loadStats = async () => {
      try {
        const res = await fetch('/api/home-stats');
        const dbData = await res.json();

        setStats({
          projects: dbData.totalProjects || 0,
          students: dbData.totalStudents || 0,
          departments: dbData.totalDepartments || 0,
          feedbacks: dbData.totalFeedbacks || 0,
        });
      } catch (err) {
        console.error('Stats load error', err);
      }
    };

    // Fetch trending projects
    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        const list = await apiProjects({ limit: 4, sort: 'trending' });
        setTrendingProjects(list);
      } catch (err) {
        console.error('Projects load error', err);
      } finally {
        setLoadingProjects(false);
      }
    };

    // Fetch top contributors
    const loadContributors = async () => {
      try {
        setLoadingContributors(true);
        const list = await apiStudents({ limit: 5 });
        const sorted = (list || [])
          .filter(s => (s.projectsUploaded ?? 0) > 0)
          .sort((a, b) => (b.projectsUploaded ?? 0) - (a.projectsUploaded ?? 0));
        setTopContributors(sorted);
      } catch (err) {
        console.error('Contributors load error', err);
      } finally {
        setLoadingContributors(false);
      }
    };

    loadStats();
    loadProjects();
    loadContributors();
  }, []);

  const handleStartUploading = () => {
    const studentId = localStorage.getItem("studentId");
    const staffId = localStorage.getItem("staffId");
    const adminId = localStorage.getItem("adminId");
    const userType = localStorage.getItem("userType");

    // Check if any user type is logged in
    const isLoggedIn = !!(studentId || staffId || adminId || userType);

    if (isLoggedIn) {
      // User is logged in, go directly to upload page
      router.push("/upload");
    } else {
      // User is not logged in, go to login page
      router.push("/auth");
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />

      {/* Centered search bar between Navbar and Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-2 relative z-50">
        <GlobalSearch className="max-w-[700px] mx-auto" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/30 rounded-full blur-[100px] animate-pulse"></div>
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-accent/30 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        </div>
        <section className="relative py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="relative rounded-2xl p-12 bg-gradient-to-br from-white/6 to-transparent border border-white/6 shadow-2xl backdrop-blur-md overflow-hidden">
              {/* Decorative accent */}
              <svg
                className="absolute -top-10 -right-10 w-72 h-72 opacity-40 blur-2xl transform rotate-12"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <defs>
                  <linearGradient id="g1" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="rgba(99,102,241,0.5)" />
                    <stop offset="100%" stopColor="rgba(236,72,153,0.4)" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#g1)"
                  d="M43.6,-69.9C57.1,-62.3,68.5,-52.1,74.7,-38.7C81,-25.3,82,-8.6,78.9,7.5C75.8,23.6,68.6,38.3,58.1,49C47.6,59.7,33.9,66.4,19.5,72.2C5.1,78,-9.2,82.8,-22.9,80.2C-36.6,77.6,-49.7,67.6,-58.7,54.9C-67.7,42.1,-72.7,26.6,-75.6,9.9C-78.5,-6.8,-79.3,-24.5,-70.2,-35.6C-61.2,-46.6,-42.2,-51,-24.4,-58.4C-6.6,-65.7,8.8,-76.6,23.6,-77.8C38.5,-79,52.8,-70.5,43.6,-69.9Z"
                  transform="translate(100 100)"
                />
              </svg>
              <div className="relative z-10 text-center space-y-6">
                <div className="flex flex-wrap justify-center gap-3">
                  <Badge className="bg-primary/20 text-primary px-3 py-1 rounded-full">
                    JNTUK Affiliated
                  </Badge>
                  <Badge className="bg-secondary/20 text-secondary px-3 py-1 rounded-full">
                    AICTE Approved
                  </Badge>
                  <Badge className="bg-accent/20 text-accent px-3 py-1 rounded-full">
                    NAAC 'A' Grade
                  </Badge>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent drop-shadow-sm">
                  Sir C.R. Reddy College of Engineering
                </h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Autonomous Institution Committed to Excellence in Engineering
                  Education
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <Button
                    onClick={handleStartUploading}
                    size="lg"
                    className="gap-2 smooth-button bg-gradient-to-r from-primary to-accent text-white hover:brightness-105 shadow-2xl transform transition-transform hover:-translate-y-1"
                  >
                    Start Uploading Now <Upload className="w-4 h-4 ml-1" />
                  </Button>
                  <Link href="https://sircrrcoestd.in/">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 smooth-button border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/8 hover:shadow-md"
                    >
                      Visit College Portal <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="smooth-button hover:bg-primary/10"
                    >
                      Explore Projects
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="max-w-5xl mx-auto text-center space-y-6 mt-10">
          <h1
            className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight smooth-transition ${isLoaded ? "slide-up" : "opacity-0"}`}
            style={{ animationDelay: "0.1s" }}
          >
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Your Work Matters.
            </span>
            <span className="block text-3xl sm:text-4xl font-semibold mt-2 bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent drop-shadow-sm">
              Your Campus Sees You.
            </span>
            <div className="mx-auto mt-4 w-40 h-1 rounded-full bg-gradient-to-r from-primary to-accent opacity-80" />
          </h1>

          <p
            className={`text-lg text-muted-foreground max-w-2xl mx-auto text-balance smooth-transition ${isLoaded ? "slide-up" : "opacity-0"}`}
            style={{ animationDelay: "0.2s" }}
          >
            Showcase your academic projects to your campus community. Discover
            amazing work from your peers. Collaborate and grow together.
          </p>
        </div>
      </section>

      {/* SECTION 1: PLATFORM STATISTICS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Live Platform Overview</h2>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CRR Project Hub Statistics</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: 'projects',
                title: 'Total Projects',
                count: stats.projects,
                subtitle: 'Innovative ideas and tools shared',
                icon: FolderOpen,
              },
              {
                id: 'students',
                title: 'Total Students',
                count: stats.students,
                subtitle: 'Active students collaborating',
                icon: Users,
              },
              {
                id: 'departments',
                title: 'Total Departments',
                count: stats.departments,
                subtitle: 'Engineering disciplines active',
                icon: GraduationCap,
              },
              {
                id: 'feedbacks',
                title: 'Total Feedbacks',
                count: stats.feedbacks,
                subtitle: 'Community building insights',
                icon: MessageSquare,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  className="relative group p-6 rounded-2xl bg-card/45 backdrop-blur-md border border-white/6 hover:border-primary/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col justify-between min-h-[170px]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors duration-300">
                      {card.count}
                    </h3>
                    <p className="text-sm font-semibold text-muted-foreground mt-1">{card.title}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{card.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: TRENDING PROJECTS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-primary/5 to-transparent relative">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-accent">Peer Achievements</h2>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mt-1">Trending Projects</p>
            </div>
            <Link href="/projects">
              <Button variant="outline" className="smooth-button border-primary/30 hover:bg-primary/10 text-primary gap-2">
                Explore All Projects <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loadingProjects ? (
            <div className="text-center py-10 text-muted-foreground">Loading trending projects...</div>
          ) : trendingProjects.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20">
              <p className="text-muted-foreground">No projects uploaded yet.</p>
            </Card>
          ) : (
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x scrollbar-none">
              {trendingProjects.map((p, index) => {
                return (
                  <div
                    key={p.id}
                    className="min-w-[280px] md:min-w-0 snap-align-start flex-1 flex flex-col justify-between p-5 bg-card/40 backdrop-blur-md border border-white/6 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-2xl group"
                  >
                    <div className="space-y-4">
                      {/* Project Thumbnail */}
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border border-primary/10 flex items-center justify-center relative">
                        {p.thumbnailUrl ? (
                          <img
                            src={p.thumbnailUrl}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-1 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-widest font-bold">CRR PROJECT</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
                          🔥 Trending #{index + 1}
                        </span>
                        <p className="text-xs text-muted-foreground font-medium">By {p.studentName}</p>
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm line-clamp-1 leading-snug group-hover:text-primary transition-colors">
                          {p.title}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                      {/* Stats & Date */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground/80 font-medium">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" /> {p.likes}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3.5 h-3.5 text-blue-500" /> {p.views ?? 0}
                          </span>
                        </div>
                        <span>
                          {new Date(p.uploadedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="flex gap-2 items-center">
                        <Link href={`/projects/${encodeURIComponent(p.id)}`} className="flex-1">
                          <Button size="sm" variant="ghost" className="w-full text-xs font-semibold justify-center hover:bg-primary/10 hover:text-primary gap-1 pt-1 mt-1 border border-white/5 group-hover:border-primary/20">
                            View Project <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShareClick(p.id, p.title)}
                          className="text-xs font-semibold justify-center hover:bg-primary/10 hover:text-primary p-2 mt-1 border border-white/5 group-hover:border-primary/20 h-8.5 rounded-lg animate-none shrink-0"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>



      {/* SECTION 4: TOP CONTRIBUTORS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-accent/5 to-transparent relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-accent">Hall of Fame</h2>
            <p className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Top Contributors</p>
          </div>

          {loadingContributors ? (
            <div className="text-center py-10 text-muted-foreground">Loading top contributors...</div>
          ) : topContributors.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 backdrop-blur-sm border-primary/20">
              <p className="text-muted-foreground">No contributors registered yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {topContributors.map((student, index) => {
                const ranks = [
                  { badge: '🥇 Gold', color: 'from-amber-400 to-amber-600 bg-amber-500/10 text-amber-300 border-amber-500/30' },
                  { badge: '🥈 Silver', color: 'from-slate-300 to-slate-500 bg-slate-500/10 text-slate-300 border-slate-500/30' },
                  { badge: '🥉 Bronze', color: 'from-orange-400 to-orange-700 bg-orange-600/10 text-orange-400 border-orange-600/30' },
                  { badge: '✨ Rank 4', color: 'from-blue-400 to-blue-600 bg-blue-500/10 text-blue-300 border-blue-500/30' },
                  { badge: '✨ Rank 5', color: 'from-indigo-400 to-indigo-600 bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
                ];
                const rankInfo = ranks[index] || { badge: `Rank ${index + 1}`, color: 'bg-card border-white/10' };

                return (
                  <Card
                    key={student.id}
                    className="relative group p-6 bg-card/40 backdrop-blur-md border border-white/6 hover:border-primary/50 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl flex flex-col items-center text-center rounded-2xl"
                  >
                    <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r ${rankInfo.color} font-bold px-3 py-0.5 rounded-full text-[10px] shadow-md border`}>
                      {rankInfo.badge}
                    </Badge>

                    <div className="w-16 h-16 rounded-full mt-4 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 border border-primary/20 flex items-center justify-center overflow-hidden mb-4 group-hover:scale-105 transition-transform duration-300 relative shadow-inner">
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                          {student.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-foreground text-sm tracking-wide line-clamp-1 group-hover:text-primary transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1 uppercase tracking-wider">{student.department} department</p>

                    <div className="mt-4 pt-3 border-t border-white/5 w-full">
                      <p className="text-xl font-black text-primary">{student.projectsUploaded}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-bold mt-0.5">Projects Uploaded</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>



      {/* Developers CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto rounded-[32px] bg-gradient-to-br from-white via-slate-50/70 to-blue-50/30 border border-slate-200/80 shadow-xl shadow-blue-500/5 p-8 sm:p-12 lg:p-14 relative overflow-hidden">
          {/* Subtle Background Decorative SVG Lines */}
          <svg
            className="absolute inset-0 w-full h-full text-primary/15 pointer-events-none"
            viewBox="0 0 600 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M -100 280 C 150 420, 350 80, 700 200"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <path
              d="M 50 80 C 250 250, 450 -50, 650 250"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* LEFT SIDE */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>OUR DEVELOPERS</span>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-foreground tracking-tight leading-[1.25]">
                  Behind every feature,<br />
                  there is a <span className="text-primary">passionate team.</span>
                </h2>
                <div className="w-12 h-1 bg-primary rounded-full" />
              </div>

              <p className="text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed font-medium">
                The minds that designed, built and continue to improve Project Hub for students like you.
              </p>

              <div className="pt-2">
                <Button
                  onClick={() => router.push("/developers")}
                  size="lg"
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 pl-7 pr-2.5 py-6 text-base font-semibold shadow-lg shadow-primary/20 gap-3 group transition-all"
                >
                  <span>Meet our Developers</span>
                  <span className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center transition-transform group-hover:translate-x-0.5 shadow-sm">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </span>
                </Button>
              </div>
            </div>

            {/* RIGHT SIDE - ABSTRACT UI ILLUSTRATION */}
            <div className="lg:col-span-5 flex items-center justify-center relative min-h-[280px]">
              {/* Dotted Grid Pattern - Top Left */}
              <div className="absolute top-2 left-6 grid grid-cols-6 gap-2 opacity-25 pointer-events-none">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={`dot-1-${i}`} className="w-1.5 h-1.5 rounded-full bg-primary" />
                ))}
              </div>

              {/* Dotted Grid Pattern - Bottom Right */}
              <div className="absolute bottom-2 right-6 grid grid-cols-6 gap-2 opacity-25 pointer-events-none">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={`dot-2-${i}`} className="w-1.5 h-1.5 rounded-full bg-primary" />
                ))}
              </div>

              {/* Concentric Circle Illustration */}
              <div className="relative w-72 h-72 rounded-full border border-primary/20 border-dashed flex items-center justify-center">
                {/* Decorative dot on circle border */}
                <div className="absolute -top-1.5 right-16 w-3 h-3 rounded-full bg-primary/70 shadow-sm" />
                <div className="absolute bottom-6 -left-1 w-2 h-2 rounded-full bg-primary/40" />

                {/* Inner Glowing Gradient Circle */}
                <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-primary/10 via-primary/15 to-indigo-100/50 flex items-center justify-center shadow-inner border border-primary/10">
                  <Users className="w-20 h-20 text-primary/80 stroke-[1.5]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ShareBottomSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        title={shareTitle}
      />
    </div>
  );
}
