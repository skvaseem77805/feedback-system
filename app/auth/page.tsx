'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { GraduationCap, ArrowLeft, ArrowRight, User, UserCheck, Shield } from 'lucide-react';

export default function AuthLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center py-6 px-4 sm:px-6 relative z-10">
      {/* Top Header Branding */}
      <div className="text-center pt-4 sm:pt-8 space-y-2 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border-2 border-white/40 shadow-xl bg-white p-0.5 flex items-center justify-center">
          <Image
            src="/crrprojecthublogo.png"
            alt="CRR Project Hub Logo"
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>PROJECT</span>
            <span className="text-[#00D2A0]">HUB</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-200 tracking-wide">
            Sir C.R. Reddy College of Engineering
          </p>
        </div>
      </div>

      {/* Floating Card */}
      <div className="w-full max-w-md bg-white text-slate-900 rounded-[32px] p-6 sm:p-8 shadow-2xl relative my-auto border border-slate-100">
        {/* Floating Top Badge Icon */}
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto -mt-13 shadow-md mb-4 text-teal-600">
          <GraduationCap className="w-7 h-7 text-[#00D2A0]" strokeWidth={2} />
        </div>

        {/* Title & Description */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Welcome to <br />
            <span className="text-[#00D2A0]">Project Hub</span> Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
            Discover. Share. Collaborate. <br />
            Build the future together.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3.5">
          <button
            onClick={() => router.push('/auth/student-login')}
            className="w-full h-13 py-3.5 px-4 rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-between shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                <User className="w-4 h-4" />
              </div>
              <span>Student Login</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          <button
            onClick={() => router.push('/auth/student-register')}
            className="w-full h-13 py-3.5 px-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-between shadow-2xs transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-700 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <span>Student Register</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          <button
            onClick={() => router.push('/auth/admin-login')}
            className="w-full h-13 py-3.5 px-4 rounded-2xl bg-white border border-rose-100 hover:bg-rose-50/50 text-rose-600 font-semibold text-sm flex items-center justify-between shadow-2xs transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <span>Admin Login</span>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center pt-2">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        </div>
      </div>

      <div />
    </div>
  );
}
