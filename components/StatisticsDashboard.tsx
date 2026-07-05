 'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Users, Upload, TrendingUp, Award } from 'lucide-react';
import type { Project } from '@/lib/data';

interface StatisticsDashboardProps {
  projects: Project[];
}

export function StatisticsDashboard({ projects }: StatisticsDashboardProps) {
  // Calculate statistics
  const uniqueStudents = new Set(projects.map((p) => p.studentId)).size;

  const projectsByYear = {
    '1st': projects.filter((p) => p.academicYear === '1st').length,
    '2nd': projects.filter((p) => p.academicYear === '2nd').length,
    '3rd': projects.filter((p) => p.academicYear === '3rd').length,
    final: projects.filter((p) => p.academicYear === 'final').length,
  };

  const studentsByYear = {
    '1st': new Set(
      projects.filter((p) => p.academicYear === '1st').map((p) => p.studentId)
    ).size,
    '2nd': new Set(
      projects.filter((p) => p.academicYear === '2nd').map((p) => p.studentId)
    ).size,
    '3rd': new Set(
      projects.filter((p) => p.academicYear === '3rd').map((p) => p.studentId)
    ).size,
    final: new Set(
      projects.filter((p) => p.academicYear === 'final').map((p) => p.studentId)
    ).size,
  };

  const chartData = React.useMemo(() => [
    { year: '1st', projects: projectsByYear['1st'], students: studentsByYear['1st'] },
    { year: '2nd', projects: projectsByYear['2nd'], students: studentsByYear['2nd'] },
    { year: '3rd', projects: projectsByYear['3rd'], students: studentsByYear['3rd'] },
    { year: 'Final', projects: projectsByYear.final, students: studentsByYear.final },
  ], [projectsByYear, studentsByYear]);

  const stats = [
    {
      icon: Users,
      label: 'Total Students',
      value: uniqueStudents,
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Upload,
      label: 'Total Projects',
      value: projects.length,
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: TrendingUp,
      label: 'Most Active Year',
      value: Object.entries(projectsByYear).reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0],
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Award,
      label: 'Avg Projects/Student',
      value: (projects.length / uniqueStudents || 0).toFixed(1),
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Community Statistics</h2>
        <p className="text-muted-foreground">Real-time insights about projects across all years</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`p-6 bg-gradient-to-br ${stat.color} text-white group hover-lift smooth-transition`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold group-hover:scale-110 smooth-transition">
                    {stat.value}
                  </p>
                </div>
                <Icon className="w-8 h-8 opacity-70 group-hover:scale-125 smooth-transition" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Projects & Students by Year</h3>
          <div className="w-full h-80">
            {/* Chart is dynamically loaded to keep initial bundle small (see usage in pages) */}
            <div id="recharts-root" />
          </div>
        </div>
      </Card>

      {/* Projects Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-4">Projects by Year</h3>
          <div className="space-y-3">
            {Object.entries(projectsByYear).map(([year, count]) => (
              <div key={year} className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {year === 'final' ? 'Final Year' : `${year} Year`}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      style={{
                        width: `${(count / Math.max(...Object.values(projectsByYear))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-primary min-w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-4">Students by Year</h3>
          <div className="space-y-3">
            {Object.entries(studentsByYear).map(([year, count]) => (
              <div key={year} className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {year === 'final' ? 'Final Year' : `${year} Year`}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-primary"
                      style={{
                        width: `${(count / Math.max(...Object.values(studentsByYear))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-accent min-w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
