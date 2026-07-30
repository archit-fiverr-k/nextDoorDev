import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
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

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyCRMLayout({ params, children }: CRMLayoutProps) {
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

  // Tenant Boundary Guard
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

  // Load all customers with appointment counts for this pharmacy
  const customers = await db.customer.findMany({
    where: {
      OR: [{ pharmacyId }, { appointments: { some: { pharmacyId } } }],
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
          appointments: {
            where: { pharmacyId },
          },
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
          <CRMSidebar tenantId={pharmacy.slug || pharmacyId} customers={customers} />
        </div>

        {/* Right Side: detail view */}
        <div className="flex flex-col bg-slate-50/30 dark:bg-zinc-900/10 lg:col-span-8">
          {children}
        </div>
      </div>
    </div>
  );
}
