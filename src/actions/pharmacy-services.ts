"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface PharmacyMasterServiceInput {
  masterServiceId: string;
  enabled: boolean;
  priceOverride?: number | null;
  doseCourse?: string | null;
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

/**
 * Update or Toggle a single Master Service for a Pharmacy Branch
 */
export async function updatePharmacyServiceStatusAction(
  tenantIdOrSlug: string,
  input: PharmacyMasterServiceInput
) {
  const session = await getRequiredSession();
  const isParamUuid = isUuid(tenantIdOrSlug);

  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: tenantIdOrSlug }, { slug: tenantIdOrSlug }] }
      : { slug: tenantIdOrSlug },
  });

  if (!pharmacy) {
    return { success: false, error: "Pharmacy clinic not found" };
  }

  // Tenant Security Check
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacy.id) {
    return { success: false, error: "Unauthorized pharmacy access" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized access" };
  }

  const pharmacyId = pharmacy.id;

  try {
    const masterService = await db.masterService.findUnique({
      where: { id: input.masterServiceId },
      include: { category: true },
    });

    if (!masterService) {
      return { success: false, error: "Master service not found" };
    }

    const effectivePrice =
      masterService.serviceType === "NHS"
        ? 0
        : input.priceOverride !== undefined && input.priceOverride !== null
          ? input.priceOverride
          : Number(masterService.defaultPrice);

    // 1. Upsert PharmacyService record
    const pharmacyService = await db.pharmacyService.upsert({
      where: {
        pharmacyId_masterServiceId: {
          pharmacyId,
          masterServiceId: masterService.id,
        },
      },
      update: {
        enabled: input.enabled,
        priceOverride: effectivePrice,
        internalNotes: input.doseCourse || null,
        bookingEnabled: input.enabled,
      },
      create: {
        pharmacyId,
        masterServiceId: masterService.id,
        enabled: input.enabled,
        priceOverride: effectivePrice,
        internalNotes: input.doseCourse || null,
        bookingEnabled: input.enabled,
      },
    });

    // 2. Sync corresponding bookable Service record
    const existingService = await db.service.findFirst({
      where: {
        pharmacyId,
        name: masterService.name,
      },
    });

    if (existingService) {
      await db.service.update({
        where: { id: existingService.id },
        data: {
          price: effectivePrice,
          isActive: input.enabled,
          category: masterService.category.name,
          description: masterService.description || masterService.shortDescription || null,
          prepNotes: masterService.preparation || null,
          instructions: masterService.aftercare || null,
          status: input.enabled ? "ACTIVE" : "DISABLED",
        },
      });
    } else if (input.enabled) {
      await db.service.create({
        data: {
          pharmacyId,
          name: masterService.name,
          description: masterService.description || masterService.shortDescription || null,
          duration: 15,
          price: effectivePrice,
          isActive: true,
          category: masterService.category.name,
          prepNotes: masterService.preparation || null,
          instructions: masterService.aftercare || null,
          status: "ACTIVE",
          color: masterService.serviceType === "NHS" ? "#10b981" : "#3b82f6",
        },
      });
    }

    revalidatePath(`/pharmacy/${pharmacy.slug || pharmacy.id}/services`);
    revalidatePath(`/pharmacy/${pharmacy.id}/services`);

    return {
      success: true,
      service: pharmacyService,
    };
  } catch (err: any) {
    console.error("Error updating pharmacy service status:", err);
    return {
      success: false,
      error: err.message || "Failed to update pharmacy service configuration",
    };
  }
}

/**
 * Bulk save all modified Master Services for a Pharmacy Branch
 */
export async function bulkSavePharmacyServicesAction(
  tenantIdOrSlug: string,
  items: PharmacyMasterServiceInput[]
) {
  const session = await getRequiredSession();
  const isParamUuid = isUuid(tenantIdOrSlug);

  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: tenantIdOrSlug }, { slug: tenantIdOrSlug }] }
      : { slug: tenantIdOrSlug },
  });

  if (!pharmacy) {
    return { success: false, error: "Pharmacy clinic not found" };
  }

  // Tenant Security Check
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacy.id) {
    return { success: false, error: "Unauthorized pharmacy access" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized access" };
  }

  let updatedCount = 0;
  for (const item of items) {
    const res = await updatePharmacyServiceStatusAction(pharmacy.id, item);
    if (res.success) updatedCount++;
  }

  revalidatePath(`/pharmacy/${pharmacy.slug || pharmacy.id}/services`);
  revalidatePath(`/pharmacy/${pharmacy.id}/services`);

  return {
    success: true,
    updatedCount,
  };
}
