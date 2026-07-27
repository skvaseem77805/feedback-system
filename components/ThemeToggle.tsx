'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 ${className || ''}`}
        aria-label="Toggle theme"
      >
        <Sun className="w-4 h-4 text-slate-500" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors ${className || ''}`}
          title="Switch theme"
          aria-label="Switch theme"
        >
          <Sun className="w-[1.1rem] h-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute w-[1.1rem] h-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center justify-between cursor-pointer text-xs font-medium py-2"
        >
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === 'light' && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center justify-between cursor-pointer text-xs font-medium py-2"
        >
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-blue-400" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center justify-between cursor-pointer text-xs font-medium py-2"
        >
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-slate-400" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="w-3.5 h-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
