"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
          {/* <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 smooth-transition ${isLoaded ? 'fade-in' : 'opacity-0'}`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Welcome to CRR PROJECT HUB</span>
          </div> */}

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

          {/* <div className={`flex flex-col sm:flex-row gap-4 justify-center pt-8 smooth-transition ${isLoaded ? 'slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={handleStartUploading}
              size="lg"
              className="gap-2 smooth-button bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl scale-105"
            >
              Start Uploading Now <Upload className="w-4 h-4" />
            </Button>
            <Link href="https://sircrrcoestd.in/">
              <Button size="lg" variant="outline" className="gap-2 smooth-button bg-background/50 backdrop-blur-sm hover:bg-background/80">
                Visit College Portal <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="ghost" className="smooth-button hover:bg-primary/10">
                Explore Projects
              </Button>
            </Link>
          </div> */}
        </div>
      </section>

      {/* AI Problem Solver Section */}
      {/* <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-y backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI Problem Solver</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Get personalized guidance, upload your projects, and connect with peers. Your AI assistant adapts to your academic year level.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { year: '1st Year', desc: 'Foundation & Basics', color: 'from-violet-500 to-purple-600' },
              { year: '2nd Year', desc: 'Intermediate Projects', color: 'from-fuchsia-500 to-pink-600' },
              { year: '3rd Year', desc: 'Advanced Work', color: 'from-blue-500 to-cyan-600' },
              { year: 'Final Year', desc: 'Capstone Projects', color: 'from-indigo-500 to-violet-600' }
            ].map((item, idx) => (
              <div
                key={item.year}
                className={`p-4 rounded-xl bg-gradient-to-br ${item.color} text-white text-center cursor-pointer hover-lift smooth-transition group`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="font-semibold group-hover:scale-110 transition-transform text-base">{item.year}</div>
                <div className="text-xs opacity-90">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/problem-solver">
              <Button size="lg" className="gap-2 smooth-button bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg">
                Open AI Problem Solver
                <MessageSquare className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline" className="gap-2 smooth-button bg-transparent">
                Explore Projects
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/* Featured Sections */}
      {/* <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/40 hover-lift smooth-transition group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 smooth-transition">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Instant AI Chat</h3>
                  <p className="text-muted-foreground text-sm">
                    Get immediate help with your projects, coding questions, and debugging. Available 24/7 for all academic years.
                  </p>
                </div>
                <Link href="/problem-solver" className="inline-block">
                  <Button className="gap-2 smooth-button bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Chatting <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-accent/20 to-primary/20 border-accent/40 hover-lift smooth-transition group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center group-hover:scale-110 smooth-transition">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Send Feedback</h3>
                  <p className="text-muted-foreground text-sm">
                    Help us improve the platform by sharing your suggestions, bug reports, or feature requests. Your voice matters!
                  </p>
                </div>
                <Link href="/feedback" className="inline-block">
                  <Button className="gap-2 smooth-button bg-accent text-white hover:bg-accent/90">
                    Share Feedback <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Why Join CRR PROJECT HUB?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to showcase, discover, and collaborate on
              amazing projects
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                href: "/",
                icon: Upload,
                title: "Easy Upload",
                desc: "Share your projects with just a link and description. Support for images, videos, and live demos.",
              },
              {
                href: "/",
                icon: Compass,
                title: "Discover & Explore",
                desc: "Browse amazing projects from your peers. Filter by year, department, and category.",
              },
              {
                href: "/",
                icon: MessageSquare,
                title: "Faculty Review & Feedback",
                desc: "Get structured feedback from faculty and mentors. Comments, ratings, and suggestions stored alongside each project.",
              },
              {
                href: "/",
                icon: BarChart,
                title: "Progress & Submission Tracking",
                desc: "Track project status from proposal to final submission. Deadlines, version history, and approval stages in one place.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.title}>
                  <Card
                    className={`p-6 smooth-transition cursor-default h-full group backdrop-blur-sm border-primary/20 rounded-xl transform transition duration-300 hover:scale-105 hover:shadow-2xl ${item.href === "/ai-generator" ? "bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30" : "bg-card/50 hover:bg-card/70"}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 smooth-transition">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold mb-2 group-hover:text-primary smooth-transition">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 smooth-transition">
                      <span className="text-xs font-medium">Learn more</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <hr className="my-12 border-t border-white/6" />
      </div>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Ready to Showcase Your Work?</h2>
            <p className="text-lg opacity-95 max-w-2xl mx-auto">
              Join hundreds of students who are already sharing their projects,
              connecting with peers, and growing their skills every day.
            </p>
          </div>

          <Button
            onClick={handleStartUploading}
            size="lg"
            className="smooth-button bg-primary-foreground text-primary hover:bg-white gap-2"
          >
            Start Uploading Now
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
