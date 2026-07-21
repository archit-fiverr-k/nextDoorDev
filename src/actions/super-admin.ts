"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { sendWhatsapp } from "@/lib/twilio";
import { Decimal } from "@prisma/client/runtime/library";

// Auth helper
async function assertSuperAdmin() {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    throw new Error("Unauthorized: Super Admin access required");
  }
  return session;
}

async function assertPlatformOrSuperAdmin() {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin" && session.user.role !== "platform_admin") {
    throw new Error("Unauthorized: Platform Admin or Super Admin access required");
  }
  return session;
}

// Helper to write audit log
async function writeAuditLog(
  userId: string,
  userEmail: string,
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT",
  entityName: string,
  entityId: string,
  changes: any
) {
  return await db.auditLog.create({
    data: {
      userId,
      userEmail,
      action,
      entityName,
      entityId,
      changes,
    },
  });
}

// -------------------------------------------------------------
// PROVIDER ACTIONS
// -------------------------------------------------------------

export async function approveProviderAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const provider = await db.pharmacy.findUnique({ where: { id } });
    if (!provider) return { success: false, error: "Provider not found" };

    const updated = await db.pharmacy.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    // Create default trial subscription on approval if none exists
    const existingSub = await db.subscription.findUnique({ where: { pharmacyId: id } });
    if (!existingSub) {
      await db.subscription.create({
        data: {
          pharmacyId: id,
          plan: "TRIAL",
          status: "ACTIVE",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        },
      });
      await db.subscriptionHistory.create({
        data: {
          pharmacyId: id,
          action: "CREATE",
          plan: "TRIAL",
          details: "Automatic 30 days trial granted on approval.",
        },
      });
    }

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Pharmacy", id, {
      status: { from: provider.status, to: "APPROVED" },
      subscriptionCreated: !existingSub,
    });

    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${id}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Approve Provider Error:", error);
    return { success: false, error: error.message || "Failed to approve provider" };
  }
}

export async function suspendProviderAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const provider = await db.pharmacy.findUnique({ where: { id } });
    if (!provider) return { success: false, error: "Provider not found" };

    await db.pharmacy.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Pharmacy", id, {
      status: { from: provider.status, to: "SUSPENDED" },
    });

    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${id}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Suspend Provider Error:", error);
    return { success: false, error: error.message || "Failed to suspend provider" };
  }
}

export async function activateProviderAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const provider = await db.pharmacy.findUnique({ where: { id } });
    if (!provider) return { success: false, error: "Provider not found" };

    await db.pharmacy.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Pharmacy", id, {
      status: { from: provider.status, to: "APPROVED" },
    });

    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${id}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Activate Provider Error:", error);
    return { success: false, error: error.message || "Failed to activate provider" };
  }
}

export async function softDeleteProviderAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const provider = await db.pharmacy.findUnique({ where: { id } });
    if (!provider) return { success: false, error: "Provider not found" };

    await db.pharmacy.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "DELETE", "Pharmacy", id, {
      softDeleted: true,
      name: provider.name,
      email: provider.email,
    });

    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${id}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Soft Delete Provider Error:", error);
    return { success: false, error: error.message || "Failed to delete provider" };
  }
}

