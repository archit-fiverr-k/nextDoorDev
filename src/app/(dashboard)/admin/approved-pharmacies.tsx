"use client";

import React, { useTransition } from "react";
import { startImpersonationAction } from "@/actions/admin-settings";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";

interface PharmacyItem {
  id: string;
  name: string;
  email: string;
  slug: string;
}

interface ApprovedPharmaciesProps {
  pharmacies: PharmacyItem[];
}

export function ApprovedPharmacies({ pharmacies }: ApprovedPharmaciesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleImpersonate = (pharmacyId: string) => {
    startTransition(async () => {
      const res = await startImpersonationAction(pharmacyId);
      if (res.success) {
        router.refresh();
        router.push(`/pharmacy/${pharmacyId}`);
      } else {
        alert(res.error || "Failed to initiate impersonation");
      }
    });
  };

  return (
    <div className="shadow-premium overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
      {pharmacies.length === 0 ? (
        <div className="p-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
          No approved pharmacies registered yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 text-xs dark:divide-zinc-900/60">
          {pharmacies.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className="flex items-center justify-between p-4 hover:bg-slate-50/40 dark:hover:bg-zinc-900/10"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 dark:text-slate-100">{pharmacy.name}</div>
                <div className="text-[10px] text-slate-400">
                  Subdomain:{" "}
                  <code className="font-mono text-blue-600 dark:text-blue-500">
                    {pharmacy.slug}
                  </code>
                </div>
              </div>

              <button
                onClick={() => handleImpersonate(pharmacy.id)}
                disabled={isPending}
                className="inline-flex cursor-pointer items-center space-x-1 rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 transition-all hover:bg-blue-100 disabled:opacity-50"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Impersonate</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
