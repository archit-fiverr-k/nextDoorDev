"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { uploadLogo, deleteLogo } from "@/lib/r2";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];

export async function updatePharmacyBrandingAction(formData: FormData) {
  const session = await getRequiredSession();
  const pharmacyId = formData.get("pharmacyId") as string;

  if (!pharmacyId) {
    return { success: false, error: "Pharmacy ID is required" };
  }

  // Tenant Boundary Check
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access to tenant settings" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  const displayName = formData.get("displayName") as string;
  const brandColor = formData.get("brandColor") as string;
  const logoFile = formData.get("logoFile") as File | null;

  // Validation
  if (brandColor && !/^#[0-9A-Fa-f]{6}$/.test(brandColor)) {
    return { success: false, error: "Brand color must be a valid hex color code (e.g. #2563eb)" };
  }

  try {
    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!pharmacy) {
      return { success: false, error: "Pharmacy not found" };
    }

    let newLogoUrl = pharmacy.logoUrl;

    if (logoFile && logoFile.size > 0) {
      // 1. File Size Validation
      if (logoFile.size > MAX_FILE_SIZE) {
        return { success: false, error: "Logo image size exceeds the maximum limit of 2MB" };
      }

      // 2. Format Validation
      if (!ALLOWED_MIME_TYPES.includes(logoFile.type)) {
        return { success: false, error: "Logo format must be PNG, JPG, or SVG" };
      }

      // 3. Delete existing logo safely if replacing
      if (pharmacy.logoUrl) {
        await deleteLogo(pharmacy.logoUrl);
      }

      // 4. Upload to R2 / Local Fallback
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      newLogoUrl = await uploadLogo(pharmacyId, buffer, logoFile.name, logoFile.type);
    }

    // Update database
    await db.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        displayName: displayName || null,
        brandColor: brandColor || null,
        logoUrl: newLogoUrl,
      },
    });

    // Record in Audit Log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "PharmacyBranding",
        entityId: pharmacyId,
        changes: {
          displayName,
          brandColor,
          logoUrl: newLogoUrl,
        },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}`);
    revalidatePath(`/pharmacy/${pharmacyId}/branding`);
    revalidatePath(`/book/${pharmacy.slug}`);

    return { success: true, logoUrl: newLogoUrl };
  } catch (error) {
    console.error("❌ Failed to update branding:", error);
    return { success: false, error: "An unexpected error occurred during save" };
  }
}
