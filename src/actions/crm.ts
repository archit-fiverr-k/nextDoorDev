"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// 1. Create Patient CRM Note
export async function createCRMNoteAction(
  pharmacyId: string,
  customerId: string,
  noteText: string,
  type: string = "CLINICAL",
  tags: string = ""
) {
  const session = await getRequiredSession();

  // Tenant Boundary Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacyId) {
    return { success: false, error: "Unauthorized access" };
  }
  if (!isTenantUser && !isPlatformAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  if (!noteText.trim()) {
    return { success: false, error: "Note content cannot be empty" };
  }

  try {
    const note = await db.cRMNote.create({
      data: {
        pharmacyId,
        customerId,
        note: noteText,
        type,
        tags: tags || null,
        createdById: session.user.id,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE",
        entityName: "CRMNote",
        entityId: note.id,
        changes: { noteText, type, tags },
      },
    });

    revalidatePath(`/pharmacy/${pharmacyId}/crm/${customerId}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to create CRM note:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 2. Update Patient CRM Note
export async function updateCRMNoteAction(
  noteId: string,
  noteText: string,
  type: string = "CLINICAL",
  tags: string = ""
) {
  const session = await getRequiredSession();

  if (!noteText.trim()) {
    return { success: false, error: "Note content cannot be empty" };
  }

  try {
    const note = await db.cRMNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return { success: false, error: "Note not found" };
    }

    // Tenant Boundary Guard
    const isTenantUser = session.user.role === "pharmacy";
    const isPlatformAdmin =
      session.user.role === "super_admin" || session.user.role === "platform_admin";

    if (isTenantUser && session.user.pharmacyId !== note.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }
    if (!isTenantUser && !isPlatformAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    await db.cRMNote.update({
      where: { id: noteId },
      data: {
        note: noteText,
        type,
        tags: tags || null,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        pharmacyId: note.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "CRMNote",
        entityId: noteId,
        changes: { noteText, type, tags },
      },
    });

    revalidatePath(`/pharmacy/${note.pharmacyId}/crm/${note.customerId}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to update CRM note:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}

// 3. Delete Patient CRM Note
export async function deleteCRMNoteAction(noteId: string) {
  const session = await getRequiredSession();

  try {
    const note = await db.cRMNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return { success: false, error: "Note not found" };
    }

    // Tenant Boundary Guard
    const isTenantUser = session.user.role === "pharmacy";
    const isPlatformAdmin =
      session.user.role === "super_admin" || session.user.role === "platform_admin";

    if (isTenantUser && session.user.pharmacyId !== note.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }
    if (!isTenantUser && !isPlatformAdmin) {
      return { success: false, error: "Unauthorized" };
    }

    await db.cRMNote.delete({
      where: { id: noteId },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        pharmacyId: note.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE",
        entityName: "CRMNote",
        entityId: noteId,
        changes: { deleted: true },
      },
    });

    revalidatePath(`/pharmacy/${note.pharmacyId}/crm/${note.customerId}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to delete CRM note:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 4. Update Patient Tags
export async function updateCustomerTagsAction(customerId: string, tags: string) {
  const session = await getRequiredSession();

  try {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return { success: false, error: "Patient not found" };
    }

    // Tenant Boundary Guard
    const isTenantUser = session.user.role === "pharmacy";
    if (isTenantUser && session.user.pharmacyId !== customer.pharmacyId) {
      return { success: false, error: "Unauthorized access" };
    }

    await db.customer.update({
      where: { id: customerId },
      data: {
        tags: tags || null,
      },
    });

    // Audit Log
    await db.auditLog.create({
      data: {
        pharmacyId: customer.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "CustomerTags",
        entityId: customerId,
        changes: { tags },
      },
    });

    revalidatePath(`/pharmacy/${customer.pharmacyId}/crm/${customerId}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to update patient tags:", error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
}
