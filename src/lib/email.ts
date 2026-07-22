import { Resend } from "resend";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { render } from "@react-email/render";
import * as React from "react";

// Import React Email templates
import { BookingConfirmationEmail } from "@/components/emails/booking-confirmation";
import { BookingNotificationEmail } from "@/components/emails/booking-notification";
import { CredentialsEmail } from "@/components/emails/credentials-email";
import { PasswordResetEmail } from "@/components/emails/password-reset";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  let status = "SENT";
  let errorMessage: string | null = null;
  let messageId = `msg_${Date.now()}`;

  if (!resend) {
    console.log("\n=========================================");
    console.log(`📧 [EMAIL DISPATCHED & LOGGED TO DB]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("=========================================\n");
  } else {
    try {
      const { data, error } = await resend.emails.send({
        from: "NextDoorClinic <noreply@nextdoorclinic.com>",
        to,
        subject,
        html,
      });

      if (error) {
        status = "FAILED";
        errorMessage = error.message;
      } else if (data?.id) {
        messageId = data.id;
      }
    } catch (error: any) {
      status = "FAILED";
      errorMessage = error.message || "Failed to send email via Resend";
    }
  }

  // Persist email log entry in Neon PostgreSQL DB
  try {
    await db.emailLog.create({
      data: {
        recipient: to,
        subject,
        status,
        errorMessage,
      },
    });
  } catch (dbErr) {
    console.error("❌ Failed to create EmailLog record:", dbErr);
  }

  return { success: status === "SENT", messageId, error: errorMessage };
}

export async function sendOTPEmail(email: string, otp: string) {
  const subject = "Verify your email address - NextDoorClinic";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-bottom: 16px;">NextDoorClinic Email Verification</h2>
      <p style="color: #475569; font-size: 16px; line-height: 24px;">
        You requested a verification code to complete your pharmacy booking. Use the code below to verify your email address. This code will expire in 10 minutes.
      </p>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e3a8a;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        If you did not request this booking, you can safely ignore this email.
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}

export async function sendBookingConfirmationEmail(
  email: string,
  details: {
    patientName: string;
    branchName: string;
    serviceName: string;
    startTime: Date;
    bookingId: string;
  }
) {
  const formattedTime = new Date(details.startTime).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = await render(
    React.createElement(BookingConfirmationEmail, {
      patientName: details.patientName,
      branchName: details.branchName,
      serviceName: details.serviceName,
      formattedTime,
      bookingId: details.bookingId,
    })
  );

  return sendEmail({
    to: email,
    subject: "Booking Confirmed - NextDoorClinic",
    html,
  });
}

export async function sendBookingNotificationEmail(
  email: string,
  details: {
    pharmacyName: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    serviceName: string;
    formattedTime: Date;
    dashboardUrl: string;
  }
) {
  const formattedTime = new Date(details.formattedTime).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = await render(
    React.createElement(BookingNotificationEmail, {
      pharmacyName: details.pharmacyName,
      patientName: details.patientName,
      patientEmail: details.patientEmail,
      patientPhone: details.patientPhone,
      serviceName: details.serviceName,
      formattedTime,
      dashboardUrl: details.dashboardUrl,
    })
  );

  return sendEmail({
    to: email,
    subject: `New Booking Scheduled - ${details.patientName}`,
    html,
  });
}

export async function sendCredentialsEmail(
  email: string,
  details: {
    pharmacyName: string;
    loginEmail: string;
    defaultPassword: string;
    loginUrl: string;
  }
) {
  const html = await render(
    React.createElement(CredentialsEmail, {
      pharmacyName: details.pharmacyName,
      loginEmail: details.loginEmail,
      defaultPassword: details.defaultPassword,
      loginUrl: details.loginUrl,
    })
  );

  return sendEmail({
    to: email,
    subject: "Welcome to NextDoorClinic - Pharmacy Workspace Credentials",
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  details: {
    userEmail: string;
    resetUrl: string;
  }
) {
  const html = await render(
    React.createElement(PasswordResetEmail, {
      userEmail: details.userEmail,
      resetUrl: details.resetUrl,
    })
  );

  return sendEmail({
    to: email,
    subject: "Reset Your Password - NextDoorClinic",
    html,
  });
}

export async function sendProviderRegistrationNotification(details: {
  pharmacyName: string;
  email: string;
  phone: string;
}) {
  const subject = `New Clinic Registration Pending Approval - ${details.pharmacyName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">NextDoorClinic Workspace Registration</h2>
      <p style="color: #475569; font-size: 14px; line-height: 22px;">
        A new clinical workspace has registered and is pending super administrator approval:
      </p>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #334155; line-height: 20px;">
        <strong>Pharmacy Name:</strong> ${details.pharmacyName}<br />
        <strong>Email Address:</strong> ${details.email}<br />
        <strong>Phone Number:</strong> ${details.phone}<br />
        <strong>Status:</strong> PENDING APPROVAL
      </div>
      <p style="color: #64748b; font-size: 12px;">
        Please log in to your admin panel to review and approve this clinic's documents and status.
      </p>
    </div>
  `;
  try {
    const superAdmins = await db.superAdmin.findMany();
    for (const admin of superAdmins) {
      await sendEmail({ to: admin.email, subject, html });
    }
  } catch (error) {
    console.error("❌ Failed to notify super admins of provider registration:", error);
  }
}

export async function sendPlatformAdminCredentialsEmail(
  email: string,
  name: string,
  roleLabel: string, // "Platform Admin" or "Developer"
  tempPassword: string,
  permissions: string[]
) {
  const loginUrl = `${env.NEXT_PUBLIC_APP_URL}/login`;
  const accessListHtml = permissions.map((p) => `<li>${p}</li>`).join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to NextDoorClinic - ${roleLabel} Workspace</h2>
      <p style="color: #475569; font-size: 14px; line-height: 24px;">
        Hi ${name || "Administrator"},
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 24px;">
        A new ${roleLabel.toLowerCase()} account has been created for you. Use the temporary credentials below to log in.
      </p>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; font-size: 14px;">
        <strong>Login Email:</strong> <code style="color: #0f172a;">${email}</code><br/>
        <strong>Temporary Password:</strong> <code style="color: #0f172a;">${tempPassword}</code><br/>
        <strong>Login Link:</strong> <a href="${loginUrl}" style="color: #10B981; font-weight: bold;">${loginUrl}</a>
      </div>
      <p style="color: #475569; font-size: 14px; font-weight: bold; margin-top: 16px;">
        Your Configured Access & Permissions:
      </p>
      <ul style="color: #475569; font-size: 13px; line-height: 20px; padding-left: 20px;">
        ${accessListHtml || "<li>No permissions configured.</li>"}
      </ul>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        You will be required to change your temporary password upon your first login.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to NextDoorClinic - Your ${roleLabel} Account Credentials`,
    html,
  });
}

