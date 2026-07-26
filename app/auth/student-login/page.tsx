'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, User, Lock, Eye, EyeOff, UserPlus, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { validateRegistrationNo } from '@/lib/validation';

export default function StudentLoginPage() {
  const router = useRouter();
  const [registrationNo, setRegistrationNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validateRegistrationNo(registrationNo);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid Registration Number.');
      return;
    }
    const trimmedRegNo = validation.cleaned;

    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationNo: trimmedRegNo, password })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Login Successful');
        localStorage.setItem('userType', 'student');
        localStorage.setItem('studentId', trimmedRegNo);
        localStorage.setItem('currentStudentId', trimmedRegNo);
        localStorage.setItem('studentName', data.user.name);
        localStorage.setItem('studentEmail', data.user.email);
        localStorage.setItem('studentDepartment', data.profile.department);
        localStorage.setItem('year', String(data.profile.year));
        localStorage.setItem('studentSection', data.profile.section);

        // Redirect to dashboard
        router.push('/profile');
      } else {
        setError(data.error || 'Invalid Registration Number or Email Address.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center py-6 px-4 sm:px-6 relative z-10">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/auth')}
          className="w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-11 h-11 rounded-full border-2 border-white/40 shadow-xl bg-white p-0.5 flex items-center justify-center">
          <Image
            src="/crrprojecthublogo.png"
            alt="CRR Project Hub Logo"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        </div>

        <div className="w-10" />
      </div>

      <div className="text-center my-3 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome <span className="text-[#00D2A0]">back!</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-300">
          Login to continue your journey
        </p>
      </div>

      {/* Dark Card Form */}
      <div className="w-full max-w-md bg-[#181F32]/95 border border-slate-700/60 shadow-2xl rounded-[28px] p-6 sm:p-8 space-y-5 text-white backdrop-blur-md my-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-medium whitespace-pre-line">
              {error}
            </div>
          )}

          {/* Registration Number Field */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="registrationNo" className="text-xs font-semibold text-slate-300 block">
              Registration Number
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="registrationNo"
                type="text"
                placeholder="Enter your registration number"
                value={registrationNo}
                onChange={(e) => {
                  setRegistrationNo(e.target.value);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-4 py-3 bg-[#0F172A] border border-slate-700 focus:border-[#00D2A0] text-white placeholder-slate-500 rounded-xl text-sm font-mono uppercase focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="password" className="text-xs font-semibold text-slate-300 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-10 py-3 bg-[#0F172A] border border-slate-700 focus:border-[#00D2A0] text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() => router.push('/auth/forgot-password')}
                className="text-xs font-semibold text-[#00D2A0] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-[#00D2A0] hover:from-blue-700 hover:to-[#00B88C] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-700/80" />
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-slate-700/80" />
        </div>

        {/* New Here Card */}
        <div className="bg-[#0F172A]/80 border border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-[#00D2A0] flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-300">
            New here?{' '}
            <button
              type="button"
              onClick={() => router.push('/auth/student-register')}
              className="font-bold text-[#00D2A0] hover:underline cursor-pointer"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300 pb-2">
        <Shield className="w-3.5 h-3.5 text-[#00D2A0]" />
        <span>Your data is safe and secure with us.</span>
      </div>
    </div>
  );
}
