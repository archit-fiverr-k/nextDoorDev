"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TrustTickerProps {
  tickerLines: string[];
  tickerTitle: string;
}

export function TrustTicker({ tickerLines, tickerTitle }: TrustTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-advance every 3 seconds if there are multiple lines
  useEffect(() => {
    if (tickerLines.length <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [tickerLines, currentIndex]);

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + tickerLines.length) % tickerLines.length);
      setIsAnimating(false);
    }, 200);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % tickerLines.length);
      setIsAnimating(false);
    }, 200);
  };

  if (!tickerLines || tickerLines.length === 0) return null;

  return (
    <div className="select-none border-b border-border/80 bg-sky-50/50 px-6 py-2 dark:bg-zinc-900/40 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 font-sans text-xs">
        <div className="flex min-w-0 items-center space-x-3">
          {/* Ticker badge: brand teal background */}
          <span className="shrink-0 animate-pulse rounded bg-brand-teal px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
            {tickerTitle}
          </span>

          {/* Animated active message */}
          <span
            className={`truncate font-semibold leading-none text-brand-navy transition-all duration-200 dark:text-zinc-300 ${
              isAnimating ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            {tickerLines[currentIndex]}
          </span>
        </div>

        {/* Navigation indicators (only visible if more than 1 item) */}
        {tickerLines.length > 1 && (
          <div className="flex shrink-0 select-none items-center space-x-1.5">
            <button
              onClick={handlePrev}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-border bg-white transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              aria-label="Previous Trust Announcement"
            >
              <ChevronLeft className="text-brand-muted h-3 w-3" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border border-border bg-white transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              aria-label="Next Trust Announcement"
            >
              <ChevronRight className="text-brand-muted h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
