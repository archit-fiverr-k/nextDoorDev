import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { CRMSidebar } from "./crm-sidebar";
import { H1, P } from "@/components/ui/typography";

export const revalidate = 0;

interface CRMLayoutProps {
  params: {
    tenantId: string;
  };
  children: React.ReactNode;
}

export default async function PharmacyCRMLayout({ params, children }: CRMLayoutProps) {
  const session = await getRequiredSession();

  // Tenant Boundary Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== params.tenantId) {
    redirect("/");
  }
  if (!isTenantUser && !isPlatformAdmin) {
    redirect("/");
  }

  // Load all customers with appointment counts
  const customers = await db.customer.findMany({
    where: {
      pharmacyId: params.tenantId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      tags: true,
      dateOfBirth: true,
      _count: {
        select: {
          appointments: true,
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <H1>Patient Manager (CRM)</H1>
        <P className="mt-1">
          Review patient registration details, historical clinical appointments, and manage clinical
          progress logs.
        </P>
      </div>

      <div className="shadow-premium grid min-h-[600px] grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 lg:grid-cols-12">
        {/* Left Side: Search and List */}
        <div className="border-b border-slate-200/80 dark:border-zinc-800/80 lg:col-span-4 lg:border-b-0 lg:border-r">
          <CRMSidebar tenantId={params.tenantId} customers={customers} />
        </div>

        {/* Right Side: detail view */}
        <div className="flex flex-col bg-slate-50/30 dark:bg-zinc-900/10 lg:col-span-8">
          {children}
        </div>
      </div>
    </div>
  );
}
