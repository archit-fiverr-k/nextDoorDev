"use server";

import { db } from "@/lib/db";
import { formatErrorMessage } from "@/lib/error-utils";
import { revalidatePath } from "next/cache";

/**
 * Merges duplicate customer records that share the same normalized phone number
 * (or same phone number + name), regardless of differing email addresses.
 * Re-assigns all appointments, notifications, payments, and logs to the primary customer record.
 */
export async function mergeDuplicateCustomersByPhoneAction(targetPhone?: string) {
  try {
    let phoneFilter = {};
    if (targetPhone && targetPhone.trim()) {
      const cleanPhone = targetPhone.replace(/\s+/g, "").trim();
      phoneFilter = { phone: cleanPhone };
    }

    // 1. Fetch all active customer records
    const allCustomers = await db.customer.findMany({
      where: {
        ...phoneFilter,
        deletedAt: null,
      },
      include: {
        appointments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Group customers by normalized phone number
    const groupedByPhone = new Map<string, typeof allCustomers>();
    for (const cust of allCustomers) {
      const cleanPhone = cust.phone ? cust.phone.replace(/\s+/g, "").trim() : "";
      if (!cleanPhone) continue;

      if (!groupedByPhone.has(cleanPhone)) {
        groupedByPhone.set(cleanPhone, []);
      }
      groupedByPhone.get(cleanPhone)!.push(cust);
    }

    let mergedGroupCount = 0;
    let mergedCustomerCount = 0;
    let reassignedAppointmentsCount = 0;

    // 3. Process groups with > 1 customer record
    for (const [phone, group] of Array.from(groupedByPhone.entries())) {
      if (group.length <= 1) continue;

      // Primary customer: prefers record with passwordHash (registered account), or oldest record
      const primary = group.find((c: any) => c.passwordHash !== null) || group[0];
      const duplicateIds = group.filter((c: any) => c.id !== primary.id).map((c: any) => c.id);

      if (duplicateIds.length === 0) continue;

      await db.$transaction(async (tx) => {
        // Re-assign Appointments
        const apptUpdate = await tx.appointment.updateMany({
          where: { customerId: { in: duplicateIds } },
          data: { customerId: primary.id },
        });
        reassignedAppointmentsCount += apptUpdate.count;

        // Re-assign PatientNotifications
        await tx.patientNotification.updateMany({
          where: { customerId: { in: duplicateIds } },
          data: { customerId: primary.id },
        });

        // Re-assign CommunicationsLog
        await tx.communicationsLog.updateMany({
          where: { customerId: { in: duplicateIds } },
          data: { customerId: primary.id },
        });

        // Re-assign Payments
        await tx.payment.updateMany({
          where: { customerId: { in: duplicateIds } },
          data: { customerId: primary.id },
        });

        // Delete duplicate customer records
        await tx.customer.deleteMany({
          where: { id: { in: duplicateIds } },
        });
      });

      mergedGroupCount++;
      mergedCustomerCount += duplicateIds.length;
    }

    try {
      revalidatePath("/admin/customers");
      revalidatePath("/pharmacy");
    } catch (e) {
      // Ignore static generation store error outside Next.js request context
    }

    return {
      success: true,
      mergedGroupCount,
      mergedCustomerCount,
      reassignedAppointmentsCount,
      message: `Successfully merged ${mergedCustomerCount} duplicate customer records across ${mergedGroupCount} phone numbers.`,
    };
  } catch (error: any) {
    console.error("❌ mergeDuplicateCustomersByPhoneAction failed:", error);
    return { success: false, error: formatErrorMessage(error) };
  }
}

/**
 * Transactional Helper to find and merge customer by phone number during booking
 */
export async function findOrCreateMergedCustomer(
  tx: any,
  data: {
    pharmacyId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    dob?: Date;
    passwordHash?: string | null;
  }
) {
  const cleanPhone = data.phone.replace(/\s+/g, "").trim();
  const cleanEmail = data.email.trim().toLowerCase();

  // Find all customers matching phone OR email
  const existingMatches = await tx.customer.findMany({
    where: {
      OR: [
        { phone: cleanPhone },
        { email: cleanEmail },
        {
          AND: [
            { firstName: { equals: data.firstName, mode: "insensitive" } },
            { lastName: { equals: data.lastName, mode: "insensitive" } },
            { phone: cleanPhone },
          ],
        },
      ],
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });

  if (existingMatches.length === 0) {
    // Create new customer
    return await tx.customer.create({
      data: {
        pharmacyId: data.pharmacyId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: cleanEmail,
        phone: cleanPhone,
        address: data.address,
        dateOfBirth: data.dob,
        passwordHash: data.passwordHash || null,
        smsNotifications: true,
        emailNotifications: true,
      },
    });
  }

  // Primary customer selection: prefers registered user (with passwordHash) or oldest record
  const primaryCustomer =
    existingMatches.find((c: any) => c.passwordHash !== null) || existingMatches[0];
  const duplicateIds = existingMatches
    .filter((c: any) => c.id !== primaryCustomer.id)
    .map((c: any) => c.id);

  if (duplicateIds.length > 0) {
    // Re-assign all related entities to primary customer
    await tx.appointment.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: primaryCustomer.id },
    });

    await tx.patientNotification.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: primaryCustomer.id },
    });

    await tx.communicationsLog.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: primaryCustomer.id },
    });

    await tx.payment.updateMany({
      where: { customerId: { in: duplicateIds } },
      data: { customerId: primaryCustomer.id },
    });

    // Delete duplicate customer records
    await tx.customer.deleteMany({
      where: { id: { in: duplicateIds } },
    });
  }

  // Update primary customer with latest booking details
  const updatedCustomer = await tx.customer.update({
    where: { id: primaryCustomer.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: cleanPhone,
      email: cleanEmail,
      ...(data.address ? { address: data.address } : {}),
      ...(data.dob ? { dateOfBirth: data.dob } : {}),
      ...(data.passwordHash && !primaryCustomer.passwordHash
        ? { passwordHash: data.passwordHash }
        : {}),
    },
  });

  return updatedCustomer;
}
