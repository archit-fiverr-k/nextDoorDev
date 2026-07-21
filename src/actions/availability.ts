"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import {
  weeklyScheduleSchema,
  blockedDateSchema,
  WeeklyScheduleItemInput,
  BlockedDateInput,
} from "@/schemas/availability";
import { revalidatePath } from "next/cache";

export async function updateWeeklyAvailabilityAction(
  pharmacyId: string,
  input: WeeklyScheduleItemInput[]
) {
  const session = await getRequiredSession();

  // Tenant Boundary Check
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const result = weeklyScheduleSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: "Validation failed" };
  }

  const schedule = result.data;

  try {
    await db.$transaction(async (tx) => {
      // 1. Delete all current availability rows
      await tx.availability.deleteMany({
        where: { pharmacyId },
      });

      // 2. Insert only active open slots
      const activeSlots = schedule.filter((s) => s.isOpen);
      if (activeSlots.length > 0) {
        await tx.availability.createMany({
          data: activeSlots.map((s) => ({
            pharmacyId,
            dayOfWeek: s.dayOfWeek,
            openTime: s.openTime,
            closeTime: s.closeTime,
          })),
        });
      }
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "PharmacyAvailability",
        entityId: pharmacyId,
        changes: { schedule },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/availability`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to update operating hours:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function addBlockedDateAction(pharmacyId: string, input: BlockedDateInput) {
  const session = await getRequiredSession();

  // Tenant Boundary Check
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const result = blockedDateSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const { date, reason } = result.data;
  const parsedDate = new Date(date);

  try {
    // Check if already blocked
    const existing = await db.blockedDate.findFirst({
      where: {
        pharmacyId,
        date: parsedDate,
      },
    });

    if (existing) {
      return { success: false, error: "This date is already blocked on your calendar" };
    }

    const blocked = await db.blockedDate.create({
      data: {
        pharmacyId,
        date: parsedDate,
        reason,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE",
        entityName: "BlockedDate",
        entityId: blocked.id,
        changes: { date, reason },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/availability`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to add blocked date:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function removeBlockedDateAction(blockedDateId: string) {
  const session = await getRequiredSession();

  try {
    const blocked = await db.blockedDate.findUnique({
      where: { id: blockedDateId },
    });

    if (!blocked) {
      return { success: false, error: "Blocked date not found" };
    }

    // Tenant Boundary Check
    const isTenantUser = session.user.role === "pharmacy";
    const isPlatformAdmin =
      session.user.role === "super_admin" || session.user.role === "platform_admin";

    if (isTenantUser && session.user.pharmacyId !== blocked.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }
    if (!isTenantUser && !isPlatformAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    await db.blockedDate.delete({
      where: { id: blockedDateId },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE",
        entityName: "BlockedDate",
        entityId: blockedDateId,
        changes: { deleted: { date: blocked.date } },
      },
    });

    revalidatePath(`/pharmacy/${blocked.pharmacyId}/availability`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to delete blocked date:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateBookingRulesAction(
  pharmacyId: string,
  input: {
    bufferTime: number;
    maxBookingsPerSlot: number;
    maxAdvanceDays: number;
    minNoticeHours: number;
  }
) {
  const session = await getRequiredSession();
  const isTenantUser = session.user.role === "pharmacy";

  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    await db.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        bufferTime: input.bufferTime,
        maxBookingsPerSlot: input.maxBookingsPerSlot,
        maxAdvanceDays: input.maxAdvanceDays,
        minNoticeHours: input.minNoticeHours,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "BookingRules",
        entityId: pharmacyId,
        changes: input,
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/availability`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to update booking rules:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
