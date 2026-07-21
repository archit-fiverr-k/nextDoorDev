"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { hashPassword } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

const inviteStaffSchema = z.object({
  pharmacyId: z.string().uuid("Invalid Pharmacy ID"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.string().min(2, "Invalid role selection"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// 1. Invite/Create Staff Member
export async function inviteStaffAction(input: z.infer<typeof inviteStaffSchema>) {
  const session = await getRequiredSession();
  const parsed = inviteStaffSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed: " + parsed.error.errors.map((e) => e.message).join(", "),
    };
  }

  const { pharmacyId, name, email, role, password } = parsed.data;

  // Tenant Boundary Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access to tenant settings" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check if email already registered (as admin, pharmacy, or other staff)
    const existingSuper = await db.superAdmin.findUnique({ where: { email } });
    const existingPlatform = await db.platformAdmin.findUnique({ where: { email } });
    const existingPharmacy = await db.pharmacy.findUnique({ where: { email } });
    const existingStaff = await db.staff.findUnique({ where: { email } });

    if (existingSuper || existingPlatform || existingPharmacy || existingStaff) {
      return { success: false, error: "Email is already registered on the platform" };
    }

    const passwordHash = hashPassword(password);

    const staff = await db.staff.create({
      data: {
        pharmacyId,
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      },
    });

    // Write to AuditLog representing the email invite dispatch
    await db.auditLog.create({
      data: {
        pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE",
        entityName: "Staff",
        entityId: staff.id,
        changes: {
          name,
          email,
          role,
          invitationEmailSent: true,
          invitationTemplate: "STAFF_WELCOME_INVITE",
        },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/staff`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to create staff:", error);
    return { success: false, error: error.message || "An unexpected error occurred during invite" };
  }
}

// 2. Toggle Staff Active Status
export async function toggleStaffStatusAction(staffId: string, isActive: boolean) {
  const session = await getRequiredSession();
  try {
    const staff = await db.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return { success: false, error: "Staff member not found" };
    }

    // Tenant Boundary Guard
    const isTenantUser = session.user.role === "pharmacy";
    if (isTenantUser && session.user.pharmacyId !== staff.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }

    await db.staff.update({
      where: { id: staffId },
      data: { isActive },
    });

    // AuditLog
    await db.auditLog.create({
      data: {
        pharmacyId: staff.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Staff",
        entityId: staffId,
        changes: {
          isActive: { from: staff.isActive, to: isActive },
        },
      },
    });

    revalidatePath(`/pharmacy/${staff.pharmacyId}/staff`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to toggle staff status:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 3. Delete Staff Member
export async function deleteStaffAction(staffId: string) {
  const session = await getRequiredSession();
  try {
    const staff = await db.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return { success: false, error: "Staff member not found" };
    }

    // Tenant Boundary Guard
    const isTenantUser = session.user.role === "pharmacy";
    if (isTenantUser && session.user.pharmacyId !== staff.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }

    await db.staff.delete({ where: { id: staffId } });

    // AuditLog
    await db.auditLog.create({
      data: {
        pharmacyId: staff.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE",
        entityName: "Staff",
        entityId: staffId,
        changes: {
          deleted: { name: staff.name, email: staff.email, role: staff.role },
        },
      },
    });

    revalidatePath(`/pharmacy/${staff.pharmacyId}/staff`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to delete staff:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 4. Reset Staff Password
export async function resetStaffPasswordAction(staffId: string, newPassword: string) {
  const session = await getRequiredSession();
  if (newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  try {
    const staff = await db.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return { success: false, error: "Staff member not found" };
    }

    // Tenant Boundary Guard
    const isTenantUser = session.user.role === "pharmacy";
    if (isTenantUser && session.user.pharmacyId !== staff.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }

    const passwordHash = hashPassword(newPassword);

    await db.staff.update({
      where: { id: staffId },
      data: { passwordHash },
    });

    // AuditLog
    await db.auditLog.create({
      data: {
        pharmacyId: staff.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "StaffPassword",
        entityId: staffId,
        changes: {
          passwordReset: true,
        },
      },
    });

    revalidatePath(`/pharmacy/${staff.pharmacyId}/staff`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to reset staff password:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
