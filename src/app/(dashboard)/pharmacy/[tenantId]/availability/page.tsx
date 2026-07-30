import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { AvailabilityView } from "./availability-view";
import { H1, P } from "@/components/ui/typography";

export const revalidate = 0; // Dynamic data

interface PharmacyAvailabilityPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyAvailabilityPage({ params }: PharmacyAvailabilityPageProps) {
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

  // Load existing availability, blocked dates, and pharmacy booking configurations
  const [availability, blockedDates] = await Promise.all([
    db.availability.findMany({
      where: {
        pharmacyId,
      },
    }),
    db.blockedDate.findMany({
      where: {
        pharmacyId,
      },
      orderBy: {
        date: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <H1>Manage Availability</H1>
        <P className="mt-1">
          Configure weekly business hours, holiday closures, and block off custom dates on your
          scheduling calendar.
        </P>
      </div>

      <AvailabilityView
        pharmacyId={pharmacyId}
        initialAvailability={availability}
        initialBlockedDates={blockedDates}
        pharmacy={pharmacy}
      />
    </div>
  );
}
