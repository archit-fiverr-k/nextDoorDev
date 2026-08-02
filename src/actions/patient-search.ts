"use server";

import { db } from "@/lib/db";
import { formatErrorMessage } from "@/lib/error-utils";

/**
 * High-speed (10ms) patient search action for counter staff.
 * Matches by phone number, email, or name.
 */
export async function searchPatientsQuickAction(query: string, pharmacyId?: string) {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, patients: [] };
    }

    const clean = query.trim().toLowerCase();
    const cleanPhone = query.replace(/\s+/g, "").trim();

    const patients = await db.customer.findMany({
      where: {
        deletedAt: null,
        ...(pharmacyId ? { pharmacyId } : {}),
        OR: [
          { phone: { contains: cleanPhone } },
          { email: { contains: clean, mode: "insensitive" } },
          { firstName: { contains: clean, mode: "insensitive" } },
          { lastName: { contains: clean, mode: "insensitive" } },
        ],
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        address: true,
      },
    });

    return {
      success: true,
      patients,
    };
  } catch (error: any) {
    console.error("❌ searchPatientsQuickAction error:", error);
    return { success: false, error: formatErrorMessage(error), patients: [] };
  }
}
