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
import { SignJWT } from "jose";
import { localDateTimeToUTC } from "@/lib/timezone";

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

export async function sendBookingOtpAction(email: string) {
  const clientIp = headers().get("x-forwarded-for") || "127.0.0.1";
  const limiter = rateLimit(`sendotp:${clientIp}`, 5, 10 * 60 * 1000);
  if (!limiter.success) {
    return {
      success: false,
      error: "Too many requests. Please wait a few minutes before trying again.",
    };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  try {
    await db.bookingOtp.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ sendBookingOtpAction failed:", error);
    return { success: false, error: "Failed to send verification code" };
  }
}

export async function verifyOtpAndScheduleAction(data: {
  pharmacyId: string;
  serviceId: string;
  startTime: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  otp: string;
  notes?: string;
}) {
  try {
    const validOtp = await db.bookingOtp.findFirst({
      where: {
        email: data.email,
        code: data.otp,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validOtp) {
      return { success: false, error: "Invalid or expired verification code" };
    }

    const startTimeUTC = new Date(data.startTime);
    const service = await db.service.findUnique({ where: { id: data.serviceId } });
    const pharmacy = await db.pharmacy.findUnique({ where: { id: data.pharmacyId } });

    if (!service || !pharmacy) {
      return { success: false, error: "Service or Pharmacy not found" };
    }

    const endTimeUTC = new Date(startTimeUTC.getTime() + service.duration * 60 * 1000);

    let customer = await db.customer.findFirst({
      where: { email: data.email },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          pharmacyId: data.pharmacyId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
      });
    }

    const appointment = await db.appointment.create({
      data: {
        pharmacyId: data.pharmacyId,
        customerId: customer.id,
        serviceId: data.serviceId,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        status: "PENDING",
        notes: data.notes,
      },
    });

    await db.bookingOtp.deleteMany({
      where: { email: data.email },
    });

    return {
      success: true,
      appointmentId: appointment.id,
    };
  } catch (error) {
    console.error("❌ Failed to verify OTP and schedule booking:", error);
    return { success: false, error: "An unexpected error occurred during scheduling" };
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

    return {
      success: true,
      appointmentId: transactionResult.appointment.id,
      referenceCode,
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
