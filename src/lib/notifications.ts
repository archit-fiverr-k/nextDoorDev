/**
 * NextDoorClinic — Decoupled Async Notification Outbox Engine
 * Decouples SMS, WhatsApp, and Email notification dispatches from the
 * critical path of PostgreSQL booking creation transactions.
 * Enforces UK PECR rules for transactional vs marketing/reminder messages.
 */

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getRenderedTemplate } from "@/lib/email-templates";
import { sendSMS, sendWhatsapp } from "@/lib/twilio";

export interface BookingNotificationParams {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyEmail?: string;
  pharmacySlug?: string;
  serviceName: string;
  startTime: Date;
  referenceCode: string;
  manageUrl: string;
}

export interface ReminderNotificationParams extends BookingNotificationParams {
  customerId?: string;
  category: "REMINDER" | "MARKETING";
}

/**
 * Strictly Transactional Confirmation Notification (UK PECR Exempt)
 * Always dispatches because patient initiated explicit booking.
 */
export function enqueueBookingNotification(params: BookingNotificationParams): void {
  setTimeout(async () => {
    try {
      const formattedTime = new Date(params.startTime).toLocaleString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // 1. Dispatch Transactional Confirmation Email
      try {
        const { subject, html } = await getRenderedTemplate("BOOKING_CONFIRMATION", {
          patientName: params.patientName,
          providerName: params.pharmacyName,
          serviceName: params.serviceName,
          formattedTime,
          bookingId: params.referenceCode,
        });
        await sendEmail({ to: params.patientEmail, subject, html });

        await db.emailLog.create({
          data: {
            recipient: params.patientEmail,
            subject,
            templateName: "BOOKING_CONFIRMATION",
            status: "SENT",
          },
        });
      } catch (emailErr: any) {
        console.warn("⚠️ Outbox Email Dispatch Failed:", emailErr);
      }

      // 2. Dispatch Transactional SMS
      try {
        const smsBody = `Hi ${params.patientName}, your appointment for ${params.serviceName} at ${params.pharmacyName} is confirmed for ${formattedTime}. Ref: ${params.referenceCode}.`;
        await sendSMS({ to: params.patientPhone, body: smsBody });

        await db.smsLog.create({
          data: {
            recipientPhone: params.patientPhone,
            content: smsBody,
            status: "SENT",
          },
        });
      } catch (smsErr: any) {
        console.warn("⚠️ Outbox SMS Dispatch Failed:", smsErr);
      }

      // 3. Dispatch Transactional WhatsApp
      try {
        const whatsappBody = `Hello ${params.patientName} 👋\n\nGreat news! Your appointment booking at *${params.pharmacyName}* is *CONFIRMED*!\n\n📋 *Treatment:* ${params.serviceName}\n📅 *Date & Time:* ${formattedTime}\n🔖 *Ref:* ${params.referenceCode}\n\nView details: ${params.manageUrl}`;
        await sendWhatsapp({ to: params.patientPhone, body: whatsappBody });
      } catch (waErr: any) {
        console.warn("⚠️ Outbox WhatsApp Dispatch Failed:", waErr);
      }
    } catch (err: any) {
      console.error("❌ Outbox Engine Execution Exception:", err);
    }
  }, 0);
}

/**
 * Marketing & Reminder Notification Outbox (Enforces UK PECR Consent)
 * Checks patient opt-in settings (emailNotifications, smsNotifications, whatsappNotifications).
 */
export function enqueueMarketingOrReminderNotification(params: ReminderNotificationParams): void {
  setTimeout(async () => {
    try {
      // Find patient record to verify UK PECR consent
      const customer = params.customerId
        ? await db.customer.findUnique({ where: { id: params.customerId } })
        : await db.customer.findFirst({ where: { email: params.patientEmail } });

      const emailAllowed = customer ? customer.emailNotifications : true;
      const smsAllowed = customer ? customer.smsNotifications : false;
      const whatsappAllowed = customer ? customer.whatsappNotifications : false;

      const formattedTime = new Date(params.startTime).toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      // 1. Dispatch Email if consented
      if (emailAllowed) {
        try {
          const subject = `Reminder: Appointment at ${params.pharmacyName} tomorrow`;
          const html = `<p>Hi ${params.patientName}, this is a reminder for your upcoming ${params.serviceName} appointment on ${formattedTime}.</p>`;
          await sendEmail({ to: params.patientEmail, subject, html });
        } catch (e) {
          console.warn("⚠️ Reminder Email Failed:", e);
        }
      }

      // 2. Dispatch SMS if consented
      if (smsAllowed) {
        try {
          const smsBody = `Reminder: Appointment for ${params.serviceName} at ${params.pharmacyName} on ${formattedTime}. Ref: ${params.referenceCode}.`;
          await sendSMS({ to: params.patientPhone, body: smsBody });
        } catch (e) {
          console.warn("⚠️ Reminder SMS Failed:", e);
        }
      }

      // 3. Dispatch WhatsApp if consented
      if (whatsappAllowed) {
        try {
          const waBody = `Reminder: Your appointment at *${params.pharmacyName}* for ${params.serviceName} is scheduled for ${formattedTime}. Ref: ${params.referenceCode}.`;
          await sendWhatsapp({ to: params.patientPhone, body: waBody });
        } catch (e) {
          console.warn("⚠️ Reminder WhatsApp Failed:", e);
        }
      }
    } catch (err) {
      console.error("❌ Reminder Outbox Exception:", err);
    }
  }, 0);
}
