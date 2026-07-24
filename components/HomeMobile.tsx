"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Zap,
  Heart,
  Eye,
  Share2,
  FolderOpen,
  Users,
  GraduationCap,
  MessageSquare,
  BarChart,
  Award,
} from "lucide-react";
import { apiProjects, apiStudents } from "@/lib/api";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Navbar } from "@/components/Navbar";
import { ShareBottomSheet } from "@/components/ShareBottomSheet";

export function HomeMobile() {
  const router = useRouter();

  const [trendingProjects, setTrendingProjects] = useState<any[]>([]);
  const [latestProjects, setLatestProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    projects: 0,
    students: 0,
    departments: 0,
    feedbacks: 0,
  });
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);

        const [trending, newest, statsRes, studentsList] = await Promise.all([
          apiProjects({ limit: 6, sort: "trending" }),
          apiProjects({ limit: 6, sort: "newest" }),
          fetch('/api/home-stats').then((res) => res.json()).catch(() => ({})),
          apiStudents({ limit: 5 }).catch(() => []),
        ]);

        setTrendingProjects(trending || []);
        setLatestProjects(newest || []);

        let localFeedbacks = 0;
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('allFeedback');
          if (stored) {
            try {
              const list = JSON.parse(stored);
              localFeedbacks = Array.isArray(list) ? list.length : 0;
            } catch { }
          }
        }

        setStats({
          projects: statsRes.totalProjects || 0,
          students: statsRes.totalStudents || 0,
          departments: statsRes.totalDepartments || 0,
          feedbacks: localFeedbacks,
        });

        const sortedContributors = (studentsList || [])
          .filter((s: any) => (s.projectsUploaded ?? 0) > 0)
          .sort((a: any, b: any) => (b.projectsUploaded ?? 0) - (a.projectsUploaded ?? 0));

        setTopContributors(sortedContributors);
      } catch (err) {
        console.error("Error loading mobile feed data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  const handleStartUploading = () => {
    const studentId = localStorage.getItem("studentId");
    router.push(studentId ? "/upload" : "/auth");
  };

  return (
    <div className="min-h-screen bg-background pb-24 select-none antialiased">
      {/* Universal mobile navigation, drawer, and sheets managed globally */}
      <Navbar />

      <main className="px-4 py-4 space-y-6">
        {loading ? (
          // Lightweight Skeletons
          <div className="space-y-6 pt-4">
            <div className="h-44 w-full bg-muted/40 animate-pulse rounded-2xl" />
            <div className="h-10 w-full bg-muted/40 animate-pulse rounded-lg" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted/40 animate-pulse rounded" />
              <div className="flex gap-4 overflow-hidden">
                <div className="h-32 w-48 bg-muted/40 animate-pulse rounded-xl flex-shrink-0" />
                <div className="h-32 w-48 bg-muted/40 animate-pulse rounded-xl flex-shrink-0" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. 🏫 College Hero Section */}
            <div className="relative rounded-2xl bg-card/60 border border-border/40 text-center p-5 space-y-4">
              <div className="flex justify-center gap-1.5">
                <Badge className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full border-none shadow-none font-bold">
                  JNTUK Affiliated
                </Badge>
                <Badge className="bg-accent/20 text-accent text-[9px] px-2 py-0.5 rounded-full border-none shadow-none font-bold">
                  NAAC 'A' Grade
                </Badge>
                <Badge className="bg-secondary/20 text-secondary text-[9px] px-2 py-0.5 rounded-full border-none shadow-none font-bold">
                  Autonomous
                </Badge>
              </div>
              <h2 className="text-xl font-extrabold leading-tight text-foreground">
                Sir C.R. Reddy College of Engineering
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Committed to Excellence in Engineering Education
              </p>
              <div className="flex gap-2.5 justify-center pt-2">
                <Button
                  onClick={handleStartUploading}
                  size="sm"
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs py-4 px-4 rounded-xl shadow-none"
                >
                  Start Uploading
                </Button>
                <Link href="/projects">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border border-border/60 bg-background text-foreground font-bold text-xs py-4 px-4 rounded-xl"
                  >
                    Explore Projects
                  </Button>
                </Link>
              </div>
            </div>

            {/* 2. 🔍 Search Bar */}
            <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md py-2.5 -mx-4 px-4 border-b border-border/40 shadow-sm">
              <GlobalSearch
                inputClassName="rounded-full bg-muted/40 border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* 3. 🆕 Latest Projects */}
            {latestProjects.length > 0 && (
              <section className="space-y-3 pt-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-extrabold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-accent fill-accent/20" /> Latest Projects
                  </h3>
                  <Link
                    href="/projects"
                    className="text-[11px] text-primary font-bold active:opacity-70"
                  >
                    View All
                  </Link>
                </div>

                <div className="flex overflow-x-auto gap-4 pb-3 snap-x scrollbar-none -mx-4 px-4">
                  {latestProjects.map((p) => (
                    <Card
                      key={p.id}
                      className="min-w-[210px] w-[210px] snap-align-start overflow-hidden rounded-xl bg-card/45 border border-border/40 shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative w-full aspect-video bg-muted/40 flex items-center justify-center overflow-hidden">
                        <Link href={`/projects/${encodeURIComponent(p.id)}`} className="w-full h-full block">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-primary/30" />
                            </div>
                          )}
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShareClick(p.id, p.title);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 active:bg-black/75 text-white rounded-full backdrop-blur-xs transition-transform active:scale-90 z-10 border-none cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1 text-left">
                          <h4 className="font-bold text-foreground text-xs line-clamp-1 leading-snug">
                            {p.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground/80 line-clamp-1">
                            By {p.studentName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/20 pt-2 text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500/10" />
                            <span>{p.likes}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>{p.views ?? 0}</span>
                          </span>
                        </div>

                        <Link href={`/projects/${encodeURIComponent(p.id)}`} className="block w-full pt-1">
                          <Button size="sm" className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] h-7 rounded-lg shadow-none border-none">
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 4. 📈 Trending Projects */}
            {trendingProjects.length > 0 && (
              <section className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary fill-primary/15" /> Trending Projects
                  </h3>
                  <Link
                    href="/projects"
                    className="text-[11px] text-primary font-bold active:opacity-70"
                  >
                    View All
                  </Link>
                </div>

                <div className="flex overflow-x-auto gap-4 pb-3 snap-x scrollbar-none -mx-4 px-4">
                  {trendingProjects.map((p, index) => (
                    <Card
                      key={p.id}
                      className="min-w-[210px] w-[210px] snap-align-start overflow-hidden rounded-xl bg-card/45 border border-border/40 shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative w-full aspect-video bg-muted/40 flex items-center justify-center overflow-hidden">
                        <Link href={`/projects/${encodeURIComponent(p.id)}`} className="w-full h-full block">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-primary/30" />
                            </div>
                          )}
                        </Link>
                        <Badge className="absolute top-2 left-2 bg-black/60 text-white font-bold text-[9px] px-2 py-0.5 rounded-full border-none">
                          #{index + 1}
                        </Badge>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShareClick(p.id, p.title);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 active:bg-black/75 text-white rounded-full backdrop-blur-xs transition-transform active:scale-90 z-10 border-none cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1 text-left">
                          <h4 className="font-bold text-foreground text-xs line-clamp-1 leading-snug">
                            {p.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground/80 line-clamp-1">
                            By {p.studentName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/20 pt-2 text-[10px] text-muted-foreground font-medium">
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500/10" />
                            <span>{p.likes}</span>
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>{p.views ?? 0}</span>
                          </span>
                        </div>

                        <Link href={`/projects/${encodeURIComponent(p.id)}`} className="block w-full pt-1">
                          <Button size="sm" className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] h-7 rounded-lg shadow-none border-none">
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 5. 📊 CRR Project Hub Statistics (2x2 Grid) */}
            <section className="space-y-3 pt-2 text-left">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-extrabold flex items-center gap-1.5 px-1">
                <BarChart className="w-3.5 h-3.5 text-primary" /> CRR Project Hub Statistics
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 bg-card border border-border/45 rounded-xl space-y-1.5 flex flex-col justify-between shadow-none">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Projects</span>
                    <FolderOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-foreground leading-tight">{stats.projects}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">Projects shared by students</p>
                  </div>
                </Card>

                <Card className="p-3 bg-card border border-border/45 rounded-xl space-y-1.5 flex flex-col justify-between shadow-none">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Students</span>
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-foreground leading-tight">{stats.students}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">Active student members</p>
                  </div>
                </Card>

                <Card className="p-3 bg-card border border-border/45 rounded-xl space-y-1.5 flex flex-col justify-between shadow-none">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Departments</span>
                    <GraduationCap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-foreground leading-tight">{stats.departments}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">Engineering branches</p>
                  </div>
                </Card>

                <Card className="p-3 bg-card border border-border/45 rounded-xl space-y-1.5 flex flex-col justify-between shadow-none">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Feedbacks</span>
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-foreground leading-tight">{stats.feedbacks}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">Community suggestions</p>
                  </div>
                </Card>
              </div>
            </section>

            {/* 6. 🏆 Hall of Fame / Top Contributors (Single Column) */}
            <section className="space-y-3 pt-2 text-left">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-extrabold flex items-center gap-1.5 px-1">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Hall of Fame / Top Contributors
              </h3>

              {topContributors.length > 0 ? (
                <div className="space-y-2.5">
                  {topContributors.map((student: any, index: number) => {
                    const rankLabels = ['🥇 Rank 1', '🥈 Rank 2', '🥉 Rank 3', '✨ Rank 4', '✨ Rank 5'];
                    const rankBadge = rankLabels[index] || `Rank ${index + 1}`;

                    return (
                      <Card
                        key={student.id}
                        onClick={() => router.push(`/student/${encodeURIComponent(student.id)}`)}
                        className="p-3.5 bg-card border border-border/45 rounded-xl flex items-center justify-between gap-3 active:scale-[0.99] transition-transform cursor-pointer shadow-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-11 h-11 rounded-full bg-primary/10 border border-border/40 flex items-center justify-center overflow-hidden shrink-0">
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-extrabold text-primary">
                                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 text-left space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-foreground text-xs truncate">
                                {student.name}
                              </h4>
                              <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 rounded-full shrink-0 border-border/50">
                                {rankBadge}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium truncate">
                              {student.department || 'CSE'} Dept • {student.academicYear || `${student.year || 3}rd Year`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-primary block leading-tight">
                            {student.projectsUploaded ?? 0}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block">
                            Projects
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-6 text-center bg-card/45 border-border/40 rounded-2xl">
                  <p className="text-xs text-muted-foreground">No contributors registered yet.</p>
                </Card>
              )}
            </section>
          </>
        )}
      </main>

      <ShareBottomSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        title={shareTitle}
      />
    </div>
  );
}
