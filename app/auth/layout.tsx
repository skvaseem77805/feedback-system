'use client';

import React from 'react';
import { Toaster } from '@/components/ui/sonner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center relative font-sans antialiased text-foreground bg-background"
      style={{ backgroundImage: 'url(/campus-bg.jpg)' }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <section className="relative z-10 px-4 sm:px-6 lg:px-8 w-full">
        {children}
      </section>
      <Toaster />
    </div>
  );
}