export async function updateProviderBrandingAction(
  id: string,
  displayName: string,
  brandColor: string
) {
  const session = await assertSuperAdmin();
  try {
    const provider = await db.pharmacy.findUnique({ where: { id } });
    if (!provider) return { success: false, error: "Provider not found" };

    await db.pharmacy.update({
      where: { id },
      data: { displayName, brandColor },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Pharmacy", id, {
      displayName: { from: provider.displayName, to: displayName },
      brandColor: { from: provider.brandColor, to: brandColor },
    });

    revalidatePath(`/admin/providers/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update Branding Error:", error);
    return { success: false, error: error.message || "Failed to update branding" };
  }
}

// -------------------------------------------------------------
// PATIENT ACTIONS
// -------------------------------------------------------------

const patientContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Invalid phone number"),
  address: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export type PatientContactInput = z.infer<typeof patientContactSchema>;

export async function updatePatientContactAction(id: string, input: PatientContactInput) {
  const session = await assertSuperAdmin();
  const parsed = patientContactSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  const { firstName, lastName, email, phone, address, gender, dateOfBirth } = parsed.data;

  try {
    const patient = await db.customer.findUnique({ where: { id } });
    if (!patient) return { success: false, error: "Patient not found" };

    const dob = dateOfBirth ? new Date(dateOfBirth) : null;

    await db.customer.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        gender,
        dateOfBirth: dob,
      },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Customer", id, {
      contactUpdated: true,
      before: { firstName: patient.firstName, lastName: patient.lastName, email: patient.email },
      after: { firstName, lastName, email },
    });

    revalidatePath("/admin/patients");
    revalidatePath(`/admin/patients/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update Patient Error:", error);
    return { success: false, error: error.message || "Failed to update patient" };
  }
}

export async function suspendPatientAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const patient = await db.customer.findUnique({ where: { id } });
    if (!patient) return { success: false, error: "Patient not found" };

    await db.customer.update({
      where: { id },
      data: { isActive: false },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Customer", id, {
      isActive: { from: patient.isActive, to: false },
    });

    revalidatePath("/admin/patients");
    revalidatePath(`/admin/patients/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Suspend Patient Error:", error);
    return { success: false, error: error.message || "Failed to suspend patient" };
  }
}

export async function activatePatientAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const patient = await db.customer.findUnique({ where: { id } });
    if (!patient) return { success: false, error: "Patient not found" };

    await db.customer.update({
      where: { id },
      data: { isActive: true },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Customer", id, {
      isActive: { from: patient.isActive, to: true },
    });

    revalidatePath("/admin/patients");
    revalidatePath(`/admin/patients/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Activate Patient Error:", error);
    return { success: false, error: error.message || "Failed to activate patient" };
  }
}

export async function softDeletePatientAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const patient = await db.customer.findUnique({ where: { id } });
    if (!patient) return { success: false, error: "Patient not found" };

    await db.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "DELETE", "Customer", id, {
      softDeleted: true,
      name: `${patient.firstName} ${patient.lastName}`,
    });

    revalidatePath("/admin/patients");
    revalidatePath(`/admin/patients/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Soft Delete Patient Error:", error);
    return { success: false, error: error.message || "Failed to delete patient" };
  }
}

// -------------------------------------------------------------
// BOOKING ACTIONS
// -------------------------------------------------------------

export async function overrideBookingStatusAction(id: string, status: any) {
  const session = await assertSuperAdmin();
  try {
    const booking = await db.appointment.findUnique({ where: { id } });
    if (!booking) return { success: false, error: "Booking not found" };

    await db.appointment.update({
      where: { id },
      data: { status },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Appointment", id, {
      status: { from: booking.status, to: status },
    });

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Override Booking Status Error:", error);
    return { success: false, error: error.message || "Failed to override booking status" };
  }
}

export async function rescheduleBookingAction(id: string, startTime: string, endTime: string) {
  const session = await assertSuperAdmin();
  try {
    const booking = await db.appointment.findUnique({ where: { id } });
    if (!booking) return { success: false, error: "Booking not found" };

    await db.appointment.update({
      where: { id },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "CONFIRMED", // automatically confirms upon admin reschedule
      },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Appointment", id, {
      rescheduled: true,
      before: { startTime: booking.startTime, endTime: booking.endTime },
      after: { startTime: new Date(startTime), endTime: new Date(endTime) },
    });

    revalidatePath("/admin/bookings");
    return { success: true };
  } catch (error: any) {
    console.error("Reschedule Booking Error:", error);
    return { success: false, error: error.message || "Failed to reschedule booking" };
  }
}

// -------------------------------------------------------------
// SUBSCRIPTION ACTIONS
// -------------------------------------------------------------

export async function renewSubscriptionAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const sub = await db.subscription.findUnique({ where: { id } });
    if (!sub) return { success: false, error: "Subscription not found" };

    // Extend subscription end date by 30 days
    const newEndDate = new Date(
      Math.max(Date.now(), sub.endDate.getTime()) + 30 * 24 * 60 * 60 * 1000
    );

    await db.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
        endDate: newEndDate,
        failedPaymentsCount: 0,
        gracePeriodEnd: null,
      },
    });

    await db.subscriptionHistory.create({
      data: {
        pharmacyId: sub.pharmacyId,
        action: "RENEW",
        plan: sub.plan,
        details: `Subscription manually renewed by administrator. Extended end date to ${newEndDate.toLocaleDateString()}`,
      },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Subscription", id, {
      renewed: true,
      newEndDate,
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath(`/admin/providers/${sub.pharmacyId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Renew Subscription Error:", error);
    return { success: false, error: error.message || "Failed to renew subscription" };
  }
}

