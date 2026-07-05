"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  data: any[];
}

export default function RechartsWrapper({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="year" stroke="var(--color-muted-foreground)" />
          <YAxis stroke="var(--color-muted-foreground)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
            }}
            labelStyle={{ color: 'var(--color-foreground)' }}
          />
          <Legend />
          <Bar dataKey="projects" fill="var(--color-primary)" radius={[8, 8, 0, 0]} name="Projects Uploaded" />
          <Bar dataKey="students" fill="var(--color-accent)" radius={[8, 8, 0, 0]} name="Students Contributed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
