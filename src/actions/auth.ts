"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import {
  registerSchema,
  RegisterInput,
  registerPatientSchema,
  RegisterPatientInput,
} from "@/schemas/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { signIn, signOut } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { sendEmail, sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

// 1. Login Action
export async function loginAction(data: { email: string; password?: string }) {
  // Rate limit: 10 login attempts per 15 minutes per IP
  const clientIp = headers().get("x-forwarded-for") || "127.0.0.1";
  const limiter = rateLimit(`login:${clientIp}`, 10, 15 * 60 * 1000);
  if (!limiter.success) {
    return { success: false, error: "Too many login attempts. Please try again in 15 minutes." };
  }

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    // Audit Log for Login
    try {
      const superAdmin = await db.superAdmin.findUnique({ where: { email: data.email } });
      const platformAdmin = await db.platformAdmin.findUnique({ where: { email: data.email } });
      const pharmacy = await db.pharmacy.findUnique({ where: { email: data.email } });

      const userId = superAdmin?.id || platformAdmin?.id || pharmacy?.id || "";
      const pharmacyId = pharmacy?.id || null;

      if (userId) {
        await db.auditLog.create({
          data: {
            userId,
            userEmail: data.email,
            pharmacyId,
            action: "LOGIN",
            entityName: "UserSession",
            entityId: userId,
            changes: { status: "success" },
          },
        });
      }
    } catch (auditErr) {
      console.error("Audit log notice:", auditErr);
    }

    return { success: true };
  } catch (error: any) {
    if (
      error.message === "NEXT_REDIRECT" ||
      error.name === "RedirectError" ||
      error.digest?.startsWith("NEXT_REDIRECT")
    ) {
      return { success: true };
    }
    return { success: false, error: error.message || "Invalid credentials" };
  }
}

// 2. Logout Action
export async function logoutAction() {
  const session = await getSession();
  if (session?.user) {
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        pharmacyId: session.user.pharmacyId,
        action: "LOGOUT",
        entityName: "UserSession",
        entityId: session.user.id,
        changes: { status: "success" },
      },
    });
  }
  await signOut({ redirect: true, redirectTo: "/login" });
  return { success: true };
}

