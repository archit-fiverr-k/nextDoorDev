"use server";

import { db } from "@/lib/db";
import { createBookingSchema, CreateBookingInput, requestOTPSchema } from "@/schemas/bookings";
import { sendOTPEmail, sendBookingConfirmationEmail } from "@/lib/email";

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

    // 5. Send Confirmation Email
    await sendBookingConfirmationEmail(patientEmail, {
      patientName,
      branchName: pharmacy.name, // The pharmacy name serves as the main facility
      serviceName: service.name,
      startTime: new Date(startTime),
      bookingId: appointment.id,
    });

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
