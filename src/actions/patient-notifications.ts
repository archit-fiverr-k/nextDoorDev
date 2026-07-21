"use server";

import { db } from "@/lib/db";
import { assertRole } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function getPatientCustomerIds(sessionUserId: string, sessionEmail?: string | null) {
  const conditions: any[] = [{ id: sessionUserId }];
  if (sessionEmail) {
    conditions.push({ email: sessionEmail });
  }
  const customers = await db.customer.findMany({
    where: { OR: conditions },
    select: { id: true },
  });
  const ids = customers.map((c) => c.id);
  if (!ids.includes(sessionUserId)) {
    ids.push(sessionUserId);
  }
  return ids;
}

/**
 * Get all notifications for the authenticated patient.
 */
export async function getPatientNotificationsAction() {
  const session = await assertRole(["patient"]);
  const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);

  try {
    const notifications = await db.patientNotification.findMany({
      where: { customerId: { in: customerIds } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return { success: true, data: notifications, unreadCount };
  } catch (error: any) {
    console.error("❌ getPatientNotificationsAction error:", error);
    return {
      success: false,
      error: error.message || "Failed to load notifications",
      data: [],
      unreadCount: 0,
    };
  }
}

/**
 * Get recent notifications (for header bell / dashboard preview).
 */
export async function getRecentPatientNotificationsAction(limit = 5) {
  const session = await assertRole(["patient"]);
  const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);

  try {
    const notifications = await db.patientNotification.findMany({
      where: { customerId: { in: customerIds } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await db.patientNotification.count({
      where: { customerId: { in: customerIds }, isRead: false },
    });

    return { success: true, data: notifications, unreadCount };
  } catch (error: any) {
    console.error("❌ getRecentPatientNotificationsAction error:", error);
    return { success: false, data: [], unreadCount: 0 };
  }
}

/**
 * Mark a single notification as read. Verifies ownership.
 */
export async function markNotificationReadAction(notificationId: string) {
  const session = await assertRole(["patient"]);
  const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);

  try {
    await db.patientNotification.updateMany({
      where: { id: notificationId, customerId: { in: customerIds } },
      data: { isRead: true },
    });

    revalidatePath("/patient/notifications");
    revalidatePath("/patient/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("❌ markNotificationReadAction error:", error);
    return { success: false, error: error.message || "Failed to mark as read" };
  }
}

/**
 * Mark all notifications as read for the patient.
 */
export async function markAllNotificationsReadAction() {
  const session = await assertRole(["patient"]);
  const customerIds = await getPatientCustomerIds(session.user.id, session.user.email);

  try {
    await db.patientNotification.updateMany({
      where: { customerId: { in: customerIds }, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/patient/notifications");
    revalidatePath("/patient/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("❌ markAllNotificationsReadAction error:", error);
    return { success: false, error: error.message || "Failed to mark all as read" };
  }
}
