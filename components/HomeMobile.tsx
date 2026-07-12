"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Heart, Eye } from "lucide-react";
import { apiProjects } from "@/lib/api";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Navbar } from "@/components/Navbar";

export function HomeMobile() {
  const router = useRouter();

  const [trendingProjects, setTrendingProjects] = useState<any[]>([]);
  const [latestProjects, setLatestProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll tracking for Hero Card fade/collapse
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Fetch feed items
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const [trending, newest] = await Promise.all([
          apiProjects({ limit: 6, sort: "trending" }),
          apiProjects({ limit: 6, sort: "newest" }),
        ]);
        setTrendingProjects(trending || []);
        setLatestProjects(newest || []);
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

  const fadeRange = 120;
  const opacity = Math.max(0, 1 - scrollY / fadeRange);
  const scale = Math.max(0.85, 1 - (scrollY / fadeRange) * 0.15);

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
            {/* 🏫 College Hero Card (smooth collapse/fade) */}
            <div 
              style={{
                opacity: opacity,
                transform: `scale(${scale})`,
                maxHeight: scrollY >= fadeRange ? "0px" : "320px",
                padding: scrollY >= fadeRange ? "0px" : "1.25rem",
                marginBottom: scrollY >= fadeRange ? "0px" : "1.5rem",
                transition: "opacity 160ms ease-out, transform 160ms ease-out, maxHeight 160ms ease-out, padding 160ms ease-out, marginBottom 160ms ease-out",
                overflow: "hidden"
              }}
              className="relative rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/5 shadow-xl backdrop-blur-md text-center p-5 space-y-4"
            >
              <div className="flex justify-center gap-1.5">
                <Badge className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full border-none">
                  JNTUK Affiliated
                </Badge>
                <Badge className="bg-accent/20 text-accent text-[9px] px-2 py-0.5 rounded-full border-none">
                  NAAC 'A' Grade
                </Badge>
                <Badge className="bg-secondary/20 text-secondary text-[9px] px-2 py-0.5 rounded-full border-none">
                  Autonomous
                </Badge>
              </div>
              <h2 className="text-xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Sir C.R. Reddy College of Engineering
              </h2>
              <p className="text-xs text-muted-foreground">
                Committed to Excellence in Engineering Education
              </p>
              <div className="flex gap-2.5 justify-center pt-2">
                <Button
                  onClick={handleStartUploading}
                  size="sm"
                  className="smooth-button bg-gradient-to-r from-primary to-accent text-white font-bold text-xs py-4 px-4 rounded-xl shadow-md"
                >
                  Start Uploading
                </Button>
                <Link href="/projects">
                  <Button
                    size="sm"
                    variant="outline"
                    className="smooth-button border border-white/10 bg-white/5 text-foreground font-bold text-xs py-4 px-4 rounded-xl"
                  >
                    Explore Projects
                  </Button>
                </Link>
              </div>
            </div>

            {/* 🔍 Sticky Search Bar */}
            <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-md py-2.5 -mx-4 px-4 border-b border-border/40 shadow-sm">
              <GlobalSearch 
                inputClassName="rounded-full bg-muted/40 border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* 🆕 Latest Projects horizontal scroll */}
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
                      <Link href={`/projects/${encodeURIComponent(p.id)}`} className="block">
                        <div className="relative w-full aspect-video bg-muted/40 flex items-center justify-center overflow-hidden">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Sparkles className="w-6 h-6 text-primary/30 animate-pulse" />
                          )}
                        </div>
                      </Link>

                      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
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

            {/* 📈 Trending Projects horizontal scroll */}
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
                      <Link href={`/projects/${encodeURIComponent(p.id)}`} className="block">
                        <div className="relative w-full aspect-video bg-muted/40 flex items-center justify-center overflow-hidden">
                          {p.thumbnailUrl ? (
                            <img
                              src={p.thumbnailUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Sparkles className="w-6 h-6 text-primary/30" />
                          )}
                          <Badge className="absolute top-2 left-2 bg-black/60 text-white font-bold text-[9px] px-2 py-0.5 rounded-full border-none">
                            #{index + 1}
                          </Badge>
                        </div>
                      </Link>

                      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
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
          </>
        )}
      </main>
    </div>
  );
}
