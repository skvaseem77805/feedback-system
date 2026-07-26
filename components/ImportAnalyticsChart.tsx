'use client';

import React, { useState } from 'react';

export interface ChartDataPoint {
  date: string;
  total: number;
  imported: number;
  manual: number;
}

interface ImportAnalyticsChartProps {
  data: ChartDataPoint[];
}

export function ImportAnalyticsChart({ data }: ImportAnalyticsChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-xl bg-muted/10">
        No registration data available for the selected filters.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.total, d.imported, 10)), 10);
  const chartHeight = 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const drawHeight = chartHeight - paddingTop - paddingBottom;

  return (
    <div className="w-full space-y-4">
      {/* Chart Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Daily Registration & Import Analytics</h3>
          <p className="text-xs text-muted-foreground">Daily trend of student registrations and file imports over time</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
            <span className="text-slate-700 dark:text-slate-200">Daily Registrations (Total)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-200">Daily Imported Students</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[600px] relative">
          <svg className="w-full h-[240px] overflow-visible">
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingTop + drawHeight * (1 - pct);
              const val = Math.round(maxVal * pct);
              return (
                <g key={idx}>
                  <line
                    x1="40"
                    y1={y}
                    x2="100%"
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <text
                    x="32"
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Bars for Each Day */}
            {data.map((item, idx) => {
              const totalWidth = 100 / data.length;
              const xPercent = (idx + 0.5) * totalWidth;
              const totalHeight = (item.total / maxVal) * drawHeight;
              const importedHeight = (item.imported / maxVal) * drawHeight;

              const yTotal = paddingTop + (drawHeight - totalHeight);
              const yImported = paddingTop + (drawHeight - importedHeight);

              return (
                <g
                  key={idx}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={() => setHoveredPoint(item)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Total Registrations Bar */}
                  <rect
                    x={`calc(${xPercent}% - 10px)`}
                    y={yTotal}
                    width="9px"
                    height={Math.max(totalHeight, 2)}
                    rx="3"
                    className="fill-blue-600 transition-all"
                  />

                  {/* Imported Bar */}
                  <rect
                    x={`calc(${xPercent}% + 2px)`}
                    y={yImported}
                    width="9px"
                    height={Math.max(importedHeight, 2)}
                    rx="3"
                    className="fill-emerald-500 transition-all"
                  />

                  {/* Date Label (show label for subset of points if crowded) */}
                  {(data.length <= 15 || idx % Math.ceil(data.length / 12) === 0) && (
                    <text
                      x={`${xPercent}%`}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      className="text-[10px] fill-slate-400 font-medium"
                    >
                      {item.date.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Box */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 z-20 border border-slate-700 pointer-events-none">
              <div className="font-bold text-slate-300 border-b border-slate-700 pb-1">
                Date: {hoveredPoint.date}
              </div>
              <div className="flex justify-between gap-4 text-blue-400">
                <span>Total Registrations:</span>
                <span className="font-mono font-bold">{hoveredPoint.total}</span>
              </div>
              <div className="flex justify-between gap-4 text-emerald-400">
                <span>Imported Students:</span>
                <span className="font-mono font-bold">{hoveredPoint.imported}</span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Manual Registrations:</span>
                <span className="font-mono font-bold">{hoveredPoint.manual}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
