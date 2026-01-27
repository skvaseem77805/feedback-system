'use client';

import React from "react"

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type AcademicYear } from '@/lib/data';
import { BookOpen, Lightbulb, Zap, Award } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: AcademicYear;
  onSelectYear: (year: AcademicYear) => void;
}

export function YearSelector({ selectedYear, onSelectYear }: YearSelectorProps) {
  const years: Array<{
    value: AcademicYear;
    label: string;
    icon: React.ReactNode;
    description: string;
    color: string;
  }> = [
    {
      value: '1st',
      label: '1st Year',
      icon: <BookOpen className="w-6 h-6" />,
      description: 'Foundation & Basics',
      color: 'from-blue-500 to-blue-600',
    },
    {
      value: '2nd',
      label: '2nd Year',
      icon: <Lightbulb className="w-6 h-6" />,
      description: 'Intermediate Projects',
      color: 'from-purple-500 to-purple-600',
    },
    {
      value: '3rd',
      label: '3rd Year',
      icon: <Zap className="w-6 h-6" />,
      description: 'Advanced Work',
      color: 'from-green-500 to-green-600',
    },
    {
      value: 'final',
      label: 'Final Year',
      icon: <Award className="w-6 h-6" />,
      description: 'Capstone Projects',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">Select Your Academic Year</h2>
          <p className="text-muted-foreground">
            Get personalized guidance and see projects relevant to your year
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {years.map((year) => (
            <Button
              key={year.value}
              onClick={() => onSelectYear(year.value)}
              variant={selectedYear === year.value ? 'default' : 'outline'}
              className={`h-auto py-4 px-4 space-y-2 flex flex-col items-center justify-center smooth-button ${
                selectedYear === year.value
                  ? `bg-gradient-to-br ${year.color} text-white border-0 hover:shadow-lg`
                  : 'hover:border-primary/50'
              }`}
            >
              <div
                className={`${
                  selectedYear === year.value ? 'text-white' : 'text-primary'
                }`}
              >
                {year.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{year.label}</p>
                <p className="text-xs opacity-75">{year.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
