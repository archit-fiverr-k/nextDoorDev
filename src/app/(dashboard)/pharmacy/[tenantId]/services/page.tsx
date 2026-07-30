import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { PharmacyServicesCatalogueView } from "./pharmacy-services-catalogue-view";

export const revalidate = 0; // Dynamic data

interface PharmacyServicesPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyServicesPage({ params }: PharmacyServicesPageProps) {
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

  // 1. Fetch all Master Service Categories & Master Services
  const categories = await db.serviceCategory.findMany({
    include: {
      masterServices: {
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // 2. Fetch all PharmacyService records for this pharmacy branch
  const pharmacyServices = await db.pharmacyService.findMany({
    where: { pharmacyId },
  });

  return (
    <PharmacyServicesCatalogueView
      tenantIdOrSlug={params.tenantId}
      pharmacyId={pharmacyId}
      pharmacyName={pharmacy.name}
      categories={JSON.parse(JSON.stringify(categories))}
      pharmacyServices={JSON.parse(JSON.stringify(pharmacyServices))}
    />
  );
}
