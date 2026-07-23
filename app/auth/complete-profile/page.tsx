'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const DEPT_LABELS: Record<string, string> = {
  'CSE': 'Computer Science & Engineering (CSE)',
  'AIML': 'Artificial Intelligence & Machine Learning (AIML)',
  'AIDS': 'Artificial Intelligence & Data Science (AIDS)',
  'CSY': 'Cyber Security (CSY)',
  'IT': 'Information Technology (IT)',
  'ECE': 'Electronics & Communication Engineering (ECE)',
  'EEE': 'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering': 'Mechanical Engineering',
  'Civil Engineering': 'Civil Engineering',
};

function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [registrationNo, setRegistrationNo] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState('2nd Year');
  const [section, setSection] = useState('A');
  const [sectionError, setSectionError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    val = val.replace(/[^A-Z]/g, '').slice(0, 1);
    setSection(val);
    if (val && !/^[A-F]$/.test(val)) {
      setSectionError('Section must be A, B, C, D, E or F.');
    } else {
      setSectionError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registrationNo) {
      setError('Registration Number is required.');
      return;
    }

    if (!/^[A-F]$/.test(section)) {
      setError('Section must be a single uppercase character from A to F.');
      return;
    }

    // Show the confirmation dialog, do NOT make the API request yet!
    setShowConfirm(true);
  };

  const submitProfile = async () => {
    setIsLoading(true);
    setShowConfirm(false);
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
    <>
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
              <Input
                id="section"
                value={section}
                onChange={handleSectionChange}
                required
                maxLength={1}
                placeholder="e.g. A"
                className={`uppercase ${sectionError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              />
              {sectionError && (
                <p className="text-xs text-destructive mt-1 font-medium">{sectionError}</p>
              )}
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

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">Confirm Profile Creation</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Please verify your academic details before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 my-2 text-sm text-foreground">
            <div>
              <span className="text-muted-foreground block text-xs uppercase font-semibold">Registration Number</span>
              <span className="font-mono text-base font-bold text-primary">{registrationNo}</span>
            </div>
            
            <div>
              <span className="text-muted-foreground block text-xs uppercase font-semibold">Department</span>
              <span className="text-base font-medium">{DEPT_LABELS[department] || department}</span>
            </div>
            
            <div>
              <span className="text-muted-foreground block text-xs uppercase font-semibold">Year</span>
              <span className="text-base font-medium">{year}</span>
            </div>
            
            <div>
              <span className="text-muted-foreground block text-xs uppercase font-semibold">Section</span>
              <span className="text-base font-medium font-mono">{section}</span>
            </div>
            
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              Once confirmed, these details will be saved to your academic profile.
            </p>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={submitProfile} disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Confirm & Create Profile'}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
