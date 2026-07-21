"use server";

import { db } from "@/lib/db";
import { assertRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Schema ───────────────────────────────────────────────────────────────────

const cancelSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().min(1, "Please provide a cancellation reason").max(500),
});

const rescheduleSchema = z.object({
  appointmentId: z.string().uuid(),
  preferredDates: z.array(z.string()).min(1, "Please provide at least one preferred date"),
  note: z.string().max(500).optional(),
});

// Helper to get all customer IDs for the logged in patient (matching id OR email)
async function getPatientCustomerIds(sessionUserId: string, sessionEmail?: string | null) {
  const conditions: any[] = [{ id: sessionUserId }];
  if (sessionEmail) {
    conditions.push({ email: sessionEmail });
  }
  const customers = await db.customer.findMany({
    where: { OR: conditions },
    select: { id: true },
  });
  const ids = customers.map((c) => c.id);
  if (!ids.includes(sessionUserId)) {
    ids.push(sessionUserId);
  }
  return ids;
}

// ── Actions ──────────────────────────────────────────────────────────────────

/**
 * List appointments belonging to the authenticated patient.
 */
export async function getPatientAppointmentsAction(filters?: {
  status?: string;
  search?: string;
  page?: number;
}) {
  const session = await assertRole(["patient"]);
  const page = filters?.page ?? 1;
  const take = 10;
  const skip = (page - 1) * take;

  try {
    const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);

    const whereClause: any = {
      customerId: { in: customerIds },
    };

    if (filters?.status && filters.status !== "ALL") {
      whereClause.status = filters.status;
    }

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where: whereClause,
        include: {
          pharmacy: { select: { id: true, name: true, address: true, logoUrl: true, slug: true } },
          service: { select: { id: true, name: true, duration: true, price: true, color: true } },
        },
        orderBy: { startTime: "desc" },
        skip,
        take,
      }),
      db.appointment.count({ where: whereClause }),
    ]);

    return {
      success: true,
      data: appointments,
      pagination: { total, page, pageSize: take, totalPages: Math.ceil(total / take) },
    };
  } catch (error: any) {
    console.error("❌ getPatientAppointmentsAction error:", error);
    return { success: false, error: error.message || "Failed to load appointments", data: [] };
  }
}

/**
 * Get a single appointment detail. Verifies ownership.
 */
export async function getPatientAppointmentDetailAction(appointmentId: string) {
  const session = await assertRole(["patient"]);
  const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);

  try {
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        customerId: { in: customerIds },
      },
      include: {
        pharmacy: true,
        service: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found or access denied" };
    }

    const auditLogs = await db.auditLog.findMany({
      where: { entityName: "Appointment", entityId: appointmentId },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: { appointment, auditLogs } };
  } catch (error: any) {
    console.error("❌ getPatientAppointmentDetailAction error:", error);
    return { success: false, error: error.message || "Failed to load appointment" };
  }
}

/**
 * Cancel an appointment.
 */
export async function cancelPatientAppointmentAction(data: unknown) {
  const session = await assertRole(["patient"]);
  const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);
  const result = cancelSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const { appointmentId, reason } = result.data;

  try {
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        customerId: { in: customerIds },
      },
      include: { pharmacy: { select: { name: true } }, service: { select: { name: true } } },
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found or access denied" };
    }

    if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
      return { success: false, error: "Only pending or confirmed appointments can be cancelled" };
    }

    await db.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED", notes: `Cancelled by patient: ${reason}` },
    });

    await db.auditLog.create({
      data: {
        pharmacyId: appointment.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Appointment",
        entityId: appointmentId,
        changes: {
          status: { from: appointment.status, to: "CANCELLED" },
          reason,
          cancelledBy: "patient",
        },
      },
    });

    await db.patientNotification.create({
      data: {
        customerId: appointment.customerId,
        type: "BOOKING_CANCELLED",
        title: "Appointment Cancelled",
        message: `Your ${appointment.service.name} appointment at ${appointment.pharmacy.name} has been cancelled.`,
        link: `/patient/appointments/${appointmentId}`,
      },
    });

    revalidatePath("/patient/appointments");
    revalidatePath(`/patient/appointments/${appointmentId}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ cancelPatientAppointmentAction error:", error);
    return { success: false, error: error.message || "Failed to cancel appointment" };
  }
}

/**
 * Request a reschedule.
 */
export async function requestRescheduleAction(data: unknown) {
  const session = await assertRole(["patient"]);
  const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);
  const result = rescheduleSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const { appointmentId, preferredDates, note } = result.data;

  try {
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        customerId: { in: customerIds },
      },
      include: { pharmacy: { select: { name: true } }, service: { select: { name: true } } },
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found or access denied" };
    }

    await db.appointment.update({
      where: { id: appointmentId },
      data: { status: "RESCHEDULE_REQUESTED" },
    });

    await db.auditLog.create({
      data: {
        pharmacyId: appointment.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Appointment",
        entityId: appointmentId,
        changes: {
          status: { from: appointment.status, to: "RESCHEDULE_REQUESTED" },
          preferredDates,
          note,
        },
      },
    });

    await db.patientNotification.create({
      data: {
        customerId: appointment.customerId,
        type: "RESCHEDULE",
        title: "Reschedule Request Submitted",
        message: `Your request to reschedule your ${appointment.service.name} appointment at ${appointment.pharmacy.name} has been submitted. The provider will contact you to confirm.`,
        link: `/patient/appointments/${appointmentId}`,
      },
    });

    revalidatePath("/patient/appointments");
    revalidatePath(`/patient/appointments/${appointmentId}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ requestRescheduleAction error:", error);
    return { success: false, error: error.message || "Failed to request reschedule" };
  }
}

/**
 * Get dashboard stats for patient.
 */
export async function getPatientDashboardStatsAction() {
  const session = await assertRole(["patient"]);
  const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);

  try {
    const now = new Date();
    const [upcoming, completed, cancelled, pending, rescheduleRequested] = await Promise.all([
      db.appointment.count({
        where: { customerId: { in: customerIds }, status: "CONFIRMED", startTime: { gte: now } },
      }),
      db.appointment.count({
        where: { customerId: { in: customerIds }, status: "COMPLETED" },
      }),
      db.appointment.count({
        where: { customerId: { in: customerIds }, status: "CANCELLED" },
      }),
      db.appointment.count({
        where: { customerId: { in: customerIds }, status: "PENDING" },
      }),
      db.appointment.count({
        where: { customerId: { in: customerIds }, status: "RESCHEDULE_REQUESTED" },
      }),
    ]);

    const nextAppointment = await db.appointment.findFirst({
      where: {
        customerId: { in: customerIds },
        status: { in: ["CONFIRMED", "PENDING"] },
        startTime: { gte: now },
      },
      include: {
        pharmacy: { select: { name: true, address: true, logoUrl: true } },
        service: { select: { name: true, duration: true, color: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return {
      success: true,
      data: { upcoming, completed, cancelled, pending, rescheduleRequested, nextAppointment },
    };
  } catch (error: any) {
    console.error("❌ getPatientDashboardStatsAction error:", error);
    return { success: false, error: error.message || "Failed to load dashboard stats" };
  }
}
