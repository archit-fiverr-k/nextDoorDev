"use client";

import { Menu, Bell, Search, Globe } from "lucide-react";

interface TopNavProps {
  title: string;
  onMenuClick?: () => void;
  publicUrl?: string;
}

export function TopNav({ title, onMenuClick, publicUrl }: TopNavProps) {
  return (
    <header className="z-45 sticky top-0 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      {/* Title & Navigation Trigger */}
      <div className="flex items-center space-x-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center space-x-3">
        {/* Search Input Icon */}
        <button className="hover:text-slate-650 rounded-lg p-2 text-slate-400 transition-colors dark:text-zinc-500 dark:hover:text-slate-100">
          <Search className="h-4 w-4" />
        </button>

        {/* Public Booking Link (if provided) */}
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-650 inline-flex items-center space-x-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold transition-all hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View Public Site</span>
          </a>
        )}

        {/* Notifications Icon */}
        <button className="hover:text-slate-650 relative rounded-lg p-2 text-slate-400 transition-colors dark:text-zinc-500 dark:hover:text-slate-100">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 animate-ping rounded-full bg-brand-teal" />
        </button>
      </div>
    </header>
  );
}
