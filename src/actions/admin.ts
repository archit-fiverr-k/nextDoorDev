"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/crypto";
import {
  createPharmacySchema,
  updatePharmacySchema,
  CreatePharmacyInput,
  UpdatePharmacyInput,
} from "@/schemas/admin";
import { sendCredentialsEmail, sendPlatformAdminCredentialsEmail } from "@/lib/email";

// 1. Update status (strictly restricted to super_admin)
export async function updatePharmacyStatusAction(
  pharmacyId: string,
  status: "APPROVED" | "SUSPENDED"
) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    return {
      success: false,
      error: "Unauthorized: Only Super Admins can verify or alter pharmacy statuses",
    };
  }

  try {
    const oldPharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!oldPharmacy) {
      return { success: false, error: "Pharmacy not found" };
    }

    const updated = await db.pharmacy.update({
      where: { id: pharmacyId },
      data: { status },
    });

    // Log action and include welcome/suspension email dispatch info
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Pharmacy",
        entityId: pharmacyId,
        changes: {
          status: { from: oldPharmacy.status, to: status },
          emailNotificationSent: true,
          emailTemplate: status === "APPROVED" ? "WELCOME_EMAIL" : "SUSPENSION_EMAIL",
          recipient: oldPharmacy.email,
        },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/pharmacies");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to update status:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 2. Reject pharmacy (strictly restricted to super_admin)
export async function rejectPharmacyAction(pharmacyId: string) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    return { success: false, error: "Unauthorized: Only Super Admins can reject pharmacies" };
  }

  try {
    const oldPharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!oldPharmacy) {
      return { success: false, error: "Pharmacy not found" };
    }

    await db.pharmacy.delete({
      where: { id: pharmacyId },
    });

    // Record in AuditLog including rejection email dispatch info
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE",
        entityName: "Pharmacy",
        entityId: pharmacyId,
        changes: {
          deleted: { name: oldPharmacy.name, email: oldPharmacy.email },
          emailNotificationSent: true,
          emailTemplate: "REJECTION_EMAIL",
          recipient: oldPharmacy.email,
        },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/pharmacies");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to reject pharmacy:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 3. Register pharmacy by admin (restricted to super_admin and permitted platform_admin)
