'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronLeft,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedInput = usernameOrEmail.trim();
    if (!trimmedInput) {
      setError('Username or Email is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      const { validateAdmin, seedAdminsIfMissing } = await import('@/lib/admins');
      seedAdminsIfMissing();

      const result = validateAdmin(trimmedInput, password);
      if (result.valid && result.admin) {
        toast.success('Admin Login Successful');
        localStorage.setItem('userType', 'admin');
        localStorage.setItem('adminEmail', result.admin.email);
        const adminIdValue = result.admin.id || 'admin-' + Date.now();
        localStorage.setItem('adminId', adminIdValue);

        try {
          const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `adminAuth=true; path=/${secureFlag}; SameSite=Lax`;
          document.cookie = `adminEmail=${encodeURIComponent(result.admin.email)}; path=/${secureFlag}; SameSite=Lax`;
          document.cookie = `adminId=${encodeURIComponent(adminIdValue)}; path=/${secureFlag}; SameSite=Lax`;
        } catch (cookieErr) {
          console.warn('Failed to set admin cookies', cookieErr);
        }

        router.push('/admin/students');
      } else {
        if (result.reason === 'not_found') {
          setError('Admin account not found.');
        } else if (result.reason === 'invalid_password') {
          setError('Invalid password.');
        } else {
          setError('Invalid admin credentials.');
        }
      }
    } catch (err) {
      setError('An error occurred during admin login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto animate-in fade-in duration-300">
      <Card className="border border-border/50 shadow-xl bg-background/95 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="space-y-6 pt-7 px-8 pb-4">
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/auth')}
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors -ml-1"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                Secure Admin Access
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Authorized administrators only
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8 py-3">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username or Email Input */}
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="text-xs font-semibold text-foreground/80">
                Username or Email
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="admin@campus.edu"
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    setError('');
                  }}
                  className="pl-10 h-12 text-xs rounded-xl border-input bg-background focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground/80">
                  Password
                </Label>
                {isCapsLockOn && (
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Caps Lock ON
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyDown}
                  className="pl-10 pr-10 h-12 text-xs rounded-xl border-input bg-background focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-8 pt-4 pb-8">
            <Button
              type="submit"
              className="w-full h-12 font-semibold text-xs rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
