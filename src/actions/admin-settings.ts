"use server";

import { db } from "@/lib/db";
import { getRequiredSession, getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Fetch or seed global system configurations
 */
export async function getSystemSettingsAction() {
  try {
    let settings = await db.systemSetting.findFirst();
    if (!settings) {
      settings = await db.systemSetting.create({
        data: {
          isMaintenanceMode: false,
          announcementBanner: null,
        },
      });
    }
    return { success: true, settings };
  } catch (error) {
    console.error("❌ Failed to load system settings:", error);
    return { success: false, error: "Failed to read system settings" };
  }
}

/**
 * Update global maintenance mode and announcements (Super Admin only)
 */
export async function updateSystemSettingsAction(
  isMaintenanceMode: boolean,
  announcementBanner: string | null,
  trustMetrics?: any,
  trustTabs?: any,
  trustTicker?: any,
  trustTickerTitle?: string | null
) {
  const session = await getRequiredSession();
  const isSuperAdmin = session.user.role === "super_admin";
  const isPlatformWithPerm =
    session.user.role === "platform_admin" && session.user.canManageSettings;
  if (!isSuperAdmin && !isPlatformWithPerm) {
    return {
      success: false,
      error: "Unauthorized access: Insufficient permissions to modify global settings",
    };
  }

  try {
    let settings = await db.systemSetting.findFirst();
    if (!settings) {
      await db.systemSetting.create({
        data: {
          isMaintenanceMode,
          announcementBanner,
          trustMetrics: trustMetrics || [],
          trustTabs: trustTabs || [],
          trustTicker: trustTicker || [],
          trustTickerTitle: trustTickerTitle || "Trust Verification:",
        },
      });
    } else {
      await db.systemSetting.update({
        where: { id: settings.id },
        data: {
          isMaintenanceMode,
          announcementBanner,
          trustMetrics: trustMetrics !== undefined ? trustMetrics : settings.trustMetrics,
          trustTabs: trustTabs !== undefined ? trustTabs : settings.trustTabs,
          trustTicker: trustTicker !== undefined ? trustTicker : settings.trustTicker,
          trustTickerTitle:
            trustTickerTitle !== undefined ? trustTickerTitle : settings.trustTickerTitle,
        },
      });
    }

    // Audit Log settings update
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "SystemSetting",
        entityId: "global",
        changes: {
          isMaintenanceMode,
          announcementBanner,
          trustMetrics,
          trustTabs,
          trustTicker,
          trustTickerTitle,
        },
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to update settings:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Super Admin Impersonation Action
 */
export async function startImpersonationAction(pharmacyId: string) {
  const session = await getSession();

  // Guard: Must be logged in as super_admin (or already impersonating to switch, but standard is super_admin check)
  const isSuperAdmin = session?.user?.role === "super_admin" || session?.user?.impersonatorId;
  if (!isSuperAdmin) {
    return { success: false, error: "Unauthorized: Super Admin credentials required" };
  }

  const adminId = session?.user?.impersonatorId || session?.user?.id;
  if (!adminId) {
    return { success: false, error: "Admin ID not resolved" };
  }

  try {
    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    if (!pharmacy) {
      return { success: false, error: "Target pharmacy branch not found" };
    }

    // Set active impersonating ID
    await db.superAdmin.update({
      where: { id: adminId },
      data: { impersonatingId: pharmacyId },
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: session?.user?.email || "Super Admin",
        action: "UPDATE",
        entityName: "UserSession",
        entityId: pharmacyId,
        changes: { impersonate: "start", branch: pharmacy.name },
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("❌ Impersonation trigger error:", error);
    return { success: false, error: "Failed to initiate tenant impersonation" };
  }
}

/**
 * Terminate Active Impersonation Action
 */
export async function stopImpersonationAction() {
  const session = await getSession();

  const adminId = session?.user?.impersonatorId;
  if (!adminId) {
    return { success: false, error: "No active impersonation session detected" };
  }

  try {
    await db.superAdmin.update({
      where: { id: adminId },
      data: { impersonatingId: null },
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: session?.user?.email || "Super Admin",
        action: "UPDATE",
        entityName: "UserSession",
        entityId: adminId,
        changes: { impersonate: "stop" },
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("❌ Impersonation termination error:", error);
    return { success: false, error: "Failed to terminate impersonation session" };
  }
}
