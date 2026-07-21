import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { ServicesView } from "./services-view";
import { H1, P } from "@/components/ui/typography";

export const revalidate = 0; // Dynamic data

interface PharmacyServicesPageProps {
  params: {
    tenantId: string;
  };
}

export default async function PharmacyServicesPage({ params }: PharmacyServicesPageProps) {
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

  // Load services list
  const services = await db.service.findMany({
    where: {
      pharmacyId: params.tenantId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Load active service categories created by platform admins
  const categories = await db.category.findMany({
    where: {
      status: "ACTIVE",
      deleted: false,
      type: "SERVICE",
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  const sanitizedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <H1>Manage Services</H1>
        <P className="mt-1">
          Configure checkups, immunizations, and clinical treatment services offered at this branch.
        </P>
      </div>

      <ServicesView data={services} pharmacyId={params.tenantId} categories={sanitizedCategories} />
    </div>
  );
}
