"use server";

import { db } from "@/lib/db";
import { createBookingSchema, CreateBookingInput, requestOTPSchema } from "@/schemas/bookings";
import { sendOTPEmail, sendBookingConfirmationEmail } from "@/lib/email";
import { sendSMS, sendWhatsapp } from "@/lib/twilio";

export async function sendOTPAction(email: string) {
  const result = requestOTPSchema.safeParse({ email });
  if (!result.success) {
    return { success: false, error: "Invalid email address" };
  }

  // 1. Generate 6-digit numeric OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  try {
    // 2. Save OTP record
    await db.bookingOtp.create({
      data: {
        email,
        code: otpCode,
        expiresAt,
      },
    });

    // 3. Send email containing OTP
    const mailResult = await sendOTPEmail(email, otpCode);
    if (!mailResult.success) {
      return { success: false, error: "Failed to deliver verification code email" };
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Send OTP error:", error);
    return { success: false, error: "An unexpected error occurred while generating code" };
  }
}

export async function createBookingAction(data: CreateBookingInput) {
  const result = createBookingSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const {
    pharmacyId,
    serviceId,
    patientName,
    patientEmail,
    patientPhone,
    startTime,
    endTime,
    otp,
    notes,
  } = result.data;

  try {
    // 1. Verify OTP
    const validOtp = await db.bookingOtp.findFirst({
      where: {
        email: patientEmail,
        code: otp,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validOtp) {
      return { success: false, error: "Invalid or expired verification code" };
    }

    // 2. Verify Pharmacy and Service exist and match
    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    if (!pharmacy) {
      return { success: false, error: "Selected pharmacy does not exist" };
    }

    const service = await db.service.findFirst({
      where: { id: serviceId, pharmacyId },
    });
    if (!service) {
      return { success: false, error: "Selected service does not exist" };
    }

    // 3. Find or Upsert Customer (Patient) record under this pharmacy
    // We isolate customer records to their respective pharmacy workspace
    const nameParts = patientName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const customer = await db.customer.upsert({
      where: {
        pharmacyId_email: {
          pharmacyId,
          email: patientEmail,
        },
      },
      update: {
        firstName,
        lastName,
        phone: patientPhone,
      },
      create: {
        pharmacyId,
        firstName,
        lastName,
        email: patientEmail,
        phone: patientPhone,
      },
    });

    // 4. Create Appointment in database
    const appointment = await db.appointment.create({
      data: {
        pharmacyId,
        customerId: customer.id,
        serviceId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "PENDING",
        notes,
      },
    });

    // 5. Send Confirmation Email, SMS, and WhatsApp
    const referenceCode = `NDC-${appointment.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    try {
      await sendBookingConfirmationEmail(patientEmail, {
        patientName,
        branchName: pharmacy.name,
        serviceName: service.name,
        startTime: new Date(startTime),
        bookingId: referenceCode,
      });
    } catch (emailErr) {
      console.warn("⚠️ Failed to send booking email:", emailErr);
    }

    try {
      const smsBody = `Hi ${patientName}, your NextDoorClinic appointment for ${service.name} at ${pharmacy.name} is confirmed. Ref: ${referenceCode}.`;
      await sendSMS({ to: patientPhone, body: smsBody });
    } catch (smsErr) {
      console.warn("⚠️ Failed to send booking SMS:", smsErr);
    }

    try {
      const whatsappBody = `Hello ${patientName} 👋\n\nYour appointment booking at *${pharmacy.name}* has been received!\n\n📋 *Treatment:* ${service.name}\n📅 *Booking Ref:* ${referenceCode}\n📍 *Clinic:* ${pharmacy.name}\n\nStatus: *Awaiting Pharmacy Approval*\n\nThank you for choosing NextDoorClinic!`;
      await sendWhatsapp({ to: patientPhone, body: whatsappBody });
    } catch (waErr) {
      console.warn("⚠️ Failed to send booking WhatsApp:", waErr);
    }

    // 5b. Send New Booking Awaiting Email to Pharmacy Owner
    if (pharmacy.email) {
      try {
        const portalUrl = `${appBaseUrl}/pharmacy/${pharmacy.slug || pharmacy.id}/appointments`;
        const subject = `[ACTION REQUIRED] New Booking Request Awaiting Approval - ${service.name} (${patientName})`;
        const html = `
          <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px;">
              <div style="background: #0f766e; padding: 16px; border-radius: 8px; color: white; text-align: center;">
                <h2 style="margin: 0; font-size: 18px;">🔔 New Booking Request Awaiting Approval</h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">${pharmacy.name}</p>
              </div>
              
              <p style="margin-top: 20px; font-size: 14px;">Hello <strong>${pharmacy.name} Team</strong>,</p>
              <p style="font-size: 13px;">A new appointment request has been submitted by a patient and is awaiting your review and confirmation.</p>

              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; background: #f1f5f9; border-radius: 8px; padding: 12px;">
                <tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">Patient:</td><td style="padding: 6px 12px; font-weight: bold; color: #0f172a;">${patientName}</td></tr>
                <tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">Service:</td><td style="padding: 6px 12px; font-weight: bold; color: #0f766e;">${service.name}</td></tr>
                <tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">Reference:</td><td style="padding: 6px 12px; font-weight: bold; color: #0f172a;">${referenceCode}</td></tr>
                <tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">Phone:</td><td style="padding: 6px 12px; font-weight: bold; color: #0f172a;">${patientPhone}</td></tr>
                <tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">Email:</td><td style="padding: 6px 12px; font-weight: bold; color: #0f172a;">${patientEmail}</td></tr>
              </table>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${portalUrl}" style="background: #0f766e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
                  Review & Accept Booking in Portal &rarr;
                </a>
              </div>
            </div>
          </div>
        `;
        const { sendEmail } = await import("@/lib/email");
        await sendEmail({ to: pharmacy.email, subject, html });
      } catch (pharmErr) {
        console.warn("⚠️ Failed to send pharmacy awaiting email:", pharmErr);
      }
    }

    // 6. Clean up OTP codes for this email
    await db.bookingOtp.deleteMany({
      where: { email: patientEmail },
    });

    return { success: true, bookingId: appointment.id };
  } catch (error) {
    console.error("❌ Create appointment error:", error);
    return { success: false, error: "An unexpected error occurred while confirming appointment" };
  }
}
