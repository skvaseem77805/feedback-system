'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';
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

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // General errors
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      <Card className="w-full max-w-md mx-auto bg-background/95 border border-border shadow-md rounded-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep('form')}
              className="h-8 w-8 hover:bg-accent p-0"
              disabled={isLoading}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Email Verification</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Enter the code sent to {email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleVerifyOtp}>
          <CardContent className="space-y-4">
            {otpError && (
              <div className="bg-destructive/15 text-destructive p-3 rounded text-sm font-medium">
                {otpError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code (OTP)</Label>
              <Input
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
                className="font-mono text-center text-lg tracking-widest"
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Did not receive code?'}
              </span>
              <Button
                variant="link"
                type="button"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || isLoading}
                className="text-xs text-primary hover:underline p-0 h-auto font-semibold"
              >
                Resend OTP
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full h-11 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-background/95 border border-border shadow-md rounded-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/auth')}
            className="h-8 w-8 hover:bg-accent p-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <CardTitle className="text-xl font-bold text-foreground">Student Registration</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Create Your Student Account
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSendOtp}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded text-sm font-medium whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="registrationNo">Registration Number *</Label>
            <Input
              id="registrationNo"
              type="text"
              placeholder="Enter Registration Number"
              value={registrationNo}
              onChange={(e) => {
                setRegistrationNo(e.target.value);
                setError('');
              }}
              required
              className="font-mono uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Student Name *</Label>
            <Input
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password "
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter the password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Send OTP'}
          </Button>
          <div className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <Button
              variant="link"
              type="button"
              onClick={() => router.push('/auth/student-login')}
              className="text-xs text-primary hover:underline p-0 h-auto font-semibold"
            >
              Login here
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
