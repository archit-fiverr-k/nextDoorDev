import React from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
  description?: string;
  trend?: string;
}

export function StatsCard({ label, value, icon: Icon, color, description, trend }: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
      {/* Decorative background accent line */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-[#10B981] to-[#059669] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-[#0b1c30] sm:text-3xl">
              {value}
            </span>
            {trend && (
              <span className="rounded-full bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#10B981]">
                {trend}
              </span>
            )}
          </div>
        </div>

        {/* Icon Circle */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-transform duration-300 group-hover:scale-105",
            color || "bg-[#10B981]/10 text-[#10B981]"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {description && (
        <p className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs font-semibold text-slate-500">
          <span>{description}</span>
        </p>
      )}
    </div>
  );
}
