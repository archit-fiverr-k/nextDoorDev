"use client";

import { useTransition } from "react";
import { updatePharmacyStatusAction, rejectPharmacyAction } from "@/actions/admin";
import { Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PendingPharmacy {
  id: string;
  name: string;
  email: string;
  slug: string;
  createdAt: Date;
}

interface PendingPharmaciesProps {
  pharmacies: PendingPharmacy[];
  role: "super_admin" | "platform_admin" | "pharmacy";
}

export function PendingPharmacies({ pharmacies, role }: PendingPharmaciesProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = (id: string) => {
    startTransition(async () => {
      const res = await updatePharmacyStatusAction(id, "APPROVED");
      if (!res.success) {
        alert(res.error || "Approval failed");
      }
    });
  };

  const handleReject = (id: string) => {
    if (!confirm("Are you sure you want to reject and delete this pharmacy?")) return;
    startTransition(async () => {
      const res = await rejectPharmacyAction(id);
      if (!res.success) {
        alert(res.error || "Rejection failed");
      }
    });
  };

  if (pharmacies.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center dark:border-zinc-800/80 dark:bg-zinc-950">
        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
          No pending pharmacies currently awaiting verification.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:divide-zinc-900/60 dark:border-zinc-800/80 dark:bg-zinc-950">
      {pharmacies.map((pharmacy) => (
        <div key={pharmacy.id} className="flex items-center justify-between space-x-4 p-4 sm:p-6">
          <div className="min-w-0">
            <h4 className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
              {pharmacy.name}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Email: {pharmacy.email} | Slug:{" "}
              <span className="rounded border border-slate-100 bg-slate-50 px-1 py-0.5 font-mono text-slate-600 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-400">
                {pharmacy.slug}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center space-x-2">
            {role === "super_admin" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(pharmacy.id)}
                  disabled={isPending}
                  className="hover:text-emerald-750 dark:border-zinc-850 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-950/20"
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(pharmacy.id)}
                  disabled={isPending}
                  className="hover:text-rose-750 dark:border-zinc-850 text-rose-600 hover:bg-rose-50 dark:text-rose-500 dark:hover:bg-rose-950/20"
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Reject
                </Button>
              </>
            ) : (
              <Link
                href={`/admin/pharmacies/${pharmacy.id}/edit`}
                className="dark:hover:bg-zinc-850 inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit Details
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
