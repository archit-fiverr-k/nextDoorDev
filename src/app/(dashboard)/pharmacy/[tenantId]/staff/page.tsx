import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { StaffTable } from "./staff-table";
import { H1, P } from "@/components/ui/typography";

interface PharmacyStaffPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyStaffPage({ params }: PharmacyStaffPageProps) {
  const session = await getRequiredSession();
  const isParamUuid = isUuid(params.tenantId);

  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: params.tenantId }, { slug: params.tenantId }] }
      : { slug: params.tenantId },
  });

  if (!pharmacy) {
    notFound();
  }

  // Tenant Boundary Isolation Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacy.id) {
    redirect("/");
  }
  if (!isTenantUser && !isPlatformAdmin) {
    redirect("/");
  }

  const pharmacyId = pharmacy.id;

  // Fetch all staff members for the pharmacy
  const staff = await db.staff.findMany({
    where: { pharmacyId },
    orderBy: { createdAt: "desc" },
  });

  // Fetch audit logs relating to staff changes
  const auditLogs = await db.auditLog.findMany({
    where: {
      pharmacyId,
      entityName: { in: ["Staff", "StaffPassword"] },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="select-text space-y-6">
      <div>
        <H1>Staff Roster & Permissions</H1>
        <P className="mt-1">
          Invite clinicians, receptionists, or branch managers, define roles, reset passwords, and
          audit account access logs.
        </P>
      </div>

      <StaffTable
        pharmacyId={pharmacy.slug || pharmacyId}
        staff={staff}
        auditLogs={auditLogs}
        role={session.user.role as "super_admin" | "platform_admin" | "pharmacy"}
      />
    </div>
  );
}
