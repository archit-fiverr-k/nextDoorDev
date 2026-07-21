import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1
      className={cn(
        "text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2
      className={cn(
        "text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function P({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-sm leading-relaxed text-slate-500 dark:text-slate-400", className)}>
      {children}
    </p>
  );
}

export function Muted({ children, className }: TypographyProps) {
  return (
    <span className={cn("text-xs text-slate-400 dark:text-slate-500", className)}>{children}</span>
  );
}

export function Code({ children, className }: TypographyProps) {
  return (
    <code
      className={cn(
        "relative rounded bg-slate-100 px-[0.3rem] py-[0.2rem] font-mono text-xs font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        className
      )}
    >
      {children}
    </code>
  );
}
