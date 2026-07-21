"use server";

import { db } from "@/lib/db";
import { getSession, assertRole } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Schema ──────────────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().min(5, "Phone number is too short"),
  gender: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8),
});

const notificationPrefsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  whatsappNotifications: z.boolean(),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getPatientCustomer(customerId: string, email?: string | null) {
  let customer = await db.customer.findFirst({
    where: { id: customerId },
  });

  if (!customer && email) {
    customer = await db.customer.findFirst({
      where: { email },
    });
  }

  return customer;
}

// ── Actions ─────────────────────────────────────────────────────────────────

/**
 * Get the authenticated patient's profile data.
 */
export async function getPatientProfileAction() {
  const session = await assertRole(["patient"]);
  const customer = await getPatientCustomer(session.user.id, session.user.email);
  if (!customer) {
    return {
      success: true,
      data: {
        id: session.user.id,
        firstName: session.user.name?.split(" ")[0] || "Patient",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        email: session.user.email || "",
        phone: "",
        address: "",
        gender: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        dateOfBirth: null,
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: false,
      },
    };
  }
  return { success: true, data: customer };
}

/**
 * Update the authenticated patient's profile fields.
 */
export async function updatePatientProfileAction(data: unknown) {
  const session = await assertRole(["patient"]);
  const result = updateProfileSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const {
    firstName,
    lastName,
    phone,
    gender,
    address,
    emergencyContactName,
    emergencyContactPhone,
    dateOfBirth,
  } = result.data;

  try {
    const customer = await getPatientCustomer(session.user.id, session.user.email);
    if (customer) {
      await db.customer.update({
        where: { id: customer.id },
        data: {
          firstName,
          lastName,
          phone,
          gender: gender ?? null,
          address: address ?? null,
          emergencyContactName: emergencyContactName ?? null,
          emergencyContactPhone: emergencyContactPhone ?? null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "PatientProfile",
        entityId: customer?.id || session.user.id,
        changes: { fields: Object.keys(result.data) },
      },
    });

    revalidatePath("/patient/profile");
    return { success: true };
  } catch (error: any) {
    console.error("❌ updatePatientProfileAction error:", error);
    return { success: false, error: error.message || "Failed to update profile" };
  }
}

/**
 * Update password for patient account.
 */
export async function updatePatientPasswordAction(data: unknown) {
  const session = await assertRole(["patient"]);
  const result = updatePasswordSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const { currentPassword, newPassword, confirmPassword } = result.data;
  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  try {
    const customer = await getPatientCustomer(session.user.id, session.user.email);
    if (!customer || !customer.passwordHash) {
      return { success: false, error: "Account password not set" };
    }

    const isValid = verifyPassword(currentPassword, customer.passwordHash);
    if (!isValid) {
      return { success: false, error: "Current password is incorrect" };
    }

    const newHash = hashPassword(newPassword);
    await db.customer.update({
      where: { id: customer.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ updatePatientPasswordAction error:", error);
    return { success: false, error: error.message || "Failed to update password" };
  }
}

/**
 * Update notification preferences.
 */
export async function updateNotificationPrefsAction(data: unknown) {
  const session = await assertRole(["patient"]);
  const result = notificationPrefsSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "Validation failed" };
  }

  try {
    const customer = await getPatientCustomer(session.user.id, session.user.email);
    if (customer) {
      await db.customer.update({
        where: { id: customer.id },
        data: result.data,
      });
    }

    revalidatePath("/patient/settings");
    return { success: true };
  } catch (error: any) {
    console.error("❌ updateNotificationPrefsAction error:", error);
    return { success: false, error: error.message || "Failed to update notification preferences" };
  }
}

export const updatePatientNotificationPrefsAction = updateNotificationPrefsAction;

/**
 * Search providers/pharmacies for patient search page.
 */
export async function searchProvidersAction(params: { service?: string; location?: string }) {
  try {
    const where: any = {
      status: "APPROVED",
    };

    if (params.location) {
      where.OR = [
        { address: { contains: params.location, mode: "insensitive" } },
        { name: { contains: params.location, mode: "insensitive" } },
      ];
    }

    if (params.service) {
      where.services = {
        some: {
          name: { contains: params.service, mode: "insensitive" },
          isActive: true,
        },
      };
    }

    const pharmacies = await db.pharmacy.findMany({
      where,
      include: {
        services: { where: { isActive: true }, select: { name: true, price: true, color: true } },
        availability: { select: { dayOfWeek: true, openTime: true, closeTime: true } },
      },
      take: 50,
    });

    return {
      success: true,
      data: pharmacies.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        address: p.address,
        logoUrl: p.logoUrl,
        description: p.description,
        services: p.services.map((s) => ({ ...s, price: Number(s.price) })),
        availability: p.availability,
      })),
    };
  } catch (error: any) {
    console.error("❌ searchProvidersAction error:", error);
    return { success: false, error: error.message || "Failed to search providers", data: [] };
  }
}

/**
 * Get provider detail by slug for patient detail view.
 */
export async function getProviderBySlugAction(slug: string) {
  try {
    const pharmacy = await db.pharmacy.findUnique({
      where: { slug, status: "APPROVED" },
      include: {
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            color: true,
          },
        },
        availability: { select: { dayOfWeek: true, openTime: true, closeTime: true } },
      },
    });

    if (!pharmacy) {
      return { success: false, error: "Pharmacy not found" };
    }

    return {
      success: true,
      data: {
        ...pharmacy,
        services: pharmacy.services.map((s) => ({ ...s, price: Number(s.price) })),
      },
    };
  } catch (error: any) {
    console.error("❌ getProviderBySlugAction error:", error);
    return { success: false, error: error.message || "Failed to load provider details" };
  }
}
