'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [registrationNo, setRegistrationNo] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('2nd Year');
  const [section, setSection] = useState('A');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const paramReg = searchParams.get('regNo');
    const localReg = localStorage.getItem('tempRegNo');
    const activeReg = paramReg || localReg;

    if (!activeReg) {
      toast.error('No registration session found. Please register.');
      router.push('/auth/student-register');
      return;
    }
    setRegistrationNo(activeReg);
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registrationNo) {
      setError('Registration Number is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNo,
          department,
          year,
          section
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Profile Created Successfully.');
        
        localStorage.setItem('userType', 'student');
        localStorage.setItem('studentId', registrationNo);
        localStorage.setItem('currentStudentId', registrationNo);
        
        const tempName = localStorage.getItem('tempName') || '';
        const tempEmail = localStorage.getItem('tempEmail') || '';
        localStorage.setItem('studentName', tempName);
        localStorage.setItem('studentEmail', tempEmail);
        localStorage.setItem('studentDepartment', department);
        localStorage.setItem('year', year);
        localStorage.setItem('studentSection', section);

        localStorage.removeItem('tempRegNo');
        localStorage.removeItem('tempEmail');
        localStorage.removeItem('tempName');
        localStorage.removeItem('tempPassword');

        router.push('/profile');
      } else {
        setError(data.error || 'Failed to complete profile. Try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-background/95 border border-border shadow-md rounded-lg">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-xl font-bold text-foreground">Complete Academic Profile</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Provide your core academic information to get started. Reg No: <span className="font-mono font-bold text-primary">{registrationNo}</span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="department">Department / Branch</Label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="CSE">Computer Science & Engineering (CSE)</option>
              <option value="AIML">Artificial Intelligence & Machine Learning (AIML)</option>
              <option value="AIDS">Artificial Intelligence & Data Science (AIDS)</option>
              <option value="CSY">Cyber Security (CSY)</option>
              <option value="IT">Information Technology (IT)</option>
              <option value="ECE">Electronics & Communication Engineering (ECE)</option>
              <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <select
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
            disabled={isLoading || !registrationNo}
          >
            {isLoading ? 'Creating Profile...' : 'Create Profile'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto text-center text-white font-semibold">
        Loading...
      </div>
    }>
      <CompleteProfileForm />
    </Suspense>
  );
}
