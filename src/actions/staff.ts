"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

export async function getPharmacyStaffAction(pharmacyId: string) {
  try {
    const staff = await db.staff.findMany({
      where: { pharmacyId },
      include: {
        staffAvailability: true,
        leaveRequests: {
          where: { status: "APPROVED" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      staff: staff.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        isActive: s.isActive,
        availability: s.staffAvailability.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          openTime: a.openTime,
          closeTime: a.closeTime,
        })),
        leaveRequests: s.leaveRequests.map((l) => ({
          id: l.id,
          startDate: l.startDate.toISOString(),
          endDate: l.endDate.toISOString(),
          reason: l.reason,
        })),
      })),
    };
  } catch (error: any) {
    console.error("❌ getPharmacyStaffAction error:", error);
    return { success: false, error: "Failed to fetch staff practitioners" };
  }
}

export async function createStaffMemberAction(data: {
  pharmacyId: string;
  name: string;
  email: string;
  password?: string;
  role?: string;
}) {
  try {
    if (!data.name || !data.email) {
      return { success: false, error: "Practitioner name and email are required" };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await db.staff.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return { success: false, error: "Staff account with this email already exists" };
    }

    const defaultPass = data.password || "PractitionerPass123!";
    const passwordHash = hashPassword(defaultPass);

    const member = await db.staff.create({
      data: {
        pharmacyId: data.pharmacyId,
        name: data.name.trim(),
        email: cleanEmail,
        passwordHash,
        role: data.role || "pharmacist",
        isActive: true,
      },
    });

    // Default Monday-Friday 09:00 - 18:00 availability
    const defaultDays = [1, 2, 3, 4, 5];
    await db.staffAvailability.createMany({
      data: defaultDays.map((d) => ({
        staffId: member.id,
        dayOfWeek: d,
        openTime: "09:00",
        closeTime: "18:00",
      })),
    });

    revalidatePath(`/admin/calendar`);
    return { success: true, data: member };
  } catch (error: any) {
    console.error("❌ createStaffMemberAction error:", error);
    return { success: false, error: "Failed to create staff practitioner" };
  }
}

export async function submitLeaveRequestAction(data: {
  staffId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  try {
    const leave = await db.leaveRequest.create({
      data: {
        staffId: data.staffId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason || null,
        status: "APPROVED",
      },
    });

    return { success: true, data: leave };
  } catch (error: any) {
    console.error("❌ submitLeaveRequestAction error:", error);
    return { success: false, error: "Failed to submit leave request" };
  }
}

export async function assignAppointmentPractitionerAction(appointmentId: string, staffId: string) {
  try {
    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: { staffId },
    });

    revalidatePath(`/admin/bookings`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("❌ assignAppointmentPractitionerAction error:", error);
    return { success: false, error: "Failed to assign practitioner to appointment" };
  }
}

export async function inviteStaffAction(data: {
  pharmacyId: string;
  name: string;
  email: string;
  role: string;
  password?: string;
}) {
  return createStaffMemberAction(data);
}

export async function toggleStaffStatusAction(staffId: string, targetStatus?: boolean) {
  try {
    const staff = await db.staff.findUnique({ where: { id: staffId } });
    if (!staff) return { success: false, error: "Staff member not found" };

    const newStatus = targetStatus !== undefined ? targetStatus : !staff.isActive;

    const updated = await db.staff.update({
      where: { id: staffId },
      data: { isActive: newStatus },
    });

    revalidatePath(`/admin/staff`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("❌ toggleStaffStatusAction error:", error);
    return { success: false, error: "Failed to toggle staff status" };
  }
}

export async function deleteStaffAction(staffId: string) {
  try {
    await db.staff.delete({ where: { id: staffId } });
    revalidatePath(`/admin/staff`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ deleteStaffAction error:", error);
    return { success: false, error: "Failed to delete staff member" };
  }
}

export async function resetStaffPasswordAction(staffId: string, newPassword?: string) {
  try {
    const tempPass = newPassword || "ResetPass123!";
    const passwordHash = hashPassword(tempPass);

    await db.staff.update({
      where: { id: staffId },
      data: { passwordHash },
    });

    return { success: true, tempPassword: tempPass };
  } catch (error: any) {
    console.error("❌ resetStaffPasswordAction error:", error);
    return { success: false, error: "Failed to reset password" };
  }
}
