import { ShieldAlert } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Maintenance - NextDoorClinic",
  description: "NextDoorClinic is undergoing scheduled maintenance updates.",
};

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="shadow-premium w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/20">
          <ShieldAlert className="h-7 w-7 text-blue-600 dark:text-blue-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Scheduled Maintenance
          </h1>
          <p className="text-slate-550 text-sm dark:text-zinc-400">
            NextDoorClinic is undergoing temporary upgrades to improve system performance. We will
            be back online shortly. Thank you for your patience.
          </p>
        </div>

        <div className="pt-2 font-mono text-[10px] text-slate-400">
          System Administrators will still have access to dashboard panels.
        </div>
      </div>
    </div>
  );
}
