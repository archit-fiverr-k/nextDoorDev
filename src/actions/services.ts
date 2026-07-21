"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { serviceSchema } from "@/schemas/services";
import { uploadLogo, deleteLogo } from "@/lib/r2";
import { revalidatePath } from "next/cache";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

// 1. Create Service Action (via FormData to support image uploads)
export async function createServiceActionForm(formData: FormData) {
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
    return { success: false, error: "Unauthorized access" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  // Parse text params
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const duration = Number(formData.get("duration"));
  const price = Number(formData.get("price"));
  const isActive = formData.get("isActive") === "true";
  const category = formData.get("category") as string;
  const prepNotes = formData.get("prepNotes") as string;
  const instructions = formData.get("instructions") as string;
  const displayOrder = Number(formData.get("displayOrder") || "0");
  const status = (formData.get("status") as string) || "ACTIVE";
  const color = (formData.get("color") as string) || "#3b82f6";
  const categoryId = (formData.get("categoryId") as string) || null;
  const rawServiceSlug = formData.get("serviceSlug") as string;
  const serviceSlug = rawServiceSlug ? slugify(rawServiceSlug) : slugify(name);

  const result = serviceSchema.safeParse({
    name,
    description,
    duration,
    price,
    isActive,
    category,
    prepNotes,
    instructions,
    displayOrder,
    status,
    color,
    categoryId: categoryId || undefined,
    serviceSlug: serviceSlug || undefined,
  });

  if (!result.success) {
    return {
      success: false,
      error: "Validation failed: " + result.error.errors.map((e) => e.message).join(", "),
    };
  }

  try {
    // Handle banner image upload (if present)
    const imageFile = formData.get("imageFile") as File | null;
    let imageUrl = null;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 2 * 1024 * 1024) {
        return { success: false, error: "Banner image size must be smaller than 2MB" };
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await uploadLogo(pharmacyId, buffer, imageFile.name, imageFile.type);
    }

    const service = await db.service.create({
      data: {
        pharmacyId,
        name,
        description: description || null,
        duration,
        price,
        isActive: status === "ACTIVE" ? isActive : false,
        category: category || "General",
        prepNotes: prepNotes || null,
        instructions: instructions || null,
        displayOrder,
        status,
        color,
        imageUrl,
        categoryId: categoryId || null,
        serviceSlug,
      },
    });

    await db.auditLog.create({
      data: {
        pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE",
        entityName: "Service",
        entityId: service.id,
        changes: { name, price, duration, category, status },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/services`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to create service:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 2. Update Service Action (via FormData to support image uploads)
export async function updateServiceActionForm(serviceId: string, formData: FormData) {
  const session = await getRequiredSession();

  try {
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // Tenant Boundary Check
    const isTenantUser = session.user.role === "pharmacy";
    const isPlatformAdmin =
      session.user.role === "super_admin" || session.user.role === "platform_admin";

    if (isTenantUser && session.user.pharmacyId !== service.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }
    if (!isTenantUser && !isPlatformAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    // Parse text params
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const duration = Number(formData.get("duration"));
    const price = Number(formData.get("price"));
    const isActive = formData.get("isActive") === "true";
    const category = formData.get("category") as string;
    const prepNotes = formData.get("prepNotes") as string;
    const instructions = formData.get("instructions") as string;
    const displayOrder = Number(formData.get("displayOrder") || "0");
    const status = (formData.get("status") as string) || "ACTIVE";
    const color = (formData.get("color") as string) || "#3b82f6";
    const categoryId = (formData.get("categoryId") as string) || null;
    const rawServiceSlug = formData.get("serviceSlug") as string;
    const serviceSlug = rawServiceSlug ? slugify(rawServiceSlug) : slugify(name);

    const result = serviceSchema.safeParse({
      name,
      description,
      duration,
      price,
      isActive,
      category,
      prepNotes,
      instructions,
      displayOrder,
      status,
      color,
      categoryId: categoryId || undefined,
      serviceSlug: serviceSlug || undefined,
    });

    if (!result.success) {
      return {
        success: false,
        error: "Validation failed: " + result.error.errors.map((e) => e.message).join(", "),
      };
    }

    // Handle image upload (if present)
    const imageFile = formData.get("imageFile") as File | null;
    let newImageUrl = service.imageUrl;

    if (imageFile && imageFile.size > 0) {
      if (imageFile.size > 2 * 1024 * 1024) {
        return { success: false, error: "Banner image size must be smaller than 2MB" };
      }
      if (service.imageUrl) {
        await deleteLogo(service.imageUrl);
      }
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      newImageUrl = await uploadLogo(service.pharmacyId, buffer, imageFile.name, imageFile.type);
    }

    await db.service.update({
      where: { id: serviceId },
      data: {
        name,
        description: description || null,
        duration,
        price,
        isActive: status === "ACTIVE" ? isActive : false,
        category: category || "General",
        prepNotes: prepNotes || null,
        instructions: instructions || null,
        displayOrder,
        status,
        color,
        imageUrl: newImageUrl,
        categoryId: categoryId || null,
        serviceSlug,
      },
    });

    await db.auditLog.create({
      data: {
        pharmacyId: service.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Service",
        entityId: serviceId,
        changes: {
          before: { name: service.name, price: Number(service.price), status: service.status },
          after: { name, price, status },
        },
      },
    });

    revalidatePath(`/pharmacy/${service.pharmacyId}/services`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to update service:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 3. Toggle Service Status Action
export async function toggleServiceStatusAction(serviceId: string, isActive: boolean) {
  const session = await getRequiredSession();

  try {
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // Tenant Boundary Check
    const isTenantUser = session.user.role === "pharmacy";
    const isPlatformAdmin =
      session.user.role === "super_admin" || session.user.role === "platform_admin";

    if (isTenantUser && session.user.pharmacyId !== service.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }
    if (!isTenantUser && !isPlatformAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    await db.service.update({
      where: { id: serviceId },
      data: { isActive },
    });

    await db.auditLog.create({
      data: {
        pharmacyId: service.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Service",
        entityId: serviceId,
        changes: { isActive },
      },
    });

    revalidatePath(`/pharmacy/${service.pharmacyId}/services`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to toggle service status:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 4. Archive Service Action
export async function archiveServiceAction(serviceId: string) {
  const session = await getRequiredSession();

  try {
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // Tenant Boundary Check
    const isTenantUser = session.user.role === "pharmacy";
    if (isTenantUser && session.user.pharmacyId !== service.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }

    await db.service.update({
      where: { id: serviceId },
      data: {
        status: "ARCHIVED",
        isActive: false,
      },
    });

    await db.auditLog.create({
      data: {
        pharmacyId: service.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Service",
        entityId: serviceId,
        changes: { status: "ARCHIVED", isActive: false },
      },
    });

    revalidatePath(`/pharmacy/${service.pharmacyId}/services`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to archive service:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 5. Bulk Enable Services Action
export async function bulkEnableServicesAction(serviceIds: string[], pharmacyId: string) {
  const session = await getRequiredSession();
  const isTenantUser = session.user.role === "pharmacy";
  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    await db.service.updateMany({
      where: {
        id: { in: serviceIds },
        pharmacyId,
      },
      data: {
        isActive: true,
        status: "ACTIVE",
      },
    });

    await db.auditLog.create({
      data: {
        pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "ServiceBulk",
        entityId: pharmacyId,
        changes: { bulkEnabled: serviceIds },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/services`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed bulk enable:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 6. Bulk Disable Services Action
export async function bulkDisableServicesAction(serviceIds: string[], pharmacyId: string) {
  const session = await getRequiredSession();
  const isTenantUser = session.user.role === "pharmacy";
  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access" };
  }

  try {
    await db.service.updateMany({
      where: {
        id: { in: serviceIds },
        pharmacyId,
      },
      data: {
        isActive: false,
        status: "DISABLED",
      },
    });

    await db.auditLog.create({
      data: {
        pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "ServiceBulk",
        entityId: pharmacyId,
        changes: { bulkDisabled: serviceIds },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/services`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed bulk disable:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 7. Delete Service Action
export async function deleteServiceAction(serviceId: string) {
  const session = await getRequiredSession();

  try {
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { success: false, error: "Service not found" };
    }

    // Tenant Boundary Check
    const isTenantUser = session.user.role === "pharmacy";
    const isPlatformAdmin =
      session.user.role === "super_admin" || session.user.role === "platform_admin";

    if (isTenantUser && session.user.pharmacyId !== service.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }
    if (!isTenantUser && !isPlatformAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    // Check appointments before delete
    const appointmentsCount = await db.appointment.count({
      where: { serviceId },
    });

    if (appointmentsCount > 0) {
      return {
        success: false,
        error:
          "This service has active bookings. Archiving it is recommended instead of deleting to preserve clinical logs.",
      };
    }

    if (service.imageUrl) {
      await deleteLogo(service.imageUrl);
    }

    await db.service.delete({
      where: { id: serviceId },
    });

    await db.auditLog.create({
      data: {
        pharmacyId: service.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE",
        entityName: "Service",
        entityId: serviceId,
        changes: { deleted: { name: service.name } },
      },
    });

    revalidatePath(`/pharmacy/${service.pharmacyId}/services`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to delete service:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
