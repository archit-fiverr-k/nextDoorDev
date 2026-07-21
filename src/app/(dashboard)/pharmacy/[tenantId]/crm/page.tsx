import { Users } from "lucide-react";

export default function CRMPlaceholderPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center space-y-3 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-900/60">
        <Users className="h-6 w-6 text-slate-400" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          No Patient Selected
        </h4>
        <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-zinc-400">
          Select a patient from the sidebar list to view their registration, appointment history
          timeline, and clinical records.
        </p>
      </div>
    </div>
  );
}