export async function cancelSubscriptionAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const sub = await db.subscription.findUnique({ where: { id } });
    if (!sub) return { success: false, error: "Subscription not found" };

    await db.subscription.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    await db.subscriptionHistory.create({
      data: {
        pharmacyId: sub.pharmacyId,
        action: "CANCEL",
        plan: sub.plan,
        details: "Subscription cancelled by administrator.",
      },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Subscription", id, {
      cancelled: true,
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath(`/admin/providers/${sub.pharmacyId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Cancel Subscription Error:", error);
    return { success: false, error: error.message || "Failed to cancel subscription" };
  }
}

export async function changeSubscriptionPlanAction(
  id: string,
  plan: "MONTHLY" | "YEARLY" | "TRIAL"
) {
  const session = await assertSuperAdmin();
  try {
    const sub = await db.subscription.findUnique({ where: { id } });
    if (!sub) return { success: false, error: "Subscription not found" };

    const durationDays = plan === "YEARLY" ? 365 : 30;
    const newEndDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await db.subscription.update({
      where: { id },
      data: {
        plan,
        status: "ACTIVE",
        endDate: newEndDate,
        failedPaymentsCount: 0,
        gracePeriodEnd: null,
      },
    });

    await db.subscriptionHistory.create({
      data: {
        pharmacyId: sub.pharmacyId,
        action: plan === "TRIAL" ? "CREATE" : "UPGRADE",
        plan,
        details: `Plan upgraded/changed to ${plan} by administrator. Set end date to ${newEndDate.toLocaleDateString()}`,
      },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Subscription", id, {
      planChanged: { from: sub.plan, to: plan },
      newEndDate,
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath(`/admin/providers/${sub.pharmacyId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Change Plan Error:", error);
    return { success: false, error: error.message || "Failed to change subscription plan" };
  }
}

export async function updateGracePeriodAction(id: string, graceDays: number) {
  const session = await assertSuperAdmin();
  try {
    const sub = await db.subscription.findUnique({ where: { id } });
    if (!sub) return { success: false, error: "Subscription not found" };

    const gracePeriodEnd = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);

    await db.subscription.update({
      where: { id },
      data: {
        status: "GRACE_PERIOD",
        gracePeriodEnd,
      },
    });

    await db.subscriptionHistory.create({
      data: {
        pharmacyId: sub.pharmacyId,
        action: "PAYMENT_FAILED",
        plan: sub.plan,
        details: `Grace period enabled by administrator for ${graceDays} days. Expires: ${gracePeriodEnd.toLocaleDateString()}`,
      },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Subscription", id, {
      status: "GRACE_PERIOD",
      gracePeriodEnd,
    });

    revalidatePath("/admin/subscriptions");
    revalidatePath(`/admin/providers/${sub.pharmacyId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update Grace Period Error:", error);
    return { success: false, error: error.message || "Failed to set grace period" };
  }
}

// -------------------------------------------------------------
// CATEGORY ACTIONS
// -------------------------------------------------------------

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Invalid slug format"),
  type: z.enum(["PROVIDER", "HEALTHCARE", "SERVICE"]),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  displayOrder: z.coerce.number().default(0),
  icon: z.string().optional(),
  color: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function createCategoryAction(input: z.infer<typeof categorySchema>) {
  const session = await assertPlatformOrSuperAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const category = await db.category.create({
      data: parsed.data,
    });

    await writeAuditLog(
      session.user.id,
      session.user.email || "",
      "CREATE",
      "Category",
      category.id,
      {
        name: category.name,
        type: category.type,
        slug: category.slug,
      }
    );

    revalidatePath("/admin/categories");
    revalidatePath("/book/[pharmacySlug]");
    return { success: true };
  } catch (error: any) {
    console.error("Create Category Error:", error);
    if (error.code === "P2002") {
      return { success: false, error: "A category with this slug already exists." };
    }
    return { success: false, error: error.message || "Failed to create category" };
  }
}

export async function updateCategoryAction(id: string, input: z.infer<typeof categorySchema>) {
  const session = await assertPlatformOrSuperAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validation failed",
      details: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const old = await db.category.findUnique({ where: { id } });
    if (!old) return { success: false, error: "Category not found" };

    const category = await db.category.update({
      where: { id },
      data: parsed.data,
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "Category", id, {
      before: old,
      after: category,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/book/[pharmacySlug]");
    return { success: true };
  } catch (error: any) {
    console.error("Update Category Error:", error);
    return { success: false, error: error.message || "Failed to update category" };
  }
}

export async function deleteCategoryAction(id: string) {
  const session = await assertPlatformOrSuperAdmin();
  try {
    const old = await db.category.findUnique({ where: { id } });
    if (!old) return { success: false, error: "Category not found" };

    await db.category.update({
      where: { id },
      data: { deleted: true, status: "INACTIVE" },
    });

    await writeAuditLog(session.user.id, session.user.email || "", "DELETE", "Category", id, {
      name: old.name,
      type: old.type,
      softDeleted: true,
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Category Error:", error);
    return { success: false, error: error.message || "Failed to delete category" };
  }
}

// -------------------------------------------------------------
// CMS ACTIONS
// -------------------------------------------------------------

const cmsPageSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

export async function updateCmsPageAction(input: z.infer<typeof cmsPageSchema>) {
  const session = await assertSuperAdmin();
  const parsed = cmsPageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Validation failed" };
  }

  const { slug, title, content, seoTitle, seoDescription, seoKeywords } = parsed.data;

  try {
    const existing = await db.cmsPage.findUnique({ where: { slug } });

    let page;
    if (existing) {
      page = await db.cmsPage.update({
        where: { slug },
        data: { title, content, seoTitle, seoDescription, seoKeywords },
      });
      await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "CmsPage", page.id, {
        slug,
      });
    } else {
      page = await db.cmsPage.create({
        data: { slug, title, content, seoTitle, seoDescription, seoKeywords },
      });
      await writeAuditLog(session.user.id, session.user.email || "", "CREATE", "CmsPage", page.id, {
        slug,
      });
    }

    revalidatePath(`/admin/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("CMS Page Error:", error);
    return { success: false, error: error.message || "Failed to save CMS Page" };
  }
}

const cmsFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  displayOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

export async function createCmsFaqAction(input: z.infer<typeof cmsFaqSchema>) {
  const session = await assertSuperAdmin();
  const parsed = cmsFaqSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  try {
    const faq = await db.cmsFaq.create({
      data: parsed.data,
    });

    await writeAuditLog(session.user.id, session.user.email || "", "CREATE", "CmsFaq", faq.id, {
      question: faq.question,
    });

    revalidatePath(`/admin/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("CMS FAQ Create Error:", error);
    return { success: false, error: error.message || "Failed to create FAQ" };
  }
}

export async function updateCmsFaqAction(id: string, input: z.infer<typeof cmsFaqSchema>) {
  const session = await assertSuperAdmin();
  const parsed = cmsFaqSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  try {
    const faq = await db.cmsFaq.update({
      where: { id },
      data: parsed.data,
    });

    await writeAuditLog(session.user.id, session.user.email || "", "UPDATE", "CmsFaq", id, {
      question: faq.question,
    });

    revalidatePath(`/admin/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("CMS FAQ Update Error:", error);
    return { success: false, error: error.message || "Failed to update FAQ" };
  }
}

export async function deleteCmsFaqAction(id: string) {
  const session = await assertSuperAdmin();
  try {
    const faq = await db.cmsFaq.delete({ where: { id } });
    await writeAuditLog(session.user.id, session.user.email || "", "DELETE", "CmsFaq", id, {
      question: faq.question,
    });

    revalidatePath(`/admin/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("CMS FAQ Delete Error:", error);
    return { success: false, error: error.message || "Failed to delete FAQ" };
  }
}

// -------------------------------------------------------------
// EMAIL ACTIONS
// -------------------------------------------------------------

export async function updateEmailTemplateAction(
  name: string,
  subject: string,
  body: string,
  variables: string
) {
  const session = await assertSuperAdmin();
  try {
    const existing = await db.emailTemplate.findUnique({ where: { name } });

    let template;
    if (existing) {
      template = await db.emailTemplate.update({
        where: { name },
        data: { subject, body, variables },
      });
      await writeAuditLog(
        session.user.id,
        session.user.email || "",
        "UPDATE",
        "EmailTemplate",
        template.id,
        { name }
      );
    } else {
      template = await db.emailTemplate.create({
        data: { name, subject, body, variables },
      });
      await writeAuditLog(
        session.user.id,
        session.user.email || "",
        "CREATE",
        "EmailTemplate",
        template.id,
        { name }
      );
    }

    revalidatePath("/admin/email-templates");
    return { success: true };
  } catch (error: any) {
    console.error("Email Template Update Error:", error);
    return { success: false, error: error.message || "Failed to save Email Template" };
  }
}

export async function sendTestEmailAction(templateName: string, recipientEmail: string) {
  const session = await assertSuperAdmin();
  try {
    const template = await db.emailTemplate.findUnique({ where: { name: templateName } });
    if (!template) return { success: false, error: "Template not found" };

    // Interpolate default mock variables
    let html = template.body
      .replace(/\{\{providerName\}\}/g, "MedCare Wellness")
      .replace(/\{\{patientName\}\}/g, "John Doe")
      .replace(/\{\{bookingId\}\}/g, "APT-99482")
      .replace(/\{\{formattedTime\}\}/g, new Date().toLocaleString())
      .replace(/\{\{loginUrl\}\}/g, "http://localhost:3000/login")
      .replace(/\{\{resetUrl\}\}/g, "http://localhost:3000/reset-password")
      .replace(/\{\{otp\}\}/g, "123456");

    await sendEmail({
      to: recipientEmail,
      subject: `[TEST] ${template.subject}`,
      html: `
        <div style="background-color: #f1f5f9; padding: 20px; font-family: sans-serif;">
          <div style="background-color: #fbbf24; padding: 10px; text-align: center; font-weight: bold; border-radius: 4px; margin-bottom: 15px;">
            ⚠️ This is a test email sent from the NextDoorClinic Email Template Manager
          </div>
          ${html}
        </div>
      `,
    });

    await writeAuditLog(
      session.user.id,
      session.user.email || "",
      "UPDATE",
      "EmailTemplate",
      template.id,
      {
        testEmailSentTo: recipientEmail,
      }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Send Test Email Error:", error);
    return { success: false, error: error.message || "Failed to send test email" };
  }
}

// -------------------------------------------------------------
// SETTINGS ACTIONS
// -------------------------------------------------------------

export async function updateSystemSettingsAction(data: any) {
  const session = await assertSuperAdmin();
  try {
    let settings = await db.systemSetting.findFirst();

    if (!settings) {
      settings = await db.systemSetting.create({
        data: {
          isMaintenanceMode: false,
          announcementBanner: null,
          trustMetrics: "[]",
          trustTabs: "[]",
          trustTicker: "[]",
          trustTickerTitle: "Trust Verification:",
        },
      });
    }

    const updated = await db.systemSetting.update({
      where: { id: settings.id },
      data: {
        isMaintenanceMode: !!data.isMaintenanceMode,
        announcementBanner: data.announcementBanner || null,
        platformName: data.platformName || "NextDoorClinic",
        logoUrl: data.logoUrl || null,
        supportEmail: data.supportEmail || "support@nextdoorclinic.com",
        timezone: data.timezone || "UTC",
        defaultLanguage: data.defaultLanguage || "en",
        passwordMinLength: parseInt(data.passwordMinLength) || 8,
        passwordRequireNumbers: !!data.passwordRequireNumbers,
        passwordRequireSymbols: !!data.passwordRequireSymbols,
        sessionTimeoutMinutes: parseInt(data.sessionTimeoutMinutes) || 60,
        defaultBufferTime: parseInt(data.defaultBufferTime) || 15,
        defaultBookingLimit: parseInt(data.defaultBookingLimit) || 1,
        defaultApprovalMode: data.defaultApprovalMode || "AUTOMATIC",
        isEmailNotificationsEnabled: !!data.isEmailNotificationsEnabled,
        isSmsNotificationsEnabled: !!data.isSmsNotificationsEnabled,
      },
    });

    await writeAuditLog(
      session.user.id,
      session.user.email || "",
      "UPDATE",
      "SystemSetting",
      settings.id,
      {
        generalSettingsUpdated: true,
      }
    );

    revalidatePath("/admin/settings");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Update General Settings Error:", error);
    return { success: false, error: error.message || "Failed to update general settings" };
  }
}

export async function updateIntegrationsSettingsAction(data: any) {
  const session = await assertSuperAdmin();
  try {
    let settings = await db.systemSetting.findFirst();

    if (!settings) {
      settings = await db.systemSetting.create({
        data: {
          isMaintenanceMode: false,
          announcementBanner: null,
          trustMetrics: "[]",
          trustTabs: "[]",
          trustTicker: "[]",
          trustTickerTitle: "Trust Verification:",
        },
      });
    }

    const updated = await db.systemSetting.update({
      where: { id: settings.id },
      data: {
        stripePublishableKey: data.stripePublishableKey || null,
        stripeSecretKey: data.stripeSecretKey || null,
        stripeWebhookSecret: data.stripeWebhookSecret || null,
        stripeMode: data.stripeMode || "TEST",
        googleMapsApiKey: data.googleMapsApiKey || null,
        smtpHost: data.smtpHost || null,
        smtpPort: data.smtpPort ? parseInt(data.smtpPort) : null,
        smtpUsername: data.smtpUsername || null,
        smtpPassword: data.smtpPassword || null,
        smtpEncryption: data.smtpEncryption || "NONE",
        recaptchaSiteKey: data.recaptchaSiteKey || null,
        recaptchaSecretKey: data.recaptchaSecretKey || null,
        isRecaptchaEnabled: !!data.isRecaptchaEnabled,
        twilioAccountSid: data.twilioAccountSid || null,
        twilioAuthToken: data.twilioAuthToken || null,
        twilioPhoneNumber: data.twilioPhoneNumber || null,
        twilioWhatsappNumber: data.twilioWhatsappNumber || null,
      },
    });

    await writeAuditLog(
      session.user.id,
      session.user.email || "",
      "UPDATE",
      "SystemSetting",
      settings.id,
      {
        integrationsUpdated: true,
      }
    );

    revalidatePath("/admin/integrations");
    return { success: true };
  } catch (error: any) {
    console.error("Update Integrations Settings Error:", error);
    return { success: false, error: error.message || "Failed to update integrations settings" };
  }
}

async function assertAdmin() {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin" && session.user.role !== "platform_admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}

export async function sendSubscriptionEmailReminderAction(pharmacyId: string) {
  const session = await assertAdmin();
  try {
    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    if (!pharmacy) return { success: false, error: "Pharmacy not found" };

    const subject = "Activate your NextDoorClinic SaaS Subscription Plan";
    const html = `
      <h1>Hello ${pharmacy.name},</h1>
      <p>We noticed you haven't activated your SaaS subscription plan yet.</p>
      <p>Activate your subscription now to unlock booking widgets, calendar scheduling, and patients portal integrations.</p>
      <p><a href="http://localhost:3000/register">Click here to activate your subscription plan</a></p>
      <p>Thank you,<br/>NextDoorClinic Team</p>
    `;

    await sendEmail({
      to: pharmacy.email,
      subject,
      html,
    });

    await writeAuditLog(
      session.user.id,
      session.user.email || "",
      "UPDATE",
      "Pharmacy",
      pharmacyId,
      { sentEmailReminder: true }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Email Reminder Error:", error);
    return { success: false, error: error.message || "Failed to send email reminder" };
  }
}

export async function sendSubscriptionWhatsappReminderAction(pharmacyId: string) {
  const session = await assertAdmin();
  try {
    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });
    if (!pharmacy) return { success: false, error: "Pharmacy not found" };

    const message = `Hello ${pharmacy.name}, this is a reminder from NextDoorClinic. Please activate your subscription plan to unlock your marketplace bookings and scheduler.`;

    if (pharmacy.phone) {
      await sendWhatsapp({
        to: pharmacy.phone,
        body: message,
      });
    }

    await writeAuditLog(
      session.user.id,
      session.user.email || "",
      "UPDATE",
      "Pharmacy",
      pharmacyId,
      { sentWhatsappReminder: true }
    );

    return { success: true };
  } catch (error: any) {
    console.error("WhatsApp Reminder Error:", error);
    return { success: false, error: error.message || "Failed to send WhatsApp reminder" };
  }
}

export async function sendBulkSubscriptionRemindersAction() {
  const session = await assertAdmin();
  try {
    const allPharmacies = await db.pharmacy.findMany({
      where: { deletedAt: null },
      include: { subscription: true },
    });

    const unsubscribed = allPharmacies.filter((p) => {
      if (!p.subscription) return true;
      const sub = p.subscription;
      return sub.status !== "ACTIVE" && sub.status !== "TRIAL" && sub.status !== "GRACE_PERIOD";
    });

    if (unsubscribed.length === 0) {
      return { success: true, count: 0 };
    }

    // Loop through all unsubscribed pharmacies and send reminders
    for (const pharmacy of unsubscribed) {
      // 1. Send Email
      try {
        const subject = "Activate your NextDoorClinic SaaS Subscription Plan";
        const html = `
          <h1>Hello ${pharmacy.name},</h1>
          <p>We noticed you haven't activated your SaaS subscription plan yet.</p>
          <p>Activate your subscription now to unlock booking widgets, calendar scheduling, and patients portal integrations.</p>
          <p><a href="http://localhost:3000/register">Click here to activate your subscription plan</a></p>
          <p>Thank you,<br/>NextDoorClinic Team</p>
        `;
        await sendEmail({
          to: pharmacy.email,
          subject,
          html,
        });
      } catch (err) {
        console.error(`Failed to send email to ${pharmacy.email}:`, err);
      }

      // 2. Send WhatsApp message
      if (pharmacy.phone) {
        try {
          const message = `Hello ${pharmacy.name}, this is a reminder from NextDoorClinic. Please activate your subscription plan to unlock your marketplace bookings and scheduler.`;
          await sendWhatsapp({
            to: pharmacy.phone,
            body: message,
          });
        } catch (err) {
          console.error(`Failed to send WhatsApp to ${pharmacy.phone}:`, err);
        }
      }
    }

    await writeAuditLog(
      session.user.id,
      session.user.email || "",
      "UPDATE",
      "Pharmacy",
      "BULK_REMINDERS",
      { sentBulkRemindersCount: unsubscribed.length }
    );

    return { success: true, count: unsubscribed.length };
  } catch (error: any) {
    console.error("Bulk Reminders Error:", error);
    return { success: false, error: error.message || "Failed to send bulk reminders" };
  }
}
