"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { sendProviderRegistrationNotification } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2, "Business name is too short"),
  slug: z
    .string()
    .min(2, "URL slug is too short")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  displayName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(5, "Phone number is too short"),
  address: z.string().min(5, "Address details are too short"),
  availability: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      openTime: z.string(),
      closeTime: z.string(),
      isClosed: z.boolean(),
    })
  ),
  documentName: z.string().min(2, "Verification document is required"),
  documentRef: z.string().min(2, "Reference number is required"),
  subscriptionPlan: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export async function registerProviderAction(input: RegisterInput) {
  try {
    // 1. Validate inputs via Zod
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const {
      name,
      slug,
      displayName,
      email,
      password,
      phone,
      address,
      availability,
      documentName,
      documentRef,
      subscriptionPlan,
    } = parsed.data;

    // 2. Uniqueness Checks: Email & Slug
    const existingEmail = await db.pharmacy.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return {
        success: false,
        error: "A pharmacy account with this email address already exists",
      };
    }

    const existingSlug = await db.pharmacy.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      return {
        success: false,
        error: "A pharmacy workspace with this URL slug already exists",
      };
    }

    // 3. Hash login password
    const passwordHash = hashPassword(password);

    // 4. Create Pharmacy in a database transaction
    const result = await db.$transaction(async (tx) => {
      // Create pharmacy record
      const pharmacy = await tx.pharmacy.create({
        data: {
          name,
          slug,
          email,
          phone,
          address,
          passwordHash,
          displayName: displayName || name,
          brandColor: "#10b981", // default emerald brand color
          status: "PENDING", // status defaults to PENDING for review
          isFirstLogin: true,
        },
      });

      // Create opening availability roster (excluding closed days)
      const availabilityRecords = availability
        .filter((day) => !day.isClosed)
        .map((day) => ({
          pharmacyId: pharmacy.id,
          dayOfWeek: day.dayOfWeek,
          openTime: day.openTime,
          closeTime: day.closeTime,
        }));

      if (availabilityRecords.length > 0) {
        await tx.availability.createMany({
          data: availabilityRecords,
        });
      }

      // 5. Generate Audit Log to audit provider registration
      await tx.auditLog.create({
        data: {
          pharmacyId: pharmacy.id,
          action: "CREATE",
          entityName: "Pharmacy",
          entityId: pharmacy.id,
          changes: {
            name: pharmacy.name,
            slug: pharmacy.slug,
            status: "PENDING",
            documentName,
            documentRef,
            subscriptionPlan,
          },
          ipAddress: "System Registration",
        },
      });

      return pharmacy;
    });

    // Notify Super Admin of provider registration
    await sendProviderRegistrationNotification({
      pharmacyName: name,
      email,
      phone,
    });

    return {
      success: true,
      pharmacyId: result.id,
    };
  } catch (err: any) {
    console.error("Provider Registration Action error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during registration",
    };
  }
}
