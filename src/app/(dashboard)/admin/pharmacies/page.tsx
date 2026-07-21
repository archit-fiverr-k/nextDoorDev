import { db } from "@/lib/db";
import { PharmacyTable } from "./pharmacy-table";
import { H1, P } from "@/components/ui/typography";
import { getRequiredSession } from "@/lib/session";

import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AdminPharmaciesPage() {
  const session = await getRequiredSession();
  if (session.user.role === "platform_admin" && !session.user.canManagePharmacies) {
    redirect("/admin");
  }
  const pharmacies = await db.pharmacy.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      auditLogs: {
        where: {
          action: "CREATE",
          entityName: "Pharmacy",
        },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <H1>Manage Pharmacies</H1>
        <P className="mt-1">
          Review, approve, suspend, or reactivate pharmacies registered on the platform.
        </P>
      </div>

      <PharmacyTable
        data={pharmacies}
        role={session.user.role as "super_admin" | "platform_admin" | "pharmacy"}
      />
    </div>
  );
}
