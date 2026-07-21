import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { EditPharmacyForm } from "./edit-form";
import { H1, P } from "@/components/ui/typography";
import { getRequiredSession } from "@/lib/session";

interface AdminEditPharmacyPageProps {
  params: {
    id: string;
  };
}

export default async function AdminEditPharmacyPage({ params }: AdminEditPharmacyPageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin" && session.user.role !== "platform_admin") {
    redirect("/");
  }

  const pharmacy = await db.pharmacy.findUnique({
    where: { id: params.id },
  });

  if (!pharmacy) {
    notFound();
  }

  if (pharmacy.status !== "PENDING") {
    return (
      <div className="max-w-2xl rounded-xl border border-slate-200/80 bg-white p-8 text-center dark:border-zinc-800/80 dark:bg-zinc-950">
        <h3 className="dark:text-rose-450 mb-2 text-lg font-bold text-rose-600">
          Access Restricted
        </h3>
        <p className="mb-6 text-sm leading-normal text-slate-500 dark:text-zinc-400">
          Only pharmacies in PENDING status can be edited by platform administrators. This pharmacy
          has already been processed.
        </p>
        <a
          href="/admin/pharmacies"
          className="dark:hover:bg-zinc-850 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
        >
          Back to Pharmacies
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <H1>Edit Pending Pharmacy</H1>
        <P className="mt-1">
          Modify the name, subdomain slug, or contact details of this pharmacy before verification
          approval.
        </P>
      </div>

      <EditPharmacyForm pharmacy={pharmacy} />
    </div>
  );
}
