"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { uploadLogo, deleteLogo } from "@/lib/r2";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  pharmacyId: z.string().uuid("Invalid Pharmacy ID"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .optional()
    .or(z.literal("")),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #2563eb)")
    .optional()
    .or(z.literal("")),
  phone: z.string().min(5, "Invalid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  email: z.string().email("Invalid email address"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  googleMapsUrl: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  welcomeMessage: z.string().optional().or(z.literal("")),
  seoTitle: z.string().optional().or(z.literal("")),
  seoDescription: z.string().optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export async function updateClinicProfileAction(formData: FormData) {
  const session = await getRequiredSession();
  const pharmacyId = formData.get("pharmacyId") as string;

  if (!pharmacyId) {
    return { success: false, error: "Pharmacy ID is required" };
  }

  // Tenant Isolation Security Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access to tenant settings" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  // Extract text fields
  const displayName = formData.get("displayName") as string;
  const brandColor = formData.get("brandColor") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const email = formData.get("email") as string;
  const website = formData.get("website") as string;
  const facebookUrl = formData.get("facebookUrl") as string;
  const twitterUrl = formData.get("twitterUrl") as string;
  const instagramUrl = formData.get("instagramUrl") as string;
  const linkedinUrl = formData.get("linkedinUrl") as string;
  const googleMapsUrl = formData.get("googleMapsUrl") as string;
  const description = formData.get("description") as string;
  const welcomeMessage = formData.get("welcomeMessage") as string;
  const seoTitle = formData.get("seoTitle") as string;
  const seoDescription = formData.get("seoDescription") as string;

  // Validate text parameters using Zod
  const result = profileSchema.safeParse({
    pharmacyId,
    displayName,
    brandColor,
    phone,
    address,
    email,
    website,
    facebookUrl,
    twitterUrl,
    instagramUrl,
    linkedinUrl,
    googleMapsUrl,
    description,
    welcomeMessage,
    seoTitle,
    seoDescription,
  });

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed: " + result.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!pharmacy) {
      return { success: false, error: "Pharmacy not found" };
    }

    // 1. Handle Logo file upload (if present)
    const logoFile = formData.get("logoFile") as File | null;
    let newLogoUrl = pharmacy.logoUrl;

    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 2 * 1024 * 1024) {
        return { success: false, error: "Logo image must be smaller than 2MB" };
      }
      if (pharmacy.logoUrl) {
        await deleteLogo(pharmacy.logoUrl);
      }
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      newLogoUrl = await uploadLogo(pharmacyId, buffer, logoFile.name, logoFile.type);
    }

    // 2. Handle Gallery files upload (if present)
    // We accept multiple files under "galleryFiles"
    const galleryFiles = formData.getAll("galleryFiles") as File[];
    const uploadedGalleryUrls: string[] = [...(pharmacy.gallery || [])];

    for (const file of galleryFiles) {
      if (file && file.size > 0) {
        if (file.size > 3 * 1024 * 1024) {
          return { success: false, error: "Gallery image must be smaller than 3MB" };
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        // Upload via uploadLogo helper (falls back to local uploads/logos)
        const url = await uploadLogo(pharmacyId, buffer, file.name, file.type);
        uploadedGalleryUrls.push(url);
      }
    }

    // Handle delete images requested (if present)
    const deleteGalleryUrls = formData.getAll("deleteGalleryUrls") as string[];
    const filteredGalleryUrls = uploadedGalleryUrls.filter((url) => {
      if (deleteGalleryUrls.includes(url)) {
        // Safe delete
        deleteLogo(url).catch((err) => console.error("Gallery delete error:", err));
        return false;
      }
      return true;
    });

    // 3. Update Pharmacy Profile settings
    const updated = await db.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        displayName: displayName || null,
        brandColor: brandColor || null,
        logoUrl: newLogoUrl,
        phone,
        address,
        email,
        website: website || null,
        facebookUrl: facebookUrl || null,
        twitterUrl: twitterUrl || null,
        instagramUrl: instagramUrl || null,
        linkedinUrl: linkedinUrl || null,
        googleMapsUrl: googleMapsUrl || null,
        description: description || null,
        welcomeMessage: welcomeMessage || null,
        gallery: filteredGalleryUrls,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      },
    });

    // 4. Create Audit Log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "PharmacyProfile",
        entityId: pharmacyId,
        changes: {
          displayName,
          brandColor,
          logoUrl: newLogoUrl,
          phone,
          address,
          email,
          website,
          description,
          galleryCount: filteredGalleryUrls.length,
        },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}`);
    revalidatePath(`/pharmacy/${pharmacyId}/branding`);
    revalidatePath(`/pharmacy/${pharmacyId}/profile`);
    revalidatePath(`/book/${pharmacy.slug}`);

    return {
      success: true,
      logoUrl: newLogoUrl,
      gallery: filteredGalleryUrls,
    };
  } catch (error: any) {
    console.error("❌ Failed to update pharmacy profile:", error);
    return { success: false, error: error.message || "An unexpected error occurred during save" };
  }
}
