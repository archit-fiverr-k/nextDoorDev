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
    <div className="select-text space-y-8 font-sans text-slate-900 antialiased dark:text-zinc-50">
      {/* Header Bar with Constrained Max-Width */}
      <div className="border-b border-slate-200/80 pb-5 dark:border-zinc-800">
        <div className="max-w-3xl space-y-1">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Staff Roster & Permissions
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#10B981] dark:bg-emerald-950/60">
              Access Control
            </span>
          </div>
          <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
            Invite clinicians, receptionists, or branch managers, define role-based access control,
            reset practitioner credentials, and audit security access logs.
          </p>
        </div>
      </div>

      <StaffTable
        pharmacyId={pharmacyId}
        staff={staff}
        auditLogs={auditLogs}
        role={session.user.role as "super_admin" | "platform_admin" | "pharmacy"}
      />
    </div>
  );
}
