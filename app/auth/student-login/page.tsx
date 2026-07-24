'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { validateRegistrationNo } from '@/lib/validation';

export default function StudentLoginPage() {
  const router = useRouter();
  const [registrationNo, setRegistrationNo] = useState('');
  const [password, setPassword] = useState('');
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
            <CardTitle className="text-xl font-bold text-foreground">Student Login</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your registration details
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="link"
              type="button"
              onClick={() => router.push('/auth/forgot-password')}
              className="text-xs text-primary hover:underline p-0 h-auto font-medium"
            >
              Forgot Password?
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <div className="text-xs text-center text-muted-foreground">
            Don't have an account?{' '}
            <Button
              variant="link"
              type="button"
              onClick={() => router.push('/auth/student-register')}
              className="text-xs text-primary hover:underline p-0 h-auto font-semibold"
            >
              Register here
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