// 3. Register Action
export async function registerPharmacyAction(data: RegisterInput) {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const { email, password, pharmacyName, slug } = result.data;

  try {
    const existingPharmacy = await db.pharmacy.findUnique({
      where: { email },
    });
    if (existingPharmacy) {
      return { success: false, error: "Email already registered" };
    }

    const existingSlug = await db.pharmacy.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      return { success: false, error: "Subdomain/slug is already taken" };
    }

    const passwordHash = hashPassword(password);

    await db.pharmacy.create({
      data: {
        name: pharmacyName,
        slug,
        email,
        passwordHash,
        phone: "",
        address: "",
        isFirstLogin: true, // Requires first login change
      },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Registration failure:", error);
    return { success: false, error: "An unexpected error occurred during registration" };
  }
}

// 4. Request Password Reset Action
export async function requestPasswordResetAction(email: string) {
  // Rate limit: 5 password reset requests per hour per IP
  const clientIp = headers().get("x-forwarded-for") || "127.0.0.1";
  const limiter = rateLimit(`pwreset:${clientIp}`, 5, 60 * 60 * 1000);
  if (!limiter.success) {
    return { success: false, error: "Too many reset requests. Please try again in an hour." };
  }

  try {
    // Check if user exists in any of the three roles
    const superAdmin = await db.superAdmin.findUnique({ where: { email } });
    const platformAdmin = await db.platformAdmin.findUnique({ where: { email } });
    const pharmacy = await db.pharmacy.findUnique({ where: { email } });

    if (!superAdmin && !platformAdmin && !pharmacy) {
      // Also check patients
      const customer = await db.customer.findFirst({ where: { email } });
      if (!customer) {
        // Return success even if not found to prevent user enumeration
        return { success: true };
      }
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/${token}`;

    await sendPasswordResetEmail(email, {
      userEmail: email,
      resetUrl: resetLink,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Reset request error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 5. Reset Password Action
export async function resetPasswordAction(token: string, newPassword: string) {
  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long" };
  }

  try {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    const { email } = resetToken;
    const passwordHash = hashPassword(newPassword);

    // Update in whichever table matches
    const superAdmin = await db.superAdmin.findUnique({ where: { email } });
    if (superAdmin) {
      await db.superAdmin.update({
        where: { email },
        data: { passwordHash, isFirstLogin: false },
      });
    }

    const platformAdmin = await db.platformAdmin.findUnique({ where: { email } });
    if (platformAdmin) {
      await db.platformAdmin.update({
        where: { email },
        data: { passwordHash, isFirstLogin: false },
      });
    }

    const pharmacy = await db.pharmacy.findUnique({ where: { email } });
    if (pharmacy) {
      await db.pharmacy.update({
        where: { email },
        data: { passwordHash, isFirstLogin: false },
      });
    }

    // Also handle patient accounts
    const customer = await db.customer.findFirst({ where: { email } });
    if (customer) {
      await db.customer.updateMany({
        where: { email },
        data: { passwordHash },
      });
    }

    // Delete token
    await db.passwordResetToken.delete({
      where: { token },
    });

    // Audit Log for Reset Password
    const userId = superAdmin?.id || platformAdmin?.id || pharmacy?.id || "";
    const pharmacyId = pharmacy?.id || null;

    await db.auditLog.create({
      data: {
        userId,
        userEmail: email,
        pharmacyId,
        action: "UPDATE",
        entityName: "UserPassword",
        entityId: userId,
        changes: { type: "password_reset" },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 6. Change First Login Password Action
export async function changeFirstPasswordAction(currentPassword: string, newPassword: string) {
  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long" };
  }

  const session = await getSession();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  const { email, role } = session.user;
  if (!email) {
    return { success: false, error: "Email not found in session" };
  }

  try {
    let passwordHash = "";

    if (role === "super_admin") {
      const user = await db.superAdmin.findUnique({ where: { email } });
      if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
        return { success: false, error: "Incorrect current password" };
      }
      passwordHash = hashPassword(newPassword);
      await db.superAdmin.update({
        where: { email },
        data: { passwordHash, isFirstLogin: false },
      });
    } else if (role === "platform_admin") {
      const user = await db.platformAdmin.findUnique({ where: { email } });
      if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
        return { success: false, error: "Incorrect current password" };
      }
      passwordHash = hashPassword(newPassword);
      await db.platformAdmin.update({
        where: { email },
        data: { passwordHash, isFirstLogin: false },
      });
    } else if (role === "pharmacy") {
      const user = await db.pharmacy.findUnique({ where: { email } });
      if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
        return { success: false, error: "Incorrect current password" };
      }
      passwordHash = hashPassword(newPassword);
      await db.pharmacy.update({
        where: { email },
        data: { passwordHash, isFirstLogin: false },
      });
    } else if (role === "staff") {
      const user = await db.staff.findUnique({ where: { email } });
      if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
        return { success: false, error: "Incorrect current password" };
      }
      passwordHash = hashPassword(newPassword);
      await db.staff.update({
        where: { email },
        data: { passwordHash },
      });
    } else if (role === "patient") {
      const user = await db.customer.findFirst({ where: { email } });
      if (!user || !user.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
        return { success: false, error: "Incorrect current password" };
      }
      passwordHash = hashPassword(newPassword);
      await db.customer.updateMany({
        where: { email },
        data: { passwordHash },
      });
    }

    // Audit Log for First Password Change
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        pharmacyId: session.user.pharmacyId,
        action: "UPDATE",
        entityName: "UserPassword",
        entityId: session.user.id,
        changes: { type: "password_change" },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ First password change error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// 7. Register Patient Action
export async function registerPatientAction(data: RegisterPatientInput) {
  const result = registerPatientSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      validationErrors: result.error.flatten().fieldErrors,
    };
  }

  const { firstName, lastName, email, phone, password } = result.data;

  try {
    const existingPatient = await db.customer.findFirst({
      where: { email },
    });

    if (existingPatient && existingPatient.passwordHash) {
      return { success: false, error: "Email address is already registered as a patient." };
    }

    const passwordHash = hashPassword(password);

    if (existingPatient) {
      await db.customer.updateMany({
        where: { email },
        data: {
          firstName,
          lastName,
          phone,
          passwordHash,
        },
      });
    } else {
      await db.customer.create({
        data: {
          pharmacyId: null,
          firstName,
          lastName,
          email,
          phone,
          passwordHash,
        },
      });
    }

    // Audit Log
    try {
      await db.auditLog.create({
        data: {
          userEmail: email,
          action: "CREATE",
          entityName: "PatientAccount",
          entityId: email,
          changes: { email, phone, firstName, lastName },
        },
      });
    } catch (auditErr) {
      console.error("Audit log notice:", auditErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ Patient registration error:", error);
    return {
      success: false,
      error: error.message?.includes("Can't reach database")
        ? "Unable to connect to database. Please verify DATABASE_URL setting."
        : error.message || "Failed to create patient account. Please try again.",
    };
  }
}

// 8. Send Email Verification
export async function sendVerificationEmailAction(email: string) {
  try {
    const customer = await db.customer.findFirst({ where: { email } });
    if (!customer) return { success: true }; // silent — don't reveal existence

    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.customer.updateMany({
      where: { email },
      data: { emailVerificationToken: token, emailVerificationExpiry: expiry },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Verify your email - NextDoorClinic",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#0f2d20;">Verify Your Email Address</h2>
          <p style="color:#475569;">Click the button below to verify your email address. This link expires in 24 hours.</p>
          <a href="${verifyUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#1D9E75;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Email</a>
          <p style="color:#94a3b8;font-size:12px;">If you did not create a NextDoorClinic account, you can ignore this email.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ sendVerificationEmailAction error:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}

// 9. Verify Email Token
export async function verifyEmailAction(token: string) {
  if (!token) return { success: false, error: "Invalid verification link" };

  try {
    const customer = await db.customer.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!customer) return { success: false, error: "Invalid or expired verification link" };
    if (customer.emailVerificationExpiry && customer.emailVerificationExpiry < new Date()) {
      return { success: false, error: "Verification link has expired. Please request a new one." };
    }

    await db.customer.updateMany({
      where: { emailVerificationToken: token },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ verifyEmailAction error:", error);
    return { success: false, error: "Failed to verify email" };
  }
}
