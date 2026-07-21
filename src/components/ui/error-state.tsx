import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryText?: string;
  isLoading?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryText = "Try again",
  isLoading,
}: ErrorStateProps) {
  return (
    <div className="mx-auto my-6 flex max-w-lg flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/30 p-8 text-center shadow-sm dark:border-rose-950/20 dark:bg-rose-950/5">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-rose-950 dark:text-rose-400">
        {title}
      </h3>
      <p className="dark:text-rose-550/80 mt-1.5 max-w-sm text-sm leading-relaxed text-rose-800/80">
        {description}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            isLoading={isLoading}
            className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5 shrink-0" />
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
}
