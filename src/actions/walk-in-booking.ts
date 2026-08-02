"use server";

import { db } from "@/lib/db";
import { formatErrorMessage } from "@/lib/error-utils";
import { findOrCreateMergedCustomer } from "./customer-merge";
import { localDateTimeToUTC } from "@/lib/timezone";
import { sendSMS } from "@/lib/twilio";
import { sendEmail, sendBookingConfirmationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export interface CreateWalkInBookingParams {
  pharmacyId: string;
  serviceId: string;
  staffId?: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dob?: string;
  notes?: string;
  bookingSource?: "WALK_IN" | "PHONE" | "ADMIN" | "ONLINE";
  sendSmsNotification?: boolean;
  sendEmailNotification?: boolean;
}

export async function createWalkInBookingAction(params: CreateWalkInBookingParams) {
  try {
    const {
      pharmacyId,
      serviceId,
      staffId,
      dateStr,
      timeStr,
      firstName,
      lastName,
      phone,
      email,
      dob,
      notes,
      bookingSource = "WALK_IN",
      sendSmsNotification = true,
      sendEmailNotification = true,
    } = params;

    // 1. Fetch Service & Pharmacy details
    const [service, pharmacy] = await Promise.all([
      db.service.findUnique({ where: { id: serviceId } }),
      db.pharmacy.findUnique({ where: { id: pharmacyId } }),
    ]);

    if (!service || !service.isActive) {
      return { success: false, error: "Selected clinical service is invalid or inactive." };
    }
    if (!pharmacy) {
      return { success: false, error: "Pharmacy workspace not found." };
    }

    const duration = service.duration;
    const startTimeUTC = localDateTimeToUTC(dateStr, timeStr, "Europe/London");
    const endTimeUTC = new Date(startTimeUTC.getTime() + duration * 60 * 1000);

    // 2. Perform Transactional Booking & Customer Merge
    const result = await db.$transaction(
      async (tx) => {
        // Check for slot conflict across all services
        const conflict = await tx.appointment.findFirst({
          where: {
            pharmacyId,
            status: { notIn: ["CANCELLED", "REJECTED"] },
            startTime: { lt: endTimeUTC },
            endTime: { gt: startTimeUTC },
          },
        });

        if (conflict) {
          throw new Error("THIS_SLOT_IS_OCCUPIED");
        }

        // Safely parse date of birth
        let parsedDob: Date | undefined = undefined;
        if (dob && typeof dob === "string" && dob.trim() !== "") {
          const candidateDob = new Date(dob);
          if (!isNaN(candidateDob.getTime())) {
            parsedDob = candidateDob;
          }
        }

        // Merge or Create Customer Record
        const customer = await findOrCreateMergedCustomer(tx, {
          pharmacyId,
          firstName,
          lastName,
          email: email || `${phone.replace(/\D/g, "")}@walkin.nextdoorclinic.co.uk`,
          phone,
          dob: parsedDob,
        });

        // Create Appointment with status CONFIRMED
        const appointment = await tx.appointment.create({
          data: {
            pharmacyId,
            customerId: customer.id,
            serviceId,
            staffId: staffId || null,
            startTime: startTimeUTC,
            endTime: endTimeUTC,
            status: "CONFIRMED",
            bookingSource,
            notes: notes || `Quick ${bookingSource} booking created via Counter POS.`,
          },
          include: {
            customer: true,
            service: true,
            pharmacy: true,
          },
        });

        return { appointment, customer };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    const { appointment, customer } = result;

    // 3. Dispatch SMS Notification (if toggled)
    if (sendSmsNotification && phone) {
      const smsBody = `NextDoorClinic: Appointment CONFIRMED for ${service.name} at ${pharmacy.displayName || pharmacy.name} on ${dateStr} at ${timeStr}. Ref: #${appointment.id.slice(0, 8).toUpperCase()}`;
      sendSMS({ to: phone, body: smsBody }).catch((err) =>
        console.error("⚠️ Walk-in SMS dispatch failed:", err)
      );
    }

    // 4. Dispatch Email Notification (if toggled and valid email exists)
    if (sendEmailNotification && email && !email.endsWith("@walkin.nextdoorclinic.co.uk")) {
      sendBookingConfirmationEmail(email, {
        patientName: `${firstName} ${lastName}`,
        branchName: pharmacy.displayName || pharmacy.name,
        serviceName: service.name,
        startTime: startTimeUTC,
        bookingId: appointment.id,
      }).catch((err) => console.error("⚠️ Walk-in Email dispatch failed:", err));
    }

    try {
      revalidatePath(`/pharmacy/${pharmacy.slug}/appointments`);
      revalidatePath(`/pharmacy/${pharmacy.id}/appointments`);
      revalidatePath("/admin/bookings");
    } catch (e) {}

    return {
      success: true,
      appointment,
      message: `Successfully reserved ${service.name} slot for ${firstName} ${lastName} (${bookingSource}).`,
    };
  } catch (error: any) {
    if (error.message === "THIS_SLOT_IS_OCCUPIED") {
      return {
        success: false,
        error: "This time slot is already occupied. Please select another slot.",
      };
    }
    console.error("❌ createWalkInBookingAction error:", error);
    return { success: false, error: formatErrorMessage(error) };
  }
}
