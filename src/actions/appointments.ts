"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { getRenderedTemplate } from "@/lib/email-templates";
import { sendSMS, sendWhatsapp } from "@/lib/twilio";

async function dispatchStatusNotification(
  appointmentId: string,
  action: "CONFIRMED" | "CANCELLED" | "RESCHEDULED"
) {
  try {
    const app = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pharmacy: true,
        service: true,
        customer: true,
      },
    });

    if (!app || !app.customer) return;

    const patientName = `${app.customer.firstName} ${app.customer.lastName}`.trim() || "Patient";
    const providerName = app.pharmacy.displayName || app.pharmacy.name;
    const serviceName = app.service.name;
    const referenceCode = `NDC-${app.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
    const formattedTime = new Date(app.startTime).toLocaleString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const manageUrl = `${appBaseUrl}/b/${referenceCode}`;

    if (action === "CONFIRMED") {
      // 1. Email
      try {
        const { subject, html } = await getRenderedTemplate("BOOKING_CONFIRMATION", {
          patientName,
          providerName,
          serviceName,
          formattedTime,
          bookingId: referenceCode,
        });
        await sendEmail({ to: app.customer.email, subject, html });
      } catch (e) {
        console.warn("⚠️ Failed to send confirmation email:", e);
      }

      // 2. SMS
      try {
        const smsBody = `Hi ${patientName}, your appointment for ${serviceName} at ${providerName} is CONFIRMED for ${formattedTime}. Ref: ${referenceCode}.`;
        await sendSMS({ to: app.customer.phone, body: smsBody });
      } catch (e) {
        console.warn("⚠️ Failed to send confirmation SMS:", e);
      }

      // 3. WhatsApp
      try {
        const whatsappBody = `Hello ${patientName} 👋\n\nGreat news! Your appointment booking at *${providerName}* has been *APPROVED & CONFIRMED*!\n\n📋 *Treatment:* ${serviceName}\n📅 *Date & Time:* ${formattedTime}\n🔖 *Ref:* ${referenceCode}\n\nView details: ${manageUrl}`;
        await sendWhatsapp({ to: app.customer.phone, body: whatsappBody });
      } catch (e) {
        console.warn("⚠️ Failed to send confirmation WhatsApp:", e);
      }
    } else if (action === "CANCELLED") {
      // 1. Email
      try {
        const { subject, html } = await getRenderedTemplate("BOOKING_CANCELLATION", {
          patientName,
          providerName,
          serviceName,
          formattedTime,
        });
        await sendEmail({ to: app.customer.email, subject, html });
      } catch (e) {
        console.warn("⚠️ Failed to send cancellation email:", e);
      }

      // 2. SMS
      try {
        const smsBody = `Hi ${patientName}, your appointment for ${serviceName} at ${providerName} (${formattedTime}) has been CANCELLED. Ref: ${referenceCode}.`;
        await sendSMS({ to: app.customer.phone, body: smsBody });
      } catch (e) {
        console.warn("⚠️ Failed to send cancellation SMS:", e);
      }

      // 3. WhatsApp
      try {
        const whatsappBody = `Hello ${patientName} ⚠️\n\nYour appointment for *${serviceName}* at *${providerName}* on ${formattedTime} has been *CANCELLED*.\n\nRef: ${referenceCode}\n\nIf you need to re-book, please visit: ${appBaseUrl}/search`;
        await sendWhatsapp({ to: app.customer.phone, body: whatsappBody });
      } catch (e) {
        console.warn("⚠️ Failed to send cancellation WhatsApp:", e);
      }
    } else if (action === "RESCHEDULED") {
      // 1. Email
      try {
        const { subject, html } = await getRenderedTemplate("BOOKING_REMINDER", {
          patientName,
          providerName,
          serviceName,
          formattedTime,
        });
        const customSubject = `Appointment Rescheduled: ${serviceName} at ${providerName} 📅`;
        await sendEmail({ to: app.customer.email, subject: customSubject, html });
      } catch (e) {
        console.warn("⚠️ Failed to send reschedule email:", e);
      }

      // 2. SMS
      try {
        const smsBody = `Hi ${patientName}, your appointment for ${serviceName} at ${providerName} has been RESCHEDULED to ${formattedTime}. Ref: ${referenceCode}.`;
        await sendSMS({ to: app.customer.phone, body: smsBody });
      } catch (e) {
        console.warn("⚠️ Failed to send reschedule SMS:", e);
      }

      // 3. WhatsApp
      try {
        const whatsappBody = `Hello ${patientName} 📅\n\nYour appointment at *${providerName}* has been *RESCHEDULED*.\n\n📋 *Treatment:* ${serviceName}\n📅 *New Date & Time:* ${formattedTime}\n🔖 *Ref:* ${referenceCode}\n\nView details: ${manageUrl}`;
        await sendWhatsapp({ to: app.customer.phone, body: whatsappBody });
      } catch (e) {
        console.warn("⚠️ Failed to send reschedule WhatsApp:", e);
      }
    }
  } catch (err) {
    console.warn("⚠️ dispatchStatusNotification failed:", err);
  }
}

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

    // Patient notifications in DB & via Email/SMS/WhatsApp
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
      await dispatchStatusNotification(appointmentId, "CONFIRMED");
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
      await dispatchStatusNotification(appointmentId, "CANCELLED");
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

    // Notify patient of rescheduled time
    await dispatchStatusNotification(appointmentId, "RESCHEDULED");

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

    // Notify patients for each bulk updated appointment
    if (status === "CONFIRMED") {
      for (const id of appointmentIds) {
        await dispatchStatusNotification(id, "CONFIRMED");
      }
    } else if (status === "CANCELLED" || status === "REJECTED") {
      for (const id of appointmentIds) {
        await dispatchStatusNotification(id, "CANCELLED");
      }
    }

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

// 5. Dispatch 1-Day Upcoming Appointment Reminders
export async function sendUpcomingAppointmentRemindersAction() {
  try {
    const now = new Date();
    // 12 to 36 hours ahead range to capture tomorrow's appointments
    const windowStart = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const upcomingAppointments = await db.appointment.findMany({
      where: {
        status: "CONFIRMED",
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        pharmacy: true,
        service: true,
        customer: true,
      },
    });

    let sentCount = 0;

    for (const app of upcomingAppointments) {
      if (!app.customer) continue;

      // Check if reminder was already sent today
      const existingReminder = await db.patientNotification.findFirst({
        where: {
          customerId: app.customerId,
          type: "BOOKING_REMINDER",
          createdAt: {
            gte: new Date(now.getTime() - 20 * 60 * 60 * 1000),
          },
        },
      });

      if (existingReminder) continue;

      const patientName = `${app.customer.firstName} ${app.customer.lastName}`.trim() || "Patient";
      const providerName = app.pharmacy.displayName || app.pharmacy.name;
      const serviceName = app.service.name;
      const referenceCode = `NDC-${app.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
      const formattedTime = new Date(app.startTime).toLocaleString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // 1. Email Reminder
      try {
        const { subject, html } = await getRenderedTemplate("BOOKING_REMINDER", {
          patientName,
          providerName,
          serviceName,
          formattedTime,
        });
        await sendEmail({ to: app.customer.email, subject, html });
      } catch (e) {
        console.warn("⚠️ Failed to send 1-day reminder email:", e);
      }

      // 2. SMS Reminder
      try {
        const smsBody = `Reminder: Your appointment for ${serviceName} at ${providerName} is tomorrow, ${formattedTime}. Ref: ${referenceCode}.`;
        await sendSMS({ to: app.customer.phone, body: smsBody });
      } catch (e) {
        console.warn("⚠️ Failed to send 1-day reminder SMS:", e);
      }

      // 3. WhatsApp Reminder
      try {
        const whatsappBody = `Hello ${patientName} ⏰\n\n*Reminder:* You have an appointment tomorrow at *${providerName}*!\n\n📋 *Treatment:* ${serviceName}\n📅 *Time:* ${formattedTime}\n🔖 *Ref:* ${referenceCode}\n\nSee you tomorrow!`;
        await sendWhatsapp({ to: app.customer.phone, body: whatsappBody });
      } catch (e) {
        console.warn("⚠️ Failed to send 1-day reminder WhatsApp:", e);
      }

      // 4. Record patient notification in DB
      await db.patientNotification.create({
        data: {
          customerId: app.customerId,
          type: "BOOKING_REMINDER",
          title: "Upcoming Appointment Tomorrow",
          message: `Reminder: Your appointment for ${serviceName} at ${providerName} is scheduled for tomorrow at ${formattedTime}.`,
          link: `/patient/appointments/${app.id}`,
        },
      });

      sentCount++;
    }

    return { success: true, count: sentCount };
  } catch (error: any) {
    console.error("❌ Failed to send upcoming appointment reminders:", error);
    return { success: false, error: error.message || "Failed to dispatch reminders" };
  }
}