export async function createPharmacyByAdminAction(input: CreatePharmacyInput) {
  const session = await getRequiredSession();
  const isSuperAdmin = session.user.role === "super_admin";
  const isPlatformWithPerm =
    session.user.role === "platform_admin" && session.user.canManagePharmacies;
  if (!isSuperAdmin && !isPlatformWithPerm) {
    return {
      success: false,
      error: "Unauthorized: Insufficient permissions to register pharmacies",
    };
  }

  const result = createPharmacySchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const { name, slug, email, phone, address, password } = result.data;

  try {
    // Unique check
    const existingEmail = await db.pharmacy.findUnique({ where: { email } });
    if (existingEmail) {
      return { success: false, error: "Email is already registered" };
    }

    const existingSlug = await db.pharmacy.findUnique({ where: { slug } });
    if (existingSlug) {
      return { success: false, error: "Slug/Subdomain is already taken" };
    }

    const passwordHash = hashPassword(password);

    const pharmacy = await db.pharmacy.create({
      data: {
        name,
        slug,
        email,
        phone,
        address,
        passwordHash,
        status: "PENDING",
        isFirstLogin: true,
      },
    });

    // Log action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE",
        entityName: "Pharmacy",
        entityId: pharmacy.id,
        changes: {
          created: { name, slug, email },
        },
      },
    });

    // Send credentials email
    const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
    await sendCredentialsEmail(email, {
      pharmacyName: name,
      loginEmail: email,
      defaultPassword: password,
      loginUrl,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/pharmacies");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to create pharmacy:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 4. Update pending pharmacy details (restricted to super_admin and permitted platform_admin)
export async function updatePendingPharmacyAction(id: string, input: UpdatePharmacyInput) {
  const session = await getRequiredSession();
  const isSuperAdmin = session.user.role === "super_admin";
  const isPlatformWithPerm =
    session.user.role === "platform_admin" && session.user.canManagePharmacies;
  if (!isSuperAdmin && !isPlatformWithPerm) {
    return {
      success: false,
      error: "Unauthorized: Insufficient permissions to modify pharmacy details",
    };
  }

  const result = updatePharmacySchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const { name, slug, email, phone, address } = result.data;

  try {
    const oldPharmacy = await db.pharmacy.findUnique({
      where: { id },
    });

    if (!oldPharmacy) {
      return { success: false, error: "Pharmacy not found" };
    }

    if (oldPharmacy.status !== "PENDING") {
      return { success: false, error: "Only pending pharmacy details can be edited" };
    }

    // Unique checks excluding this record
    const existingEmail = await db.pharmacy.findFirst({
      where: { email, NOT: { id } },
    });
    if (existingEmail) {
      return { success: false, error: "Email is already registered by another pharmacy" };
    }

    const existingSlug = await db.pharmacy.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existingSlug) {
      return { success: false, error: "Slug/Subdomain is already taken by another pharmacy" };
    }

    const updated = await db.pharmacy.update({
      where: { id },
      data: { name, slug, email, phone, address },
    });

    // Log action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Pharmacy",
        entityId: id,
        changes: {
          before: { name: oldPharmacy.name, slug: oldPharmacy.slug, email: oldPharmacy.email },
          after: { name, slug, email },
        },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/pharmacies");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to update pending pharmacy:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 6. Create Platform Admin (restricted to super_admin)
import { z } from "zod";

const createPlatformAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  isDeveloper: z.boolean().default(false),
  canManagePharmacies: z.boolean().default(true),
  canManageSettings: z.boolean().default(false),
  canViewAuditLogs: z.boolean().default(false),
  canManageBookings: z.boolean().default(false),
  canManageIntegrations: z.boolean().default(false),
  canViewCommsLog: z.boolean().default(false),
  canManageAdmins: z.boolean().default(false),
});

export async function createPlatformAdminAction(input: any) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    return { success: false, error: "Unauthorized: Super Admin only" };
  }

  const result = createPlatformAdminSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const {
    name,
    email,
    password,
    isDeveloper,
    canManagePharmacies,
    canManageSettings,
    canViewAuditLogs,
    canManageBookings,
    canManageIntegrations,
    canViewCommsLog,
    canManageAdmins,
  } = result.data;

  try {
    const existingSuper = await db.superAdmin.findUnique({ where: { email } });
    const existingPlatform = await db.platformAdmin.findUnique({ where: { email } });
    const existingPharmacy = await db.pharmacy.findUnique({ where: { email } });

    if (existingSuper || existingPlatform || existingPharmacy) {
      return { success: false, error: "Email is already registered on the platform" };
    }

    const passwordHash = hashPassword(password);

    const platformAdmin = await db.platformAdmin.create({
      data: {
        name,
        email,
        passwordHash,
        isFirstLogin: true,
        isActive: true,
        isDeveloper,
        canManagePharmacies,
        canManageSettings,
        canViewAuditLogs,
        canManageBookings,
        canManageIntegrations,
        canViewCommsLog,
        canManageAdmins,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE",
        entityName: "PlatformAdmin",
        entityId: platformAdmin.id,
        changes: {
          name,
          email,
          isDeveloper,
          permissions: {
            canManagePharmacies,
            canManageSettings,
            canViewAuditLogs,
            canManageBookings,
            canManageIntegrations,
            canViewCommsLog,
            canManageAdmins,
          },
        },
      },
    });

    // Compile access list for email notifications
    const permissionsList: string[] = [];
    if (canManagePharmacies) permissionsList.push("Manage Clinics / Pharmacies");
    if (canManageBookings) permissionsList.push("Manage Bookings");
    if (canViewAuditLogs) permissionsList.push("View Audit Logs");
    if (canViewCommsLog) permissionsList.push("View Communications Logs");
    if (canManageIntegrations) permissionsList.push("Manage Third-Party Integrations");
    if (canManageSettings) permissionsList.push("Manage Global Settings");
    if (canManageAdmins) permissionsList.push("Manage Admins & Developers");

    await sendPlatformAdminCredentialsEmail(
      email,
      name,
      isDeveloper ? "Developer" : "Platform Admin",
      password,
      permissionsList
    );

    revalidatePath("/admin/platform-admins");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to create Platform Admin:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

const updatePlatformAdminSchema = z.object({
  id: z.string().uuid("Invalid ID"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  isDeveloper: z.boolean().default(false),
  canManagePharmacies: z.boolean().default(false),
  canManageSettings: z.boolean().default(false),
  canViewAuditLogs: z.boolean().default(false),
  canManageBookings: z.boolean().default(false),
  canManageIntegrations: z.boolean().default(false),
  canViewCommsLog: z.boolean().default(false),
  canManageAdmins: z.boolean().default(false),
});

export async function updatePlatformAdminAction(input: any) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    return { success: false, error: "Unauthorized: Super Admin only" };
  }

  const result = updatePlatformAdminSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const {
    id,
    name,
    email,
    isDeveloper,
    canManagePharmacies,
    canManageSettings,
    canViewAuditLogs,
    canManageBookings,
    canManageIntegrations,
    canViewCommsLog,
    canManageAdmins,
  } = result.data;

  try {
    const existing = await db.platformAdmin.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Account not found" };
    }

    if (existing.email !== email) {
      const emailTaken = await db.platformAdmin.findUnique({ where: { email } });
      if (emailTaken) {
        return { success: false, error: "Email is already taken" };
      }
    }

    await db.platformAdmin.update({
      where: { id },
      data: {
        name,
        email,
        isDeveloper,
        canManagePharmacies,
        canManageSettings,
        canViewAuditLogs,
        canManageBookings,
        canManageIntegrations,
        canViewCommsLog,
        canManageAdmins,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "PlatformAdmin",
        entityId: id,
        changes: {
          name,
          email,
          isDeveloper,
          permissions: {
            canManagePharmacies,
            canManageSettings,
            canViewAuditLogs,
            canManageBookings,
            canManageIntegrations,
            canViewCommsLog,
            canManageAdmins,
          },
        },
      },
    });

    revalidatePath("/admin/platform-admins");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to update Platform Admin:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
// 7. Toggle Platform Admin status (suspend / reactivate) — super_admin only
export async function togglePlatformAdminStatusAction(adminId: string, isActive: boolean) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    return { success: false, error: "Unauthorized: Super Admin only" };
  }

  try {
    const existing = await db.platformAdmin.findUnique({ where: { id: adminId } });
    if (!existing) {
      return { success: false, error: "Platform Admin not found" };
    }

    await db.platformAdmin.update({
      where: { id: adminId },
      data: { isActive },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "PlatformAdmin",
        entityId: adminId,
        changes: {
          isActive: { from: existing.isActive, to: isActive },
        },
      },
    });

    revalidatePath("/admin/platform-admins");
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to toggle Platform Admin status:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 8. Update / Generate Pharmacy Slug
export async function updatePharmacySlugAction(pharmacyId: string, slug: string) {
  const session = await getRequiredSession();
  const isSuperAdmin = session.user.role === "super_admin";
  const isPlatformWithPerm =
    session.user.role === "platform_admin" && session.user.canManagePharmacies;
  if (!isSuperAdmin && !isPlatformWithPerm) {
    return { success: false, error: "Unauthorized: Insufficient permissions to update slug" };
  }

  // Validate slug formatting
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return {
      success: false,
      error: "Slug must contain only lowercase alphanumeric characters and hyphens",
    };
  }

  try {
    const oldPharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!oldPharmacy) {
      return { success: false, error: "Pharmacy not found" };
    }

    // Check slug uniqueness
    const existingSlug = await db.pharmacy.findFirst({
      where: { slug, NOT: { id: pharmacyId } },
    });
    if (existingSlug) {
      return { success: false, error: "This URL slug is already taken" };
    }

    await db.pharmacy.update({
      where: { id: pharmacyId },
      data: { slug },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Pharmacy",
        entityId: pharmacyId,
        changes: {
          slug: { from: oldPharmacy.slug, to: slug },
        },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/pharmacies");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to update pharmacy slug:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
