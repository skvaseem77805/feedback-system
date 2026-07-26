'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, User, Mail, Lock, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { validateRegistrationNo } from '@/lib/validation';

export default function StudentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form inputs
  const [registrationNo, setRegistrationNo] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // General errors
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validation helper for reg number check icon
  const regNoValidation = validateRegistrationNo(registrationNo);
  const isRegNoValid = regNoValidation.isValid;

  // Resend OTP countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validateRegistrationNo(registrationNo);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid Registration Number.');
      return;
    }
    const trimmedRegNo = validation.cleaned;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Student Name is required.');
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z ]*$/.test(trimmedName)) {
      setError('Student name can contain only letters and spaces.');
      return;
    }

    const formattedName = trimmedName.toUpperCase().replace(/ {2,}/g, ' ');

    if (formattedName.length > 20) {
      setError('Student name cannot exceed 20 characters.');
      return;
    }

    if (!trimmedEmail) {
      setError('Email is mandatory.');
      return;
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Invalid Email Address.');
      return;
    }

    if (!password) {
      setError('Password is mandatory.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNo: trimmedRegNo,
          name: trimmedName,
          email: trimmedEmail,
          password
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'OTP Sent Successfully.');
        setStep('otp');
        setResendTimer(30);
      } else {
        setError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      setOtpError('OTP must be a 6-digit number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNo: registrationNo.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim(),
          password,
          otp: trimmedOtp
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message || 'OTP Verified Successfully.');
        // Store in localStorage for temporary setup use or redirection
        localStorage.setItem('tempRegNo', registrationNo.trim().toUpperCase());
        localStorage.setItem('tempEmail', email.trim());
        localStorage.setItem('tempName', name.trim());
        localStorage.setItem('tempPassword', password);

        // Redirect to Complete Profile
        router.push(`/auth/complete-profile?regNo=${encodeURIComponent(registrationNo.trim().toUpperCase())}`);
      } else {
        setOtpError(data.error || 'Incorrect OTP.');
      }
    } catch (err) {
      setOtpError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNo: registrationNo.trim().toUpperCase(),
          name: name.trim(),
          email: email.trim(),
          password
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('OTP Sent Successfully.');
        setResendTimer(30);
      } else {
        setOtpError(data.error || 'Failed to resend OTP.');
      }
    } catch (err) {
      setOtpError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between items-center py-6 px-4 sm:px-6 relative z-10">
        {/* Top Header */}
        <div className="w-full max-w-md flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-10 h-10 rounded-full bg-slate-900/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-slate-800 transition-colors shadow-md cursor-pointer"
            disabled={isLoading}
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
            Email <span className="text-[#00D2A0]">Verification</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-200">
            Enter the 6-digit code sent to {email}
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white text-slate-900 border border-slate-200/80 shadow-2xl rounded-[28px] p-6 sm:p-8 space-y-5 my-auto">
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {otpError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-medium">
                {otpError}
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label htmlFor="otp" className="text-xs font-semibold text-slate-700 block">
                Verification Code (OTP)
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setOtpError('');
                }}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#00D2A0] text-slate-900 placeholder-slate-400 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none transition-colors"
              />
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-slate-500 font-medium">
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Did not receive code?'}
              </span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isLoading}
                className="text-xs text-[#00D2A0] hover:underline font-bold disabled:opacity-50 cursor-pointer"
              >
                Resend OTP
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-[#00D2A0] hover:from-blue-700 hover:to-[#00B88C] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="pb-2" />
      </div>
    );
  }

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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create your <span className="text-[#00D2A0]">account</span>
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-600">
          Join Project Hub and start exploring
        </p>
      </div>

      {/* Light Card Form */}
      <div className="w-full max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-[28px] p-6 sm:p-8 space-y-4 text-slate-900 my-auto">
        <form onSubmit={handleSendOtp} className="space-y-3.5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs font-medium whitespace-pre-line">
              {error}
            </div>
          )}

          {/* Registration Number Field */}
          <div className="space-y-1 text-left">
            <label htmlFor="registrationNo" className="text-xs font-semibold text-slate-700 block">
              Registration Number *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="registrationNo"
                type="text"
                placeholder="E.g. 24B81A05R2"
                value={registrationNo}
                onChange={(e) => {
                  setRegistrationNo(e.target.value);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 focus:border-[#00D2A0] text-slate-900 placeholder-slate-400 rounded-xl text-sm font-mono uppercase focus:outline-none transition-colors"
              />
              {isRegNoValid && (
                <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>

          {/* Student Name Field */}
          <div className="space-y-1 text-left">
            <label htmlFor="name" className="text-xs font-semibold text-slate-700 block">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => {
                  let val = e.target.value.toUpperCase();
                  val = val.replace(/[^A-Z ]/g, '');
                  val = val.replace(/^ /, '');
                  val = val.replace(/ {2,}/g, ' ');
                  if (val.length > 20) {
                    val = val.substring(0, 20);
                  }
                  setName(val);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 focus:border-[#00D2A0] text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Email Address Field */}
          <div className="space-y-1 text-left">
            <label htmlFor="email" className="text-xs font-semibold text-slate-700 block">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 focus:border-[#00D2A0] text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1 text-left">
            <label htmlFor="password" className="text-xs font-semibold text-slate-700 block">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 focus:border-[#00D2A0] text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1 text-left">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 block">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 focus:border-[#00D2A0] text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Secure Registration Note Box */}
          <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3 flex gap-2.5 text-xs text-blue-900 text-left my-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-blue-950">Secure Registration</div>
              <div className="text-blue-700/90 text-[11px] leading-tight">
                We'll send a One Time Password (OTP) to your email for verification.
              </div>
            </div>
          </div>

          {/* Send OTP Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-[#00D2A0] hover:from-blue-700 hover:to-[#00B88C] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>Send OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom Link */}
      <div className="text-xs text-center text-slate-200 pb-2">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/auth/student-login')}
          className="font-bold text-[#00D2A0] hover:underline cursor-pointer"
        >
          Login here
        </button>
      </div>
    </div>
  );
}
