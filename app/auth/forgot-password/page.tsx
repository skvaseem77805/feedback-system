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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'verify'>('request');

  // Input states
  const [registrationNo, setRegistrationNo] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationNo: trimmedRegNo, email: trimmedEmail })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('OTP Sent Successfully.');
        setStep('verify');
        setResendTimer(30);
      } else {
        setError(data.error || 'Invalid Registration Number or Email Address.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (newPassword !== confirmPassword) {
      setOtpError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setOtpError('Password must be at least 6 characters.');
      return;
    }

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      setOtpError('OTP must be a 6-digit number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNo: registrationNo.trim().toUpperCase(),
          email: email.trim(),
          otp: trimmedOtp,
          newPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Password Updated Successfully.');
        router.push('/auth/student-login');
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
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNo: registrationNo.trim().toUpperCase(),
          email: email.trim()
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

  if (step === 'verify') {
    return (
      <Card className="w-full max-w-md mx-auto bg-background/95 border border-border shadow-md rounded-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep('request')}
              className="h-8 w-8 hover:bg-accent p-0"
              disabled={isLoading}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">Reset Password</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Enter the OTP and your new password
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleVerifyAndReset}>
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

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setOtpError('');
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setOtpError('');
                }}
                required
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
              {isLoading ? 'Resetting...' : 'Update Password'}
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
            onClick={() => router.push('/auth/student-login')}
            className="h-8 w-8 hover:bg-accent p-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <CardTitle className="text-xl font-bold text-foreground">Forgot Password</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Provide details to verify your identity
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
            <Label htmlFor="registrationNo">Registration Number</Label>
            <Input
              id="registrationNo"
              type="text"
              placeholder="Enter your Registration Number"
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
            <Label htmlFor="email">Registered Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Send Verification OTP via Email'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
