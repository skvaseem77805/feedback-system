'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export default function AuthLandingPage() {
  const router = useRouter();

  return (
    <Card className="w-full max-w-md mx-auto bg-background/95 border border-border shadow-md rounded-lg">
      <CardHeader className="text-center space-y-2">
        <div className="flex justify-center mb-2">
          <div className="bg-primary/10 text-primary p-3 rounded-full">
            <GraduationCap className="w-10 h-10" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Project Hub Portal</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Select an account type to access the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={() => router.push('/auth/student-login')}
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/95 text-primary-foreground"
        >
          Student Login
        </Button>

        <Button
          onClick={() => router.push('/auth/student-register')}
          variant="outline"
          className="w-full h-12 text-base font-semibold border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        >
          Student Register
        </Button>

        <Button
          onClick={() => router.push('/auth/admin-login')}
          variant="ghost"
          className="w-full h-12 text-base font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          Admin Login
        </Button>

        <div className="pt-4 border-t border-border flex justify-center">
          <Button
            variant="link"
            onClick={() => router.push('/')}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 p-0 h-auto"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
