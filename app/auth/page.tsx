'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';

type LoginStep = 'initial' | 'roleSelection' | 'studentForm' | 'staffForm' | 'adminForm' | 'setupForm';

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('initial');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Student Form State
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [selectedYear, setSelectedYear] = useState<'25' | '24' | '23' | '22' | null>(null);

  // Setup Form State
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmSetupPassword, setConfirmSetupPassword] = useState('');

  // Staff Form State
  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const years = [
    { prefix: '25', label: '1st Year', color: 'bg-blue-500' },
    { prefix: '24', label: '2nd Year', color: 'bg-purple-500' },
    { prefix: '23', label: '3rd Year', color: 'bg-pink-500' },
    { prefix: '22', label: 'Final Year', color: 'bg-orange-500' }
  ];

  const handleBackClick = () => {
    setError('');
    setStep(step === 'initial' ? 'initial' : 'roleSelection');
    resetForms();
  };

  const resetForms = () => {
    setStudentId('');
    setStudentPassword('');
    setStaffId('');
    setStaffPassword('');
    setAdminEmail('');
    setAdminPassword('');
    setSelectedYear(null);
  };

  const handleYearClick = (prefix: string) => {
    setSelectedYear(prefix as '25' | '24' | '23' | '22');
    setStudentId(prefix);
    setError('');
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (setupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (setupPassword !== confirmSetupPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { apiAuthSetup } = await import('@/lib/api');
      const { success } = await apiAuthSetup(studentId, setupPassword);
      if (success) {
        alert('Password set successfully! Please login.');
        setStep('studentForm');
        setStudentPassword('');
        setSetupPassword('');
        setConfirmSetupPassword('');
      } else {
        setError('Failed to set password. Try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error setting password');
    } finally {
      setIsLoading(false);
    }
  };

  const validateStudentForm = (): boolean => {
    if (!studentId || studentId.length !== 10) {
      setError('Student ID must be 10 characters long');
      return false;
    }

    const prefix = studentId.substring(0, 2);
    if (!['25', '24', '23', '22'].includes(prefix)) {
      setError('Invalid student ID format. Must start with 25, 24, 23, or 22');
      return false;
    }

    if (!studentPassword) {
      setError('Password is required');
      return false;
    }

    return true;
  };

  const validateStaffForm = (): boolean => {
    if (!staffId.trim()) {
      setError('Staff ID is required');
      return false;
    }

    if (!staffPassword) {
      setError('Password is required');
      return false;
    }

    if (staffPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const validateAdminForm = (): boolean => {
    if (!adminEmail.trim()) {
      setError('Admin email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      setError('Please enter a valid email');
      return false;
    }

    if (!adminPassword) {
      setError('Password is required');
      return false;
    }

    if (adminPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    return true;
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStudentForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const { apiAuthValidate } = await import('@/lib/api');

      // We manually fetch to handle 401 specifically if needed with custom message parsing
      const res = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim(), password: studentPassword })
      });
      const data = await res.json();

      if (res.ok && data.found && data.student) {
        const student = data.student;
        localStorage.setItem('userType', 'student');
        localStorage.setItem('studentId', studentId);
        localStorage.setItem('currentStudentId', studentId);
        localStorage.setItem('year', selectedYear || '');
        localStorage.setItem('studentName', student.name);
        localStorage.setItem('studentDepartment', student.department);
        localStorage.setItem('studentEmail', student.email);
        const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/profile';
        localStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      } else {
        // Handle specific "Account not set up" case
        if (res.status === 400 && data.error && data.error.includes('Password already set')) {
          setError(data.error);
        } else if (res.status === 401 && data.error && data.error.includes('Account not set up')) {
          setError('Account not set up. Please set a password.');
          // Optional: automatically switch to setup step?
          // setStep('setupForm'); 
          // Better to let user click the link in the error message, or auto switch.
          // Let's auto switch for convenience
          setStep('setupForm');
        } else {
          setError(data.error || 'Student ID not found or invalid password.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database error. Is MySQL running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStaffForm()) {
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem('userType', 'staff');
      localStorage.setItem('staffId', staffId);

      // Check if user tried to access upload page before login
      const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/projects';
      localStorage.removeItem('redirectAfterLogin');
      router.push(redirectUrl);
    }, 1000);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateAdminForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const { validateAdmin, seedAdminsIfMissing } = await import('@/lib/admins');
      // Ensure admin "database" exists
      seedAdminsIfMissing();

      const result = validateAdmin(adminEmail.trim(), adminPassword);
      if (result.valid && result.admin) {
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('adminEmail', result.admin.email);
        localStorage.setItem('adminId', result.admin.id || 'admin-' + Date.now());

        router.push('/admin/feedback');
      } else {
        if (result.reason === 'not_found') {
          setError('Admin account not found.');
        } else if (result.reason === 'invalid_password') {
          setError('Invalid password for admin account.');
        } else {
          setError('Invalid admin credentials.');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error validating admin');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial State - Only Login Button
  if (step === 'initial') {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center relative"
        style={{ backgroundImage: 'url(/campus-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <section className="relative z-10 px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-md mx-auto text-center space-y-8">
            <div className="space-y-4 fade-in">
              <h1 className="text-4xl font-bold text-white">Welcome</h1>
              <p className="text-lg text-white/80">
                Access your college account
              </p>
            </div>

            <Button
              onClick={() => {
                setStep('roleSelection');
                setError('');
              }}
              size="lg"
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-2xl transition-all duration-300"
            >
              Login
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // Role Selection State
  if (step === 'roleSelection') {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center relative"
        style={{ backgroundImage: 'url(/campus-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <section className="relative z-10 px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-md mx-auto">
            <Card className="p-8 space-y-6 bg-background/95 backdrop-blur border-white/20 slide-up">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackClick}
                  className="hover:bg-primary/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">Select Role</h2>
                  <p className="text-sm text-muted-foreground">Choose your account type</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => setStep('studentForm')}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg transition-all"
                >
                  Student Login
                </Button>

                <Button
                  onClick={() => setStep('adminForm')}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold border-2 border-red-500/50 text-red-600 hover:bg-red-500/10"
                >
                  Admin Login
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  // Student Login Form
  if (step === 'studentForm') {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center relative"
        style={{ backgroundImage: 'url(/campus-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <section className="relative z-10 px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-md mx-auto">
            <Card className="p-8 space-y-6 bg-background/95 backdrop-blur border-white/20 slide-up">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackClick}
                  className="hover:bg-primary/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">Student Login</h2>
                  <p className="text-sm text-muted-foreground">Enter your credentials</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleStudentLogin} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Select Your Year
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {years.map((year) => (
                      <button
                        key={year.prefix}
                        type="button"
                        onClick={() => handleYearClick(year.prefix)}
                        className={`p-3 rounded-lg text-center transition-all ${selectedYear === year.prefix
                          ? `${year.color} text-white shadow-lg`
                          : 'bg-muted hover:bg-muted/80'
                          }`}
                      >
                        <div className="font-semibold text-sm">{year.label}</div>
                        <div className="text-xs opacity-75">{year.prefix}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="studentId" className="text-sm font-medium mb-2 block">
                    Student ID
                  </label>
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="e.g., 24B81A50Q1"
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value.toUpperCase());
                      setError('');
                    }}
                    maxLength={10}
                    className="font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="studentPassword" className="text-sm font-medium mb-2 block">
                    Password
                  </label>
                  <Input
                    id="studentPassword"
                    type="password"
                    placeholder="Enter your password"
                    value={studentPassword}
                    onChange={(e) => {
                      setStudentPassword(e.target.value);
                      setError('');
                    }}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-lg"
                  disabled={isLoading || !studentId || !studentPassword}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>

              <div className="pt-4 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  First time? Your account will be created automatically on first login.
                </p>
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  // Admin Login Form
  if (step === 'adminForm') {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center relative"
        style={{ backgroundImage: 'url(/campus-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <section className="relative z-10 px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-md mx-auto">
            <Card className="p-8 space-y-6 bg-background/95 backdrop-blur border-white/20 slide-up">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackClick}
                  className="hover:bg-primary/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">Admin Login</h2>
                  <p className="text-sm text-muted-foreground">Secure admin access</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <label htmlFor="adminEmail" className="text-sm font-medium mb-2 block">
                    Admin Email
                  </label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@campus.edu"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      setError('');
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="adminPassword" className="text-sm font-medium mb-2 block">
                    Password
                  </label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Enter your secure password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setError('');
                    }}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg"
                  disabled={isLoading || !adminEmail || !adminPassword}
                >
                  {isLoading ? 'Logging in...' : 'Admin Login'}
                </Button>
              </form>

              <div className="pt-4 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  Admin access only. Unauthorized access is prohibited.
                </p>
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  // Staff Login Form
  if (step === 'staffForm') {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center relative"
        style={{ backgroundImage: 'url(/campus-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <section className="relative z-10 px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-md mx-auto">
            <Card className="p-8 space-y-6 bg-background/95 backdrop-blur border-white/20 slide-up">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackClick}
                  className="hover:bg-primary/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">Staff Login</h2>
                  <p className="text-sm text-muted-foreground">Enter your credentials</p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleStaffLogin} className="space-y-5">
                <div>
                  <label htmlFor="staffId" className="text-sm font-medium mb-2 block">
                    Staff ID
                  </label>
                  <Input
                    id="staffId"
                    type="text"
                    placeholder="Enter your staff ID"
                    value={staffId}
                    onChange={(e) => {
                      setStaffId(e.target.value);
                      setError('');
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="staffPassword" className="text-sm font-medium mb-2 block">
                    Password
                  </label>
                  <Input
                    id="staffPassword"
                    type="password"
                    placeholder="Enter your password"
                    value={staffPassword}
                    onChange={(e) => {
                      setStaffPassword(e.target.value);
                      setError('');
                    }}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-lg"
                  disabled={isLoading || !staffId || !staffPassword}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>

              <div className="pt-4 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  Your account is secure. We protect your information.
                </p>
              </div>
            </Card>
          </div>
        </section>
      </div>
    );
  }
}
