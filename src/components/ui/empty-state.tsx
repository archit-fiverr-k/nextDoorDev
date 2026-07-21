import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  isLoading,
}: EmptyStateProps) {
  return (
    <div className="mx-auto my-6 flex max-w-lg flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-zinc-900/60 dark:text-zinc-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-zinc-400">
        {description}
      </p>
      {actionText && onAction && (
        <div className="mt-6">
          <Button variant="outline" size="sm" onClick={onAction} isLoading={isLoading}>
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