export async function sendPatientWelcomeEmail(email: string, details: { patientName: string }) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${env.NEXT_PUBLIC_APP_URL}/assets/header-logo.png" alt="NextDoorClinic" style="height: 40px; object-fit: contain;" />
      </div>
      <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 16px;">Welcome to NextDoorClinic!</h2>
      <p style="color: #475569; font-size: 14px; line-height: 24px;">
        Hi ${details.patientName},
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 24px;">
        Thank you for booking with NextDoorClinic. We have automatically created a patient portal account for you to manage this and all future appointments.
      </p>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; font-size: 14px; color: #334155; line-height: 22px;">
        <strong>With your patient portal account, you can:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>View and manage your active bookings</li>
          <li>Receive automated appointment reminders</li>
          <li>Access secure CQC-compliant doctor consultations</li>
          <li>Book treatments faster next time</li>
        </ul>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 24px;">
        You can access your patient portal at any time by logging in with your email address.
      </p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="${env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block;">Go to Patient Portal</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
        &copy; ${new Date().getFullYear()} NextDoorClinic. All rights reserved.
      </p>
    </div>
  `;
  return sendEmail({
    to: email,
    subject: "Welcome to NextDoorClinic",
    html,
  });
}

export async function sendEmailVerificationEmail(
  email: string,
  details: { patientName: string; token: string }
) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <img src="${env.NEXT_PUBLIC_APP_URL}/assets/header-logo.png" alt="NextDoorClinic" style="height: 40px; object-fit: contain;" />
      </div>
      <h2 style="color: #0f172a; margin-top: 24px; margin-bottom: 16px;">Verify your email address</h2>
      <p style="color: #475569; font-size: 14px; line-height: 24px;">
        Hi ${details.patientName},
      </p>
      <p style="color: #475569; font-size: 14px; line-height: 24px;">
        Please verify your email address to complete your account registration and secure your patient portal access.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${details.token}" style="background-color: #10B981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 20px;">
        Alternatively, you can copy and paste the following link into your browser:
        <br />
        <a href="${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${details.token}" style="color: #10B981; word-break: break-all;">${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${details.token}</a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center;">
        This link will expire in 24 hours. If you did not request this booking, you can safely ignore this email.
      </p>
    </div>
  `;
  return sendEmail({
    to: email,
    subject: "Verify your email - NextDoorClinic",
    html,
  });
}
