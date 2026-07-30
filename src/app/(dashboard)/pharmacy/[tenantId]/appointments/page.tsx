import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { AppointmentsView } from "./appointments-view";

interface PharmacyAppointmentsPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyAppointmentsPage({ params }: PharmacyAppointmentsPageProps) {
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

  // Load all appointments with patient details and service specs
  const appointments = await db.appointment.findMany({
    where: {
      pharmacyId,
    },
    include: {
      customer: true,
      service: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return (
    <AppointmentsView
      pharmacyId={pharmacy.slug || pharmacyId}
      appointments={JSON.parse(JSON.stringify(appointments))}
    />
  );
}
