"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// 1. Update Single Appointment Status
export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus
) {
  const session = await getRequiredSession();
  try {
    const app = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!app) {
      return { success: false, error: "Appointment not found" };
    }

    // Tenant Boundary Isolation Guard
    const isTenantUser = session.user.role === "pharmacy";
    if (isTenantUser && session.user.pharmacyId !== app.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }

    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        pharmacy: { select: { name: true } },
        service: { select: { name: true } },
      },
    });

    // Notify patient when status changes
    if (status === "CONFIRMED") {
      await db.patientNotification.create({
        data: {
          customerId: app.customerId,
          type: "BOOKING_CONFIRMED",
          title: "Appointment Approved!",
          message: `Your appointment for ${updated.service.name} at ${updated.pharmacy.name} has been approved by the pharmacy owner.`,
          link: `/patient/appointments/${appointmentId}`,
        },
      });
    } else if (status === "REJECTED" || status === "CANCELLED") {
      await db.patientNotification.create({
        data: {
          customerId: app.customerId,
          type: "BOOKING_CANCELLED",
          title: "Appointment Status Updated",
          message: `Your appointment for ${updated.service.name} at ${updated.pharmacy.name} status is now ${status}.`,
          link: `/patient/appointments/${appointmentId}`,
        },
      });
    }

    // Write Audit Log for Activity Timeline
    await db.auditLog.create({
      data: {
        pharmacyId: app.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Appointment",
        entityId: appointmentId,
        changes: {
          status: { from: app.status, to: status },
        },
      },
    });

    revalidatePath(`/pharmacy/${app.pharmacyId}/appointments`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to update status:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 2. Reschedule Appointment
export async function rescheduleAppointmentAction(
  appointmentId: string,
  startTime: string,
  endTime: string
) {
  const session = await getRequiredSession();
  try {
    const app = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!app) {
      return { success: false, error: "Appointment not found" };
    }

    // Tenant Boundary Isolation Guard
    const isTenantUser = session.user.role === "pharmacy";
    if (isTenantUser && session.user.pharmacyId !== app.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        startTime: start,
        endTime: end,
      },
    });

    // Write Audit Log for Activity Timeline
    await db.auditLog.create({
      data: {
        pharmacyId: app.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Appointment",
        entityId: appointmentId,
        changes: {
          reschedule: {
            before: { start: app.startTime, end: app.endTime },
            after: { start, end },
          },
        },
      },
    });

    revalidatePath(`/pharmacy/${app.pharmacyId}/appointments`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to reschedule appointment:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 3. Update Appointment Notes
export async function updateAppointmentNotesAction(appointmentId: string, notesText: string) {
  const session = await getRequiredSession();
  try {
    const app = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!app) {
      return { success: false, error: "Appointment not found" };
    }

    // Tenant Boundary Isolation Guard
    const isTenantUser = session.user.role === "pharmacy";
    if (isTenantUser && session.user.pharmacyId !== app.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }

    await db.appointment.update({
      where: { id: appointmentId },
      data: { notes: notesText },
    });

    // Write Audit Log for Activity Timeline
    await db.auditLog.create({
      data: {
        pharmacyId: app.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Appointment",
        entityId: appointmentId,
        changes: {
          notes: { before: app.notes, after: notesText },
        },
      },
    });

    revalidatePath(`/pharmacy/${app.pharmacyId}/appointments`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to update notes:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 4. Bulk Update Status Action
export async function bulkUpdateAppointmentStatusAction(
  appointmentIds: string[],
  status: AppointmentStatus,
  pharmacyId: string
) {
  const session = await getRequiredSession();
  const isTenantUser = session.user.role === "pharmacy";

  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    await db.appointment.updateMany({
      where: {
        id: { in: appointmentIds },
        pharmacyId,
      },
      data: { status },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "AppointmentBulk",
        entityId: pharmacyId,
        changes: { bulkStatusSet: status, ids: appointmentIds },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/appointments`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed bulk status update:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
