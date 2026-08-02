"use server";

import { db } from "@/lib/db";
import { formatErrorMessage } from "@/lib/error-utils";

export async function joinSlotWaitlistAction(data: {
  email: string;
  postcode: string;
  serviceId?: string;
  radiusMiles?: number;
}) {
  try {
    if (!data.email || !data.postcode) {
      return { success: false, error: "Please provide a valid email and postcode." };
    }

    const entry = await db.searchNotificationWaitlist.create({
      data: {
        email: data.email.trim().toLowerCase(),
        postcode: data.postcode.trim().toUpperCase(),
        serviceId: data.serviceId || null,
        radiusMiles: data.radiusMiles || 10,
        status: "PENDING",
      },
    });

    return {
      success: true,
      waitlistId: entry.id,
      message: "You have been added to the waitlist. We will notify you if a slot opens up!",
    };
  } catch (error: any) {
    console.error("❌ joinSlotWaitlistAction failed:", error);
    return { success: false, error: formatErrorMessage(error) };
  }
}
