'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Award, Building2, Mail, MapPin, Phone, Facebook, Twitter, Linkedin, ArrowRight, CheckCircle } from 'lucide-react';

export default function CollegePage() {
  const [studentCount, setStudentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);

  // Animate visitor counters
  useEffect(() => {
    const interval = setInterval(() => {
      setStudentCount(prev => (prev < 1250 ? prev + Math.floor(Math.random() * 10) : prev));
      setStaffCount(prev => (prev < 85 ? prev + Math.floor(Math.random() * 3) : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const departments = [
    { name: 'Computer Science & Engineering', code: 'CSE', students: 420 },
    { name: 'CSE (AI & ML)', code: 'CSE-AIML', students: 180 },
    { name: 'CSE (Data Science)', code: 'CSE-DS', students: 150 },
    { name: 'CSE (Cyber Security)', code: 'CSE-CS', students: 120 },
    { name: 'Information Technology', code: 'IT', students: 300 },
    { name: 'Electronics & Communication', code: 'ECE', students: 350 },
    { name: 'Electrical & Electronics', code: 'EEE', students: 280 },
    { name: 'Mechanical Engineering', code: 'ME', students: 280 },
    { name: 'Civil Engineering', code: 'CE', students: 240 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Sir C.R. Reddy</h1>
              <p className="text-xs text-muted-foreground">College of Engineering</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-2">
            <Button variant="ghost" size="sm">About</Button>
            <Button variant="ghost" size="sm">Departments</Button>
            <Button variant="ghost" size="sm">Contact</Button>
            <Link href="/sms-login">
              
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            <div className="inline-flex gap-2">
              <Badge className="bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/30 font-semibold">JNTUK Affiliated</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 font-semibold">AICTE Approved</Badge>
              <Badge className="bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30 font-semibold">NAAC 'A' Grade</Badge>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Sir C.R. Reddy College of Engineering</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Autonomous Institution Committed to Excellence in Engineering Education</p>
            <div className="flex gap-4 justify-center">
              <Link href="/sms-login">
                
              </Link>
              <Button size="lg" variant="outline">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Notifications */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-primary mb-8">Latest Notifications</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Spring Semester Admissions', date: 'Jan 20, 2025', icon: '📚' },
              { title: 'Campus Placement Drive', date: 'Jan 25, 2025', icon: '💼' },
              { title: 'Innovation Hackathon 2025', date: 'Feb 15, 2025', icon: '🚀' },
            ].map((notif, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-3">{notif.icon}</div>
                
                <p className="text-sm text-muted-foreground">{notif.date}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About & Vision/Mission */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">About College</h3>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Sir C.R. Reddy College of Engineering stands as a beacon of academic excellence and innovation. With a mission to nurture talent and foster scientific temper, we provide world-class engineering education that blends theoretical knowledge with practical expertise. Our commitment to excellence is reflected in our NAAC 'A' accreditation and AICTE approval.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
              <h4 className="text-xl font-bold text-primary mb-4">Vision</h4>
              <p className="text-muted-foreground">To be a leading institution developing technically competent and ethically responsible engineers capable of solving global challenges through innovation and research.</p>
            </Card>
            <Card className="p-8 bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
              <h4 className="text-xl font-bold text-secondary mb-4">Mission</h4>
              <p className="text-muted-foreground">Impart quality education in engineering, foster research and innovation, develop professionals with ethical values, and contribute to societal development through community engagement.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-primary mb-8">Courses & Departments</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {departments.map((dept, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{dept.name}</h4>
                    <Badge variant="outline" className="mt-2">{dept.code}</Badge>
                  </div>
                  <BookOpen className="w-6 h-6 text-primary opacity-20" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{dept.students}</strong> Students
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visitor Counters */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-primary mb-8 text-center">Visitor Statistics</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center bg-white">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Students Visited</p>
              <p className="text-4xl font-bold text-primary">{studentCount.toLocaleString()}+</p>
            </Card>
            <Card className="p-8 text-center bg-white">
              <Users className="w-12 h-12 text-secondary mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Staff Visited</p>
              <p className="text-4xl font-bold text-secondary">{staffCount.toLocaleString()}+</p>
            </Card>
            <Card className="p-8 text-center bg-white">
              <Award className="w-12 h-12 text-accent mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Years of Excellence</p>
              <p className="text-4xl font-bold text-accent">25+</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4">About</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><a href="#" className="hover:opacity-100">About College</a></li>
              <li><a href="#" className="hover:opacity-100">Departments</a></li>
              <li><a href="#" className="hover:opacity-100">Placements</a></li>
              <li><a href="#" className="hover:opacity-100">Achievements</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><a href="#" className="hover:opacity-100">Admissions</a></li>
              <li><a href="#" className="hover:opacity-100">Fee Structure</a></li>
              <li><a href="#" className="hover:opacity-100">Results</a></li>
              <li><a href="#" className="hover:opacity-100">Downloads</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <div className="space-y-2 text-sm opacity-90">
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Eluru, Andhra Pradesh 534004</span>
              </div>
              <div className="flex gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>+91-883-253-3666</span>
              </div>
              <div className="flex gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>info@srcrce.ac.in</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              <Facebook className="w-5 h-5 cursor-pointer hover:opacity-80" />
              <Twitter className="w-5 h-5 cursor-pointer hover:opacity-80" />
              <Linkedin className="w-5 h-5 cursor-pointer hover:opacity-80" />
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 pt-8 text-center text-sm opacity-75">
          <p>&copy; 2025 Sir C.R. Reddy College of Engineering (Autonomous). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
