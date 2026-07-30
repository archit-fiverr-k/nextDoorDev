"use server";

import { db } from "@/lib/db";
import { BookingEngine } from "@/lib/booking-service";
import { Resend } from "resend";
import {
  sendBookingConfirmationEmail,
  sendBookingNotificationEmail,
  sendPatientWelcomeEmail,
  sendEmailVerificationEmail,
} from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { SignJWT, jwtVerify } from "jose";
import { localDateTimeToUTC } from "@/lib/timezone";
import { sendVerifyOtp, checkVerifyOtp, sendSMS, sendWhatsapp } from "@/lib/twilio";
import { isValidUKOrDevPhone } from "@/lib/phone-validation";

import { sendEmail } from "@/lib/email";

async function sendAllBookingNotifications(params: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  pharmacyName: string;
  pharmacyEmail?: string;
  pharmacySlug?: string;
  serviceName: string;
  startTime: Date;
  referenceCode: string;
  manageUrl: string;
}) {
  const {
    patientName,
    patientEmail,
    patientPhone,
    pharmacyName,
    pharmacyEmail,
    pharmacySlug,
    serviceName,
    startTime,
    referenceCode,
    manageUrl,
  } = params;

  const formattedSlotTime = new Date(startTime).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Send Email Notification to Patient
  try {
    await sendBookingConfirmationEmail(patientEmail, {
      patientName,
      branchName: pharmacyName,
      serviceName,
      startTime,
      bookingId: referenceCode,
    });
    console.log(`✅ [Email Dispatch] Sent booking reservation email to patient ${patientEmail}`);
  } catch (emailErr) {
    console.warn("⚠️ Failed to send confirmation email:", emailErr);
  }

  // 2. Send Booking Reservation SMS to Patient
  try {
    const smsBody = `Your appointment reservation for ${serviceName} at ${pharmacyName} (${formattedSlotTime}) has been received. Booking Ref: ${referenceCode}. Status: Awaiting Pharmacy Approval.`;
    await sendSMS({ to: patientPhone, body: smsBody });
    console.log(`✅ [SMS Dispatch] Sent reservation SMS to patient ${patientPhone}`);
  } catch (smsErr) {
    console.warn("⚠️ Failed to send confirmation SMS:", smsErr);
  }

  // 3. Send WhatsApp Notification to Patient
  try {
    const whatsappBody = `Hello ${patientName} 👋\n\nYour appointment reservation at *${pharmacyName}* has been received!\n\n📋 *Treatment:* ${serviceName}\n📅 *Slot:* ${formattedSlotTime}\n🔖 *Booking Ref:* ${referenceCode}\n\nStatus: *Awaiting Pharmacy Approval*\n\nView details: ${manageUrl}`;
    await sendWhatsapp({ to: patientPhone, body: whatsappBody });
    console.log(`✅ [WhatsApp Dispatch] Sent reservation WhatsApp to ${patientPhone}`);
  } catch (waErr) {
    console.warn("⚠️ Failed to send confirmation WhatsApp:", waErr);
  }

  // 4. Send New Booking Awaiting Email to Pharmacy Owner
  if (pharmacyEmail) {
    try {
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const portalUrl = `${appBaseUrl}/pharmacy/${pharmacySlug || "dashboard"}/appointments`;
      const subject = `[ACTION REQUIRED] New Booking Request Awaiting Approval - ${serviceName} (${patientName})`;
      const html = `
        <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px;">
            <div style="background: #0f766e; padding: 16px; border-radius: 8px; color: white; text-align: center;">
              <h2 style="margin: 0; font-size: 18px;">🔔 New Booking Request Awaiting Approval</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">${pharmacyName}</p>
            </div>
            
            <p style="margin-top: 20px; font-size: 14px;">Hello <strong>${pharmacyName} Team</strong>,</p>
            <p style="font-size: 13px;">A new appointment request has been submitted by a patient and is awaiting your review and confirmation.</p>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; background: #f1f5f9; border-radius: 8px; padding: 12px;">
              <tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">Patient:</td><td style="padding: 6px 12px; font-weight: bold; color: #0f172a;">${patientName}</td></tr>
              <tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">Service:</td><td style="padding: 6px 12px; font-weight: bold; color: #0f766e;">${serviceName}</td></tr>
              <tr><td style="padding: 6px 12px; font-weight: bold; color: #64748b;">Slot:</td><td style="padding: 6px 12px; font-weight: bold; color: #0f172a;">${formattedSlotTime}</td></tr>
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

      await sendEmail({ to: pharmacyEmail, subject, html });
      console.log(
        `✅ [Email Dispatch] Sent awaiting booking email to pharmacy owner ${pharmacyEmail}`
      );
    } catch (pharmErr) {
      console.warn("⚠️ Failed to send awaiting booking email to pharmacy owner:", pharmErr);
    }
  }
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function generateVerificationToken(email: string) {
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || "default_auth_secret_minimum_length_32_chars"
  );
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function checkEmailAction(email: string) {
  try {
    const customer = await db.customer.findFirst({
      where: { email },
    });

    if (!customer) {
      return { success: true, exists: false, hasPassword: false };
    }

    // Check if ANY customer record matching this email has a password set
    const customerWithPassword = await db.customer.findFirst({
      where: { email, passwordHash: { not: null } },
    });

    return {
      success: true,
      exists: true,
      hasPassword: !!customerWithPassword?.passwordHash,
    };
  } catch (error) {
    console.error("❌ checkEmailAction failed:", error);
    return { success: false, error: "Database error" };
  }
}

export async function verifyAndFetchPatientAction(email: string, password: string) {
  try {
    const customer = await db.customer.findFirst({
      where: { email, passwordHash: { not: null } },
    });
    if (!customer || !customer.passwordHash) {
      return { success: false, error: "Account not found" };
    }
    const isValid = verifyPassword(password, customer.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid password" };
    }
    return {
      success: true,
      data: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
    };
  } catch (error) {
    console.error("❌ verifyAndFetchPatientAction failed:", error);
    return { success: false, error: "Authentication failed" };
  }
}

export async function getAvailableSlotsAction(
  pharmacyId: string,
  serviceId: string,
  dateStr: string,
  timezone: string
) {
  try {
    const slots = await BookingEngine.getAvailableSlots(pharmacyId, serviceId, dateStr, timezone);
    return {
      success: true,
      slots: slots.map((s) => ({
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        formattedTime: s.formattedTime,
      })),
    };
  } catch (error) {
    console.error("❌ Failed to query timeslots action:", error);
    return { success: false, error: "Failed to load timeslots" };
  }
}

export async function generateManageToken(appointmentId: string, email: string) {
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || "super-secret-auth-key-for-local-development-only"
  );
  return await new SignJWT({ appointmentId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyManageToken(token: string) {
  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "super-secret-auth-key-for-local-development-only"
    );
    const { payload } = await jwtVerify(token, secret);
    return { success: true, payload: payload as { appointmentId: string; email: string } };
  } catch (err) {
    return { success: false, error: "Invalid or expired token" };
  }
}

export async function sendBookingOtpAction(mobile: string, email?: string) {
  const clientIp = headers().get("x-forwarded-for") || "127.0.0.1";
  const limiter = rateLimit(`sendotp:${clientIp}`, 10, 10 * 60 * 1000);
  if (!limiter.success) {
    return {
      success: false,
      error: "Too many verification requests. Please wait a few minutes.",
    };
  }

  const cleanPhone = mobile.trim();
  if (!isValidUKOrDevPhone(cleanPhone)) {
    return {
      success: false,
      error: "Only UK mobile numbers (+44 / 07...) are supported.",
    };
  }

  try {
    const existingOtp = await db.bookingOtp.findFirst({
      where: { phone: cleanPhone },
      orderBy: { createdAt: "desc" },
    });

    if (existingOtp) {
      if (existingOtp.lastResentAt) {
        const timeSinceLastResend = Date.now() - new Date(existingOtp.lastResentAt).getTime();
        if (timeSinceLastResend < 30000) {
          const waitSecs = Math.ceil((30000 - timeSinceLastResend) / 1000);
          return {
            success: false,
            error: `Please wait ${waitSecs} seconds before requesting a new code.`,
            cooldownRemaining: waitSecs,
          };
        }
      }

      if (existingOtp.resendCount >= 3) {
        return {
          success: false,
          error:
            "Maximum resend limit reached (3 resends max). Please check your mobile number or contact support.",
          maxResendsExceeded: true,
        };
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const resendCount = existingOtp ? existingOtp.resendCount + 1 : 0;

    await db.bookingOtp.deleteMany({
      where: { phone: cleanPhone, status: { in: ["PENDING", "FAILED", "EXPIRED"] } },
    });

    const otpRecord = await db.bookingOtp.create({
      data: {
        phone: cleanPhone,
        email: email || null,
        code,
        status: "PENDING",
        attempts: 0,
        resendCount,
        lastResentAt: new Date(),
        expiresAt,
      },
    });

    const dispatchResult = await sendVerifyOtp({ to: cleanPhone, code });

    if (dispatchResult.sid) {
      await db.bookingOtp.update({
        where: { id: otpRecord.id },
        data: { verificationSid: dispatchResult.sid },
      });
    }

    return {
      success: true,
      otpId: otpRecord.id,
      expiresAt: expiresAt.toISOString(),
      resendCount,
      resendsRemaining: 3 - resendCount,
    };
  } catch (error) {
    console.error("❌ sendBookingOtpAction failed:", error);
    return { success: false, error: "Failed to send verification code." };
  }
}

export async function verifyOtpAndCompleteBookingAction(data: {
  pharmacyId: string;
  serviceId: string;
  startTime: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  addressLine1?: string;
  addressLine2?: string;
  townCity?: string;
  postcode?: string;
  dob?: string;
  notes?: string;
  otpCode: string;
}) {
  const cleanPhone = data.mobile.trim();
  const cleanCode = data.otpCode.trim();

  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: "Please enter a valid 6-digit verification code." };
  }

  try {
    const otpRecord = await db.bookingOtp.findFirst({
      where: { phone: cleanPhone, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return {
        success: false,
        error: "Verification session expired or not found. Please request a new code.",
        requiresNewOtp: true,
      };
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await db.bookingOtp.update({
        where: { id: otpRecord.id },
        data: { status: "EXPIRED" },
      });
      return {
        success: false,
        error: "Verification code expired (5-minute limit). Please request a new code.",
        requiresNewOtp: true,
      };
    }

    if (otpRecord.attempts >= 5) {
      await db.bookingOtp.update({
        where: { id: otpRecord.id },
        data: { status: "FAILED" },
      });
      return {
        success: false,
        error: "Maximum verification attempts (5) exceeded. Please request a new code.",
        attemptsExceeded: true,
      };
    }

    const verifyCheck = await checkVerifyOtp({ to: cleanPhone, code: cleanCode });
    const isCodeValid =
      verifyCheck.method === "TWILIO_VERIFY" ? verifyCheck.success : otpRecord.code === cleanCode;

    if (!isCodeValid) {
      const newAttempts = otpRecord.attempts + 1;
      const remainingAttempts = 5 - newAttempts;

      if (newAttempts >= 5) {
        await db.bookingOtp.update({
          where: { id: otpRecord.id },
          data: { attempts: newAttempts, status: "FAILED" },
        });
        return {
          success: false,
          error: "Maximum verification attempts reached. Please request a new code.",
          attemptsExceeded: true,
        };
      }

      await db.bookingOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: newAttempts },
      });

      return {
        success: false,
        error: `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts,
      };
    }

    await db.bookingOtp.update({
      where: { id: otpRecord.id },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    });

    const startTimeUTC = new Date(data.startTime);
    const serviceIds = data.serviceId.split(",");
    const [services, pharmacy] = await Promise.all([
      db.service.findMany({
        where: { id: { in: serviceIds }, isActive: true },
      }),
      db.pharmacy.findUnique({ where: { id: data.pharmacyId } }),
    ]);

    if (services.length === 0 || !pharmacy) {
      return { success: false, error: "Service or Clinic not found." };
    }

    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const fullAddress = data.addressLine1
      ? `${data.addressLine1}${data.addressLine2 ? `, ${data.addressLine2}` : ""}, ${data.townCity || ""}, ${data.postcode || ""}`
      : undefined;

    const result = await db.$transaction(async (tx) => {
      let customer = await tx.customer.findFirst({
        where: {
          OR: [{ phone: cleanPhone }, { email: data.email }],
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            pharmacyId: data.pharmacyId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: cleanPhone,
            address: fullAddress,
            dateOfBirth: data.dob ? new Date(data.dob) : undefined,
            smsNotifications: true,
            emailNotifications: true,
          },
        });
      } else {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: cleanPhone,
            email: data.email,
            ...(fullAddress ? { address: fullAddress } : {}),
            ...(data.dob ? { dateOfBirth: new Date(data.dob) } : {}),
          },
        });
      }

      const createdAppointments = [];
      let currentStart = startTimeUTC;

      for (const svc of services) {
        const svcEnd = new Date(currentStart.getTime() + svc.duration * 60 * 1000);
        const appt = await tx.appointment.create({
          data: {
            pharmacyId: data.pharmacyId,
            customerId: customer.id,
            serviceId: svc.id,
            startTime: currentStart,
            endTime: svcEnd,
            status: "PENDING",
            notes: data.notes,
          },
        });
        createdAppointments.push(appt);
        currentStart = svcEnd;
      }

      const firstAppt = createdAppointments[0];

      await tx.patientNotification.create({
        data: {
          customerId: customer.id,
          type: "BOOKING_CONFIRMED",
          title: "Booking Request Submitted",
          message: `Your appointment request for ${services.map((s) => s.name).join(", ")} at ${pharmacy.name} has been submitted and is awaiting pharmacy approval.`,
          link: `/patient/appointments/${firstAppt.id}`,
        },
      });

      return { customer, appointment: firstAppt, services, pharmacy };
    });

    const referenceCode = `NDC-${result.appointment.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
    const manageToken = await generateManageToken(result.appointment.id, result.customer.email);
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const manageUrl = `${appBaseUrl}/manage-booking/${manageToken}`;

    await sendAllBookingNotifications({
      patientName: `${result.customer.firstName} ${result.customer.lastName}`,
      patientEmail: result.customer.email,
      patientPhone: cleanPhone,
      pharmacyName: result.pharmacy.name,
      serviceName: result.services.map((s) => s.name).join(", "),
      startTime: startTimeUTC,
      referenceCode,
      manageUrl,
    });

    return {
      success: true,
      appointmentId: result.appointment.id,
      referenceCode,
      manageToken,
      manageUrl,
      patientEmail: result.customer.email,
      pharmacyName: result.pharmacy.name,
      pharmacyAddress: result.pharmacy.address,
      serviceName: result.services.map((s) => s.name).join(", "),
      startTime: startTimeUTC.toISOString(),
    };
  } catch (error) {
    console.error("❌ verifyOtpAndCompleteBookingAction failed:", error);
    return {
      success: false,
      error: "An error occurred while confirming your booking. Please try again.",
    };
  }
}

// ─── Direct Booking Action ──────────────────────────────────────────

interface DirectBookingInput {
  pharmacyId: string;
  serviceId: string;
  startTime: string; // ISO string
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  townCity: string;
  postcode: string;
  notes?: string;
  password?: string;
}

export async function createBookingDirectAction(data: DirectBookingInput) {
  const clientIp = headers().get("x-forwarded-for") || "127.0.0.1";
  const limiter = rateLimit(`directbook:${clientIp}`, 5, 10 * 60 * 1000);
  if (!limiter.success) {
    return {
      success: false,
      error: "Too many booking attempts. Please wait a few minutes before trying again.",
    };
  }

  try {
    const startTimeUTC = new Date(data.startTime);
    const serviceIds = data.serviceId.split(",");
    const [services, pharmacy] = await Promise.all([
      db.service.findMany({
        where: {
          id: { in: serviceIds },
          isActive: true,
        },
      }),
      db.pharmacy.findUnique({ where: { id: data.pharmacyId } }),
    ]);

    if (services.length === 0) {
      return { success: false, error: "The selected services are no longer available." };
    }

    if (!pharmacy) {
      return { success: false, error: "Pharmacy not found." };
    }

    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const endTimeUTC = new Date(startTimeUTC.getTime() + totalDuration * 60 * 1000);
    const addressValue = `${data.addressLine1}${data.addressLine2 ? `, ${data.addressLine2}` : ""}, ${data.townCity}, ${data.postcode}`;
    const addressNote = `Patient address: ${addressValue}`;
    const combinedNotes = data.notes ? `${data.notes}\n---\n${addressNote}` : addressNote;

    const transactionResult = await db.$transaction(async (tx) => {
      // 1. Check Slot Availability
      const dateStr = startTimeUTC.toLocaleDateString("en-CA", { timeZone: "Europe/London" });
      const targetDate = new Date(dateStr);
      const isBlocked = await tx.blockedDate.findFirst({
        where: {
          pharmacyId: data.pharmacyId,
          date: targetDate,
        },
      });
      if (isBlocked) {
        throw new Error("SLOT_TAKEN");
      }

      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/London",
        weekday: "short",
      });
      const weekdayShort = formatter.format(startTimeUTC);
      const shortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayIndex = shortNames.indexOf(weekdayShort);

      const availability = await tx.availability.findUnique({
        where: {
          pharmacyId_dayOfWeek: {
            pharmacyId: data.pharmacyId,
            dayOfWeek: dayIndex,
          },
        },
      });
      if (!availability) {
        throw new Error("SLOT_TAKEN");
      }

      const { openTime, closeTime } = availability;
      const openUTC = localDateTimeToUTC(dateStr, openTime, "Europe/London");
      const closeUTC = localDateTimeToUTC(dateStr, closeTime, "Europe/London");

      if (startTimeUTC.getTime() < openUTC.getTime() || endTimeUTC.getTime() > closeUTC.getTime()) {
        throw new Error("SLOT_TAKEN");
      }

      const overlap = await tx.appointment.findFirst({
        where: {
          pharmacyId: data.pharmacyId,
          status: { not: "CANCELLED" },
          startTime: { lt: endTimeUTC },
          endTime: { gt: startTimeUTC },
        },
      });
      if (overlap) {
        throw new Error("SLOT_TAKEN");
      }

      // 2. Find or Create/Update Customer
      let customer = await tx.customer.findFirst({
        where: { email: data.email, passwordHash: { not: null } },
      });

      if (!customer) {
        customer = await tx.customer.findFirst({
          where: { email: data.email },
        });
      }

      let isNewAccount = false;
      let verificationToken: string | null = null;
      let verificationExpiry: Date | null = null;

      if (!customer) {
        isNewAccount = true;
        let passwordHash: string | null = null;
        if (data.password) {
          passwordHash = hashPassword(data.password);
          verificationToken = await generateVerificationToken(data.email);
          verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        customer = await tx.customer.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.mobile,
            address: addressValue,
            passwordHash,
            emailVerified: false,
            emailVerificationToken: verificationToken,
            emailVerificationExpiry: verificationExpiry,
          },
        });
      } else {
        // If customer already has a password set and password is provided, verify it
        if (customer.passwordHash && data.password) {
          const isValidPassword = verifyPassword(data.password, customer.passwordHash);
          if (!isValidPassword) {
            throw new Error("INVALID_PASSWORD");
          }
        }

        const updateData: any = {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.mobile,
          address: addressValue,
        };

        if (data.password && !customer.passwordHash) {
          isNewAccount = true;
          updateData.passwordHash = hashPassword(data.password);
          verificationToken = await generateVerificationToken(data.email);
          verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
          updateData.emailVerified = false;
          updateData.emailVerificationToken = verificationToken;
          updateData.emailVerificationExpiry = verificationExpiry;
        }

        customer = await tx.customer.update({
          where: { id: customer.id },
          data: updateData,
        });
      }

      // 3. Create chained appointments
      let currentStartTime = startTimeUTC;
      const createdAppointments = [];

      for (const svc of services) {
        const svcEndTime = new Date(currentStartTime.getTime() + svc.duration * 60 * 1000);
        const appointment = await tx.appointment.create({
          data: {
            pharmacyId: data.pharmacyId,
            customerId: customer.id,
            serviceId: svc.id,
            startTime: currentStartTime,
            endTime: svcEndTime,
            status: "PENDING",
            notes: combinedNotes,
          },
        });
        createdAppointments.push(appointment);

        await tx.patientNotification.create({
          data: {
            customerId: customer.id,
            type: "BOOKING_CONFIRMED",
            title: "Booking Request Submitted",
            message: `Your appointment request for ${svc.name} at ${pharmacy.name} has been submitted and is awaiting pharmacy owner approval.`,
            link: `/patient/appointments/${appointment.id}`,
          },
        });

        await tx.auditLog.create({
          data: {
            pharmacyId: data.pharmacyId,
            action: "CREATE",
            entityName: "Appointment",
            entityId: appointment.id,
            changes: {
              customerName: `${data.firstName} ${data.lastName}`,
              serviceName: svc.name,
              startTime: appointment.startTime.toISOString(),
              source: "progressive_booking_wizard",
            },
          },
        });

        currentStartTime = svcEndTime;
      }

      const firstAppointment = createdAppointments[0];

      const servicesString = services.map((s) => s.name).join(", ");
      const confirmationLog = await tx.communicationsLog.create({
        data: {
          pharmacyId: data.pharmacyId,
          customerId: customer.id,
          type: "EMAIL",
          subject: "Booking Request Received - NextDoorClinic",
          content: `Booking request generated for appointment IDs: ${createdAppointments.map((a) => a.id).join(", ")}. Services: ${servicesString}.`,
          recipient: customer.email,
          status: "PENDING",
        },
      });

      return {
        customer,
        appointment: firstAppointment,
        isNewAccount,
        verificationToken,
        confirmationLogId: confirmationLog.id,
      };
    });

    const referenceCode = `NDC-${transactionResult.appointment.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const manageUrl = `${appBaseUrl}/b/${referenceCode}`;

    await sendAllBookingNotifications({
      patientName: `${data.firstName} ${data.lastName}`,
      patientEmail: data.email,
      patientPhone: data.mobile,
      pharmacyName: pharmacy.name,
      pharmacyEmail: pharmacy.email,
      pharmacySlug: pharmacy.slug,
      serviceName: services.map((s) => s.name).join(", "),
      startTime: startTimeUTC,
      referenceCode,
      manageUrl,
    });

    return {
      success: true,
      appointmentId: transactionResult.appointment.id,
      referenceCode,
      manageToken: referenceCode,
      manageUrl,
      patientEmail: data.email,
      newAccountCreated: transactionResult.isNewAccount,
      email: data.email,
    };
  } catch (error: any) {
    if (error.message === "SLOT_TAKEN") {
      return { success: false, error: "SLOT_TAKEN" };
    }
    if (error.message === "INVALID_PASSWORD") {
      return {
        success: false,
        error:
          "Incorrect password for this account. Please enter your valid account password or sign in.",
      };
    }
    console.error("❌ createBookingDirectAction failed:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function createAccountPostBookingAction(data: { email: string; password: string }) {
  if (!data.password || data.password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  try {
    const customer = await db.customer.findFirst({
      where: { email: data.email },
    });

    if (!customer) {
      return { success: false, error: "Patient record not found." };
    }

    const passwordHash = hashPassword(data.password);
    await db.customer.updateMany({
      where: { email: data.email },
      data: {
        passwordHash,
        emailVerified: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ createAccountPostBookingAction failed:", error);
    return { success: false, error: "Failed to create account." };
  }
}

export async function getBookingByManageTokenAction(token: string) {
  try {
    const tokenResult = await verifyManageToken(token);
    if (!tokenResult.success || !tokenResult.payload) {
      return { success: false, error: "Invalid or expired manage booking link." };
    }

    const appointment = await db.appointment.findUnique({
      where: { id: tokenResult.payload.appointmentId },
      include: {
        pharmacy: true,
        service: true,
        customer: true,
      },
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found." };
    }

    const referenceCode = `NDC-${appointment.id.replace(/-/g, "").substring(0, 6).toUpperCase()}`;

    return {
      success: true,
      data: {
        id: appointment.id,
        referenceCode,
        status: appointment.status,
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        notes: appointment.notes,
        pharmacy: {
          id: appointment.pharmacy.id,
          name: appointment.pharmacy.displayName || appointment.pharmacy.name,
          address: appointment.pharmacy.address,
          phone: appointment.pharmacy.phone,
          email: appointment.pharmacy.email,
          googleMapsUrl: appointment.pharmacy.googleMapsUrl,
        },
        service: {
          id: appointment.service.id,
          name: appointment.service.name,
          description: appointment.service.description,
          duration: appointment.service.duration,
          price: Number(appointment.service.price),
        },
        patient: {
          firstName: appointment.customer.firstName,
          lastName: appointment.customer.lastName,
          email: appointment.customer.email,
          phone: appointment.customer.phone,
        },
      },
    };
  } catch (error) {
    console.error("❌ getBookingByManageTokenAction failed:", error);
    return { success: false, error: "Failed to load booking details." };
  }
}

export async function cancelAppointmentByTokenAction(token: string, reason?: string) {
  try {
    const tokenResult = await verifyManageToken(token);
    if (!tokenResult.success || !tokenResult.payload) {
      return { success: false, error: "Invalid or expired link." };
    }

    const appointment = await db.appointment.findUnique({
      where: { id: tokenResult.payload.appointmentId },
      include: { customer: true, pharmacy: true, service: true },
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found." };
    }

    if (appointment.status === "CANCELLED") {
      return { success: false, error: "Appointment is already cancelled." };
    }

    await db.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "CANCELLED",
        notes: reason ? `Cancellation reason: ${reason}` : appointment.notes,
      },
    });

    await db.patientNotification.create({
      data: {
        customerId: appointment.customerId,
        type: "BOOKING_CANCELLED",
        title: "Appointment Cancelled",
        message: `Your appointment for ${appointment.service.name} at ${appointment.pharmacy.name} has been cancelled.`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ cancelAppointmentByTokenAction failed:", error);
    return { success: false, error: "Failed to cancel appointment." };
  }
}
