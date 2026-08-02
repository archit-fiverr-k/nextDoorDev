"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { uploadLogo } from "@/lib/r2";
import { revalidatePath } from "next/cache";

export interface DayScheduleInput {
  dayOfWeek: number; // 0=Sunday, 1=Monday ... 6=Saturday
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "18:00"
}

export async function saveFirstTimeOnboardingAction(formData: FormData) {
  try {
    const session = await getRequiredSession();
    const pharmacyId = formData.get("pharmacyId") as string;

    if (!pharmacyId) {
      return { success: false, error: "Pharmacy ID is required" };
    }

    // Security check
    const isTenantUser = session.user.role === "pharmacy";
    const isPlatformAdmin =
      session.user.role === "super_admin" || session.user.role === "platform_admin";

    if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
      return { success: false, error: "Unauthorized tenant access" };
    }
    if (!isTenantUser && !isPlatformAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    if (!pharmacy) {
      return { success: false, error: "Pharmacy workspace not found" };
    }

    const email = (formData.get("email") as string) || pharmacy.email;
    const phone = (formData.get("phone") as string) || pharmacy.phone;
    const logoFile = formData.get("logoFile") as File | null;

    // Handle Logo file upload if provided
    let logoUrl = pharmacy.logoUrl;
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 3 * 1024 * 1024) {
        return { success: false, error: "Logo image must be smaller than 3MB" };
      }
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      logoUrl = await uploadLogo(pharmacyId, buffer, logoFile.name, logoFile.type);
    }

    // Parse opening hours JSON
    const hoursJson = formData.get("openingHours") as string;
    let openingHours: DayScheduleInput[] = [];
    if (hoursJson) {
      try {
        openingHours = JSON.parse(hoursJson);
      } catch (err) {
        console.error("Failed to parse opening hours JSON:", err);
      }
    }

    // 1. Update Pharmacy record & mark isFirstLogin = false
    await db.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        email,
        phone,
        logoUrl,
        isFirstLogin: false,
      },
    });

    // 2. Save Availability schedules
    if (openingHours.length > 0) {
      await db.availability.deleteMany({
        where: { pharmacyId },
      });

      const openDays = openingHours.filter((d) => d.isOpen);
      for (const day of openDays) {
        await db.availability.create({
          data: {
            pharmacyId,
            dayOfWeek: day.dayOfWeek,
            openTime: day.openTime,
            closeTime: day.closeTime,
          },
        });
      }
    }

    revalidatePath(`/pharmacy/${pharmacyId}`);
    if (pharmacy.slug) {
      revalidatePath(`/book/${pharmacy.slug}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ saveFirstTimeOnboardingAction Error:", error);
    return {
      success: false,
      error: error.message || "Failed to complete first time onboarding.",
    };
  }
}
