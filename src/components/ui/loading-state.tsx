import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ className, size = "md" }: LoadingProps) {
  return (
    <Loader2
      className={cn(
        "shrink-0 animate-spin text-brand-teal",
        size === "sm" && "h-4 w-4",
        size === "md" && "h-8 w-8",
        size === "lg" && "h-12 w-12",
        className
      )}
    />
  );
}

export function LoadingState({
  className,
  size = "md",
  text = "Loading content...",
}: LoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3 p-8", className)}>
      <LoadingSpinner size={size} />
      {text && (
        <p className="animate-pulse text-sm font-medium text-slate-500 dark:text-zinc-400">
          {text}
        </p>
      )}
    </div>
  );
}

export function LoadingOverlay({ text = "Please wait..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-[2px] duration-200 animate-in fade-in dark:bg-black/35">
      <div className="shadow-premium flex flex-col items-center space-y-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-950">
        <LoadingSpinner size="md" />
        {text && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{text}</p>}
      </div>
    </div>
  );
}
