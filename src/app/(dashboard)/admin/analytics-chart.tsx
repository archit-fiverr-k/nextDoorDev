"use client";

import React from "react";

interface AnalyticsChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10);
  const height = 180;
  const width = 500;
  const padding = 30;

  const points = data
    .map((d, index) => {
      const x = padding + (index * (width - padding * 2)) / (data.length - 1);
      const y = height - padding - (d.value * (height - padding * 2)) / maxValue;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="shadow-premium rounded-xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
        Monthly Booking Trends
      </h3>
      <div className="relative h-[180px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + ratio * (height - padding * 2);
            return (
              <line
                key={ratio}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="stroke-slate-100 dark:stroke-zinc-900"
                strokeWidth="1"
              />
            );
          })}

          {/* Line Path */}
          {data.length > 1 && (
            <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={points} />
          )}

          {/* Dots */}
          {data.map((d, index) => {
            const x = padding + (index * (width - padding * 2)) / (data.length - 1);
            const y = height - padding - (d.value * (height - padding * 2)) / maxValue;
            return (
              <g key={index} className="group">
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  className="hover:r-7 cursor-pointer fill-blue-600 stroke-white transition-all dark:stroke-zinc-950"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="fill-slate-500 font-mono text-[9px] font-bold transition-opacity group-hover:opacity-100"
                >
                  {d.value}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {data.map((d, index) => {
            const x = padding + (index * (width - padding * 2)) / (data.length - 1);
            return (
              <text
                key={index}
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-bold"
              >
                {d.name}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
