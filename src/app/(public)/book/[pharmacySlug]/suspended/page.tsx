import { db } from "@/lib/db";
import { Ban, ArrowRight, Activity } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Page Unavailable - NextDoorClinic",
  description: "This booking portal is currently offline or unavailable.",
};

interface SuspendedPageProps {
  params: {
    pharmacySlug: string;
  };
}

export default async function PharmacySuspendedPage({ params }: SuspendedPageProps) {
  const pharmacy = await db.pharmacy.findUnique({
    where: { slug: params.pharmacySlug },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="shadow-premium w-full max-w-md space-y-6 rounded-2xl border border-slate-200/80 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        {/* Logo container */}
        <div className="mb-4 flex justify-center">
          {pharmacy?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pharmacy.logoUrl}
              alt={pharmacy.displayName || pharmacy.name}
              className="max-h-12 object-contain"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/20">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            This booking page isn&apos;t available.
          </h1>
          <p className="text-xs font-normal leading-relaxed text-slate-500 dark:text-zinc-400 sm:text-sm">
            {pharmacy
              ? `If you're trying to book an appointment with ${pharmacy.name}, please contact the pharmacy directly.`
              : "If you're trying to book an appointment, please contact the pharmacy directly."}
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-zinc-800/60">
          <Link
            href="https://nextdoorclinic.co.uk"
            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-600 transition-colors hover:text-blue-700"
          >
            <span>Search for another pharmacy</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
