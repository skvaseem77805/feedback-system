'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { AIChat } from '@/components/AIChat';
import { Upload, Compass, Users, ArrowRight, Sparkles, Zap, ChevronRight, MessageSquare, Send, MessageCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const studentId = localStorage.getItem('studentId');
    const staffId = localStorage.getItem('staffId');
    const adminId = localStorage.getItem('adminId');
    const userType = localStorage.getItem('userType');
    
    // Check if any user type is logged in
    const isLoggedIn = !!(studentId || staffId || adminId || userType);
    setIsLoggedIn(isLoggedIn);
    setIsLoaded(true);
  }, []);

  const handleStartUploading = () => {
    const studentId = localStorage.getItem('studentId');
    const staffId = localStorage.getItem('staffId');
    const adminId = localStorage.getItem('adminId');
    const userType = localStorage.getItem('userType');
    
    // Check if any user type is logged in
    const isLoggedIn = !!(studentId || staffId || adminId || userType);
    
    if (isLoggedIn) {
      // User is logged in, go directly to upload page
      router.push('/upload');
    } else {
      // User is not logged in, go to login page
      router.push('/auth');
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 smooth-transition ${isLoaded ? 'fade-in' : 'opacity-0'}`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Welcome to CRR PROJECT HUB</span>
          </div>
          
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight smooth-transition ${isLoaded ? 'slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
            Your Work Matters.
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Your Campus Sees You.
            </span>
          </h1>
          
          <p className={`text-lg text-muted-foreground max-w-2xl mx-auto text-balance smooth-transition ${isLoaded ? 'slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            Showcase your academic projects to your campus community. Discover amazing work from your peers. Collaborate and grow together.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center pt-8 smooth-transition ${isLoaded ? 'slide-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <Link href="/college">
              <Button size="lg" className="gap-2 smooth-button bg-primary text-primary-foreground hover:bg-primary/90">
                Visit College Portal <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button size="lg" variant="outline" className="smooth-button bg-transparent">
                Explore Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Problem Solver Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-y backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI Problem Solver</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Get personalized guidance, upload your projects, and connect with peers. Your AI assistant adapts to your academic year level.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { year: '1st Year', desc: 'Foundation & Basics', color: 'from-blue-500 to-blue-600' },
              { year: '2nd Year', desc: 'Intermediate Projects', color: 'from-purple-500 to-purple-600' },
              { year: '3rd Year', desc: 'Advanced Work', color: 'from-green-500 to-green-600' },
              { year: 'Final Year', desc: 'Capstone Projects', color: 'from-orange-500 to-orange-600' }
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
      </section>

      {/* Featured Sections */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick AI Chat Card */}
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

            {/* Feedback Card */}
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
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Why Join CRR PROJECT HUB?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to showcase, discover, and collaborate on amazing projects</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { href: '/upload', icon: Upload, title: 'Easy Upload', desc: 'Share your projects with just a link and description. Support for images, videos, and live demos.' },
              { href: '/projects', icon: Compass, title: 'Discover & Explore', desc: 'Browse amazing projects from your peers. Filter by year, department, and category.' },
              { href: '/collaborate', icon: Users, title: 'Connect & Collaborate', desc: 'Find peers working on similar projects and form teams for future collaborations.' },
              { href: '/ai-generator', icon: Zap, title: 'AI Code Generator', desc: 'Describe your project idea and let AI generate code with live preview. Perfect for learning.' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link href={item.href} key={item.title}>
                  <Card className={`p-6 hover-lift smooth-transition cursor-pointer h-full group backdrop-blur-sm border-primary/20 ${item.href === '/ai-generator' ? 'bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30' : 'bg-card/50 hover:bg-card/70'}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 smooth-transition">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-bold mb-2 group-hover:text-primary smooth-transition">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 smooth-transition">
                      <span className="text-xs font-medium">Learn more</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

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
              Join hundreds of students who are already sharing their projects, connecting with peers, and growing their skills every day.
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
