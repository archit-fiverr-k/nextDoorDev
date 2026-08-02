import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { SettingsView } from "./settings-view";

interface SettingsPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const session = await getRequiredSession();
  const isParamUuid = isUuid(params.tenantId);

  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: params.tenantId }, { slug: params.tenantId }] }
      : { slug: params.tenantId },
    include: {
      availability: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
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

  return <SettingsView pharmacy={JSON.parse(JSON.stringify(pharmacy))} />;
}
