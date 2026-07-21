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

export default async function PharmacyAvailabilityPage({ params }: PharmacyAvailabilityPageProps) {
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

  // Load existing availability, blocked dates, and pharmacy booking configurations
  const [availability, blockedDates, pharmacy] = await Promise.all([
    db.availability.findMany({
      where: {
        pharmacyId: params.tenantId,
      },
    }),
    db.blockedDate.findMany({
      where: {
        pharmacyId: params.tenantId,
      },
      orderBy: {
        date: "asc",
      },
    }),
    db.pharmacy.findUnique({
      where: {
        id: params.tenantId,
      },
    }),
  ]);

  if (!pharmacy) {
    notFound();
  }

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
        pharmacyId={params.tenantId}
        initialAvailability={availability}
        initialBlockedDates={blockedDates}
        pharmacy={pharmacy}
      />
    </div>
  );
}
