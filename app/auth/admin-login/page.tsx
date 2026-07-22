'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
            <CardTitle className="text-xl font-bold text-foreground">Admin Login</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Authorized personnel access
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="usernameOrEmail">Username or Email</Label>
            <Input
              id="usernameOrEmail"
              type="text"
              placeholder="admin@campus.edu"
              value={usernameOrEmail}
              onChange={(e) => {
                setUsernameOrEmail(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Admin Login'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
