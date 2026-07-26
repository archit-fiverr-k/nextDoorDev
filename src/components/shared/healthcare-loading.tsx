"use client";

import React, { useEffect, useState } from "react";
import { Stethoscope, Pill, HeartPulse, ShieldCheck } from "lucide-react";

export function HealthcareLoadingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const icons = [
    { Icon: Stethoscope, color: "text-[#10B981]" },
    { Icon: Pill, color: "text-emerald-400" },
    { Icon: HeartPulse, color: "text-teal-400" },
    { Icon: ShieldCheck, color: "text-emerald-300" },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex select-none items-center justify-center bg-slate-950/60 font-sans backdrop-blur-md">
      <div className="flex flex-col items-center space-y-3 rounded-full border border-white/15 bg-slate-900/85 px-6 py-4 shadow-2xl backdrop-blur-2xl">
        {/* Horizontal Row of 4 Flipping Professional Vector Icons */}
        <div className="flex items-center space-x-3">
          {icons.map((item, idx) => {
            const IconComponent = item.Icon;
            const isActive = activeIndex === idx;

            return (
              <div
                key={idx}
                className={`relative flex h-10 w-10 transform-gpu items-center justify-center rounded-xl border transition-all duration-500 ease-out ${
                  isActive
                    ? "scale-110 border-[#10B981] bg-[#10B981]/30 shadow-md shadow-[#10B981]/40"
                    : "scale-95 border-white/10 bg-white/5 opacity-40"
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: isActive ? "rotateY(180deg) scale(1.1)" : "rotateY(0deg) scale(0.95)",
                }}
              >
                <IconComponent
                  className={`h-5 w-5 ${item.color} transition-transform duration-300 ${
                    isActive ? "scale-105" : ""
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Minimal Progress Text */}
        <div className="flex items-center space-x-1.5 text-[11px] font-black uppercase tracking-wider text-slate-300">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#10B981]" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}
