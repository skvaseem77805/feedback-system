'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { GraduationCap, Users, UserCheck, X, ArrowUpRight, Code2 } from 'lucide-react';

interface Developer {
  id: string;
  position: string;
  name: string;
  department: string;
  linkedin: string;
  github: string;
  cropStyle: React.CSSProperties;
}

const DEVELOPERS: Developer[] = [
  {
    id: 'dev-1',
    position: 'First person from LEFT',
    name: 'Hanish Raj Polimetla',
    department: 'Department of Computer Science & Engineering',
    linkedin: 'https://www.linkedin.com/in/hanish-raj-polimetla-08b297331',
    github: 'https://github.com/Hanish-jacks',
    cropStyle: { width: '380%', left: '0%', top: '-5%' },
  },
  {
    id: 'dev-2',
    position: 'Second person from LEFT',
    name: 'Sudhakar Matta',
    department: 'Department of Computer Science & Engineering',
    linkedin: 'https://www.linkedin.com/in/sudhakar-matta-244823337',
    github: 'https://github.com/sudhakarmatta007',
    cropStyle: { width: '380%', left: '-90%', top: '-8%' },
  },
  {
    id: 'dev-3',
    position: 'Third person from LEFT',
    name: 'Uma Rajesh Suda',
    department: 'Department of Computer Science & Engineering',
    linkedin: 'https://www.linkedin.com/in/uma-rajesh-suda-b4324424a',
    github: 'https://github.com/uma-rajesh45',
    cropStyle: { width: '380%', left: '-180%', top: '-10%' },
  },
  {
    id: 'dev-4',
    position: 'Fourth person from LEFT',
    name: 'Shaik Vaseem',
    department: 'Department of Computer Science & Engineering',
    linkedin: 'https://www.linkedin.com/in/shaik-vaseem-426aa22b8',
    github: 'https://github.com/skvaseem77805',
    cropStyle: { width: '380%', left: '-270%', top: '-10%' },
  },
];

const LinkedinIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
  </svg>
);

