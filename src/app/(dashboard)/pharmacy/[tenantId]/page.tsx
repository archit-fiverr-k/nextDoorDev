import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import { PharmacyDashboardView } from "./pharmacy-dashboard-view";

export const revalidate = 0; // Always fetch fresh workspace data

interface PharmacyDashboardPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyDashboardPage({ params }: PharmacyDashboardPageProps) {
  const isParamUuid = isUuid(params.tenantId);

  // 1. Fetch pharmacy details by ID or Slug including onboarding setup check
  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: params.tenantId }, { slug: params.tenantId }] }
      : { slug: params.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      postcode: true,
      logoUrl: true,
      isFirstLogin: true,
      availability: {
        select: { id: true },
      },
    },
  });

  if (!pharmacy) {
    return <div>Pharmacy not found.</div>;
  }

  const pharmacyId = pharmacy.id;
  const showFirstTimeSetup = pharmacy.isFirstLogin || pharmacy.availability.length === 0;

  // 2. Compute today's date boundaries
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // 3. Fetch today's appointments, pending requests, and upcoming bookings concurrently
  const [todayAppointments, pendingAppointments, upcomingAppointments] = await Promise.all([
    // Today's appointments
    db.appointment.findMany({
      where: {
        pharmacyId,
        startTime: { gte: todayStart, lte: todayEnd },
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        startTime: "asc",
      },
    }),
    // Pending approval requests
    db.appointment.findMany({
      where: {
        pharmacyId,
        status: "PENDING",
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
    // Next 5 upcoming appointments after today
    db.appointment.findMany({
      where: {
        pharmacyId,
        startTime: { gt: todayEnd },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        startTime: "asc",
      },
      take: 5,
    }),
  ]);

  // Compute public booking URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicBookingUrl = `${appUrl}/book/${pharmacy.slug || pharmacy.id}`;

  return (
    <PharmacyDashboardView
      pharmacy={pharmacy}
      showFirstTimeSetup={showFirstTimeSetup}
      todayAppointments={JSON.parse(JSON.stringify(todayAppointments))}
      pendingAppointments={JSON.parse(JSON.stringify(pendingAppointments))}
      upcomingAppointments={JSON.parse(JSON.stringify(upcomingAppointments))}
      publicBookingUrl={publicBookingUrl}
    />
  );
}
