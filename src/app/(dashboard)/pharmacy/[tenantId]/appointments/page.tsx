import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { AppointmentsTable } from "./appointments-table";
import { H1, P } from "@/components/ui/typography";

interface PharmacyAppointmentsPageProps {
  params: {
    tenantId: string;
  };
}

export default async function PharmacyAppointmentsPage({ params }: PharmacyAppointmentsPageProps) {
  const session = await getRequiredSession();

  // Tenant Boundary Isolation Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== params.tenantId) {
    redirect("/");
  }
  if (!isTenantUser && !isPlatformAdmin) {
    redirect("/");
  }

  // Load all appointments with patient details and service specs
  const appointments = await db.appointment.findMany({
    where: {
      pharmacyId: params.tenantId,
    },
    include: {
      customer: true,
      service: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  // Load audit logs representing changes of the appointments
  const auditLogs = await db.auditLog.findMany({
    where: {
      pharmacyId: params.tenantId,
      entityName: { in: ["Appointment", "AppointmentBulk"] },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });

  return (
    <div className="select-text space-y-6">
      <div>
        <H1>Appointment Manager</H1>
        <P className="mt-1">
          Review, approve, confirm, reject, cancel, or reschedule clinical appointments. Add booking
          notes and inspect audit trails.
        </P>
      </div>

      <AppointmentsTable
        pharmacyId={params.tenantId}
        appointments={appointments}
        auditLogs={auditLogs}
      />
    </div>
  );
}