export default function DevelopersPage() {
  const [selectedDev, setSelectedDev] = useState<Developer | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDev(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-14 md:py-16 space-y-8 sm:space-y-16">
        {/* SECTION 1: PROJECT LEADERSHIP */}
        <section className="relative rounded-[24px] sm:rounded-[32px] bg-gradient-to-br from-white via-slate-50/70 to-blue-50/20 border border-slate-200/80 shadow-xl shadow-blue-500/5 p-4 sm:p-10 md:p-14 overflow-hidden">
          {/* Background Decorative Graphic Elements */}
          <div className="absolute top-6 left-8 grid grid-cols-6 gap-2 opacity-20 pointer-events-none">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={`dot-tl-${i}`} className="w-1.5 h-1.5 rounded-full bg-primary" />
            ))}
          </div>

          <div className="absolute top-6 right-8 grid grid-cols-6 gap-2 opacity-20 pointer-events-none">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={`dot-tr-${i}`} className="w-1.5 h-1.5 rounded-full bg-primary" />
            ))}
          </div>

          <svg
            className="absolute inset-0 w-full h-full text-primary/10 pointer-events-none"
            viewBox="0 0 800 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M -100 200 C 150 400, 450 50, 900 250"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto shadow-xs">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" strokeWidth={1.75} />
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight uppercase">
                PROJECT LEADERSHIP
              </h1>

              <p className="text-muted-foreground text-xs sm:text-base font-medium max-w-xl mx-auto leading-normal sm:leading-relaxed">
                The guidance, leadership and mentorship that helped shape CRR Project Hub into reality.
              </p>

              <div className="w-10 sm:w-12 h-1 bg-primary rounded-full mx-auto mt-2 sm:mt-4" />
            </div>

            {/* Leadership Cards */}
            <div className="mt-6 sm:mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
              {/* CARD 1: HOD */}
              <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-slate-200/90 shadow-md hover:shadow-lg transition-shadow p-4 sm:p-7 lg:p-8 flex flex-col justify-between space-y-3.5 sm:space-y-6">
                <div className="flex flex-row items-center gap-3.5 sm:gap-5">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 shadow-xs">
                    <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-primary" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-1 sm:space-y-2 flex-1">
                    <div className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                      HEAD OF DEPARTMENT
                    </div>

                    <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      Dr. A YESU BABU
                    </h2>

                    <div className="w-6 sm:w-8 h-0.5 bg-primary rounded-full hidden sm:block" />

                    <div className="space-y-0.5 pt-0.5 sm:pt-1">
                      <p className="text-[11px] sm:text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Professor & Head
                      </p>
                      <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1 sm:line-clamp-none">
                        Department of Computer Science & Engineering
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-4 pt-1 sm:pt-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/5 border border-primary/15 text-primary text-[11px] sm:text-xs font-semibold">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>M.Tech (CST), Ph.D (CS&SE)</span>
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 sm:pt-4">
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-snug sm:leading-relaxed">
                      Providing visionary leadership, academic excellence, and continuous encouragement throughout the successful development of this project.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 2: MENTOR */}
              <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-slate-200/90 shadow-md hover:shadow-lg transition-shadow p-4 sm:p-7 lg:p-8 flex flex-col justify-between space-y-3.5 sm:space-y-6">
                <div className="flex flex-row items-center gap-3.5 sm:gap-5">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-primary" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-1 sm:space-y-2 flex-1">
                    <div className="inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                      PROJECT MENTOR
                    </div>

                    <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                      Dr. B. Madhav Rao
                    </h2>

                    <div className="w-6 sm:w-8 h-0.5 bg-primary rounded-full hidden sm:block" />

                    <div className="space-y-0.5 pt-0.5 sm:pt-1">
                      <p className="text-[11px] sm:text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Professor, CSE
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-4 pt-1 sm:pt-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-primary/5 border border-primary/15 text-primary text-[11px] sm:text-xs font-semibold">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Ph.D, M.Tech</span>
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 sm:pt-4">
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-snug sm:leading-relaxed">
                      Providing valuable technical guidance, continuous mentorship, and unwavering support during every stage of the project.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: OUR DEVELOPERS */}
        <section className="relative rounded-[24px] sm:rounded-[32px] bg-gradient-to-br from-white via-slate-50/70 to-blue-50/20 border border-slate-200/80 shadow-xl shadow-blue-500/5 p-4 sm:p-10 md:p-14 overflow-hidden">
          <div className="relative z-10 space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto shadow-xs">
                <Code2 className="w-6 h-6 sm:w-7 sm:h-7 text-primary" strokeWidth={1.75} />
              </div>

              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight uppercase">
                OUR DEVELOPERS
              </h2>

              <p className="text-muted-foreground text-xs sm:text-base font-medium max-w-xl mx-auto leading-normal sm:leading-relaxed">
                Meet the passionate team behind CRR Project Hub.
              </p>

              <div className="w-10 sm:w-12 h-1 bg-primary rounded-full mx-auto mt-2 sm:mt-4" />
            </div>

            {/* Interactive Group Photo */}
            <div className="max-w-4xl mx-auto rounded-[20px] sm:rounded-[28px] overflow-hidden border border-slate-200 shadow-2xl relative bg-slate-100 group">
              <img
                src="/developers-team.jpg"
                alt="CRR Project Hub Developers Team"
                className="w-full h-auto block select-none pointer-events-none"
              />

              {/* 4 Clickable Overlay Regions (Mapped left to right 1..4) */}
              <div className="absolute inset-0 grid grid-cols-4">
                {DEVELOPERS.map((dev) => (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDev(dev)}
                    className="h-full w-full relative focus:outline-none group/dev cursor-pointer hover:bg-primary/10 transition-colors flex flex-col justify-end p-2 sm:p-4"
                    title={`Click to view ${dev.name}'s profile`}
                  >
                    {/* Hover Badge */}
                    <div className="opacity-0 group-hover/dev:opacity-100 transition-all duration-200 bg-slate-900/90 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold shadow-lg text-center flex items-center justify-center gap-1 transform translate-y-2 group-hover/dev:translate-y-0">
                      <span className="truncate max-w-[90px] sm:max-w-none">{dev.name}</span>
                      <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subtle Hint Text Below Image */}
            <p className="text-center text-xs sm:text-sm font-medium text-muted-foreground tracking-wide">
              Tap any team member to explore their profile.
            </p>
          </div>
        </section>
      </main>

      {/* POPUP MODAL */}
      {selectedDev && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedDev(null)}
        >
          <div
            className="bg-white rounded-[28px] sm:rounded-[32px] max-w-md w-full p-6 sm:p-8 relative shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedDev(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shadow-xs"
              aria-label="Close profile modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Content */}
            <div className="flex flex-col items-center text-center space-y-4 pt-2">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg relative bg-slate-100">
                <img
                  src="/developers-team.jpg"
                  alt={selectedDev.name}
                  className="absolute max-w-none pointer-events-none select-none"
                  style={selectedDev.cropStyle}
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {selectedDev.name}
                </h3>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4">
                {selectedDev.department}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full">
                <a
                  href={selectedDev.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#084e96] text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  <span>LinkedIn Profile</span>
                </a>

                <a
                  href={selectedDev.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>GitHub Profile</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
