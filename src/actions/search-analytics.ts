"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Logs a search query execution for analytics purposes.
 */
export async function logSearchQueryAction(
  query: string,
  detectedType: string,
  resultsCount: number,
  searchTimeMs: number,
  sessionToken: string
) {
  try {
    await db.searchAnalytics.create({
      data: {
        query: query.trim(),
        detectedType,
        resultsCount,
        searchTimeMs,
        sessionToken,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to log search analytics:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Marks a logged search analytics query as converted when a booking is created.
 */
export async function trackSearchConversionAction(bookingId: string, sessionToken: string) {
  try {
    const log = await db.searchAnalytics.findFirst({
      where: { sessionToken, converted: false },
      orderBy: { timestamp: "desc" },
    });

    if (log) {
      await db.searchAnalytics.update({
        where: { id: log.id },
        data: {
          converted: true,
          bookingId,
        },
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to track search conversion:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Saves a patient callback request when no providers are available.
 */
export async function createCallbackRequestAction(
  name: string,
  phone: string,
  email: string | null,
  postcode: string,
  serviceId: string | null,
  notes: string | null
) {
  try {
    await db.searchCallbackRequest.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        postcode: postcode.trim().toUpperCase(),
        serviceId: serviceId || null,
        notes: notes ? notes.trim() : null,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to create callback request:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Registers a patient to be notified when slots open up within their area.
 */
export async function createWaitlistNotificationAction(
  email: string,
  postcode: string,
  radiusMiles: number,
  serviceId: string | null
) {
  try {
    await db.searchNotificationWaitlist.create({
      data: {
        email: email.trim().toLowerCase(),
        postcode: postcode.trim().toUpperCase(),
        radiusMiles,
        serviceId: serviceId || null,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to save waitlist notification request:", error);
    return { success: false, error: error.message };
  }
}
