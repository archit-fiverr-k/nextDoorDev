import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { H1, H2, P } from "@/components/ui/typography";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Edit3, Send, Eye, Info, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { updateEmailTemplateAction, sendTestEmailAction } from "@/actions/super-admin";

export const revalidate = 0;

interface PageProps {
  searchParams: {
    template?: string;
    error?: string;
    success?: string;
  };
}

function getDefaultTemplate(name: string) {
  const brandTeal = "#0d9488";
  const brandNavy = "#0f172a";
  const textMuted = "#64748b";
  const textDark = "#1e293b";
  const bgLight = "#f8fafc";
  const logoUrl = `${env.NEXT_PUBLIC_APP_URL}/assets/header-logo.png`;

  const getHeader = (title: string, subtitle: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0;">
              <tr>
                <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 3px solid ${brandTeal};">
                  <img src="${logoUrl}" alt="NextDoorClinic" style="height: 38px; width: auto; display: inline-block; vertical-align: middle; border: 0;" />
                  <p style="color: ${textMuted}; margin: 8px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">${subtitle}</p>
                </td>
              </tr>
  `;

  const getFooter = () => `
              <tr>
                <td style="padding: 24px 40px; background-color: #0f172a; text-align: center; color: #64748b; font-size: 10px; line-height: 16px;">
                  <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} NextDoorClinic Ltd. All rights reserved.</p>
                  <p style="margin: 0 0 8px 0;">Registered in England & Wales. ICO Data Protection Registry Compliant.</p>
                  <p style="margin: 0;">You are receiving this transactional email because of your registration or activity on NextDoorClinic. <a href="#" style="color: ${brandTeal}; text-decoration: none; font-weight: 600;">Manage Preferences</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  switch (name) {
    case "PROVIDER_APPROVAL":
      return {
        subject: "Welcome to NextDoorClinic! Your Clinic Has Been Approved 🎉",
        body: `
          ${getHeader("Welcome to NextDoorClinic", "Partner Portal Onboarding")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Congratulations {{providerName}}!</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0; font-weight: 500;">
                Your clinic application has been verified and approved by our platform moderation team. Your practice is now live on our national public directory!
              </p>
              
              <div style="background-color: ${bgLight}; border-left: 4px solid ${brandTeal}; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="color: ${brandNavy}; font-size: 13px; font-weight: 700; margin: 0 0 12px 0;">What you can do next:</h3>
                <ul style="margin: 0; padding-left: 20px; color: ${textDark}; font-size: 13px; line-height: 20px;">
                  <li style="margin-bottom: 8px;">List and manage your clinical services (e.g. Travel Vaccines, UTIs).</li>
                  <li style="margin-bottom: 8px;">Configure calendar schedules and allocate clinicians.</li>
                  <li style="margin-bottom: 8px;">Generate your custom iframe/widget booking codes for your site.</li>
                </ul>
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="{{loginUrl}}" style="background-color: ${brandTeal}; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 13px; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px rgba(13, 148, 136, 0.15);">Access Partner Dashboard</a>
                  </td>
                </tr>
              </table>

              <p style="color: ${textMuted}; font-size: 12px; margin: 0; line-height: 18px;">
                Need help getting started? Visit our partner resource center or reply to this email to speak with our pharmacy integration specialist.
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    case "PROVIDER_REJECTION":
      return {
        subject: "Update Regarding Your NextDoorClinic Application",
        body: `
          ${getHeader("Application Update", "Verification Team")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Dear {{providerName}},</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                Thank you for applying to join the NextDoorClinic directory partner program.
              </p>
              
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                Upon review of your application by our compliance moderators, we were unable to approve your clinic registry at this time. This is typically due to missing GPhC validation details, certificate mismatches, or address verification discrepancies.
              </p>

              <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 20px; border-radius: 8px; margin-bottom: 24px; color: #9f1239; font-size: 13px; line-height: 20px;">
                <strong>Next Steps:</strong> Please contact our onboarding support desk at <a href="mailto:support@nextdoorclinic.com" style="color: #f43f5e; text-decoration: none; font-weight: 700;">support@nextdoorclinic.com</a> to provide additional credentials and request a re-review of your application.
              </div>

              <p style="color: ${textMuted}; font-size: 12px; margin: 0; line-height: 18px;">
                Best regards,<br />NextDoorClinic Verification and Compliance Division
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    case "BOOKING_CONFIRMATION":
      return {
        subject: "Booking Confirmed! Appointment Ref: {{bookingId}} 📅",
        body: `
          ${getHeader("Booking Confirmation", "Appointment Status: CONFIRMED")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Hello {{patientName}},</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                Your clinical appointment has been successfully booked and confirmed on NextDoorClinic.
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bgLight}; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 13px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding-bottom: 12px; color: ${textMuted}; font-weight: 600;" width="35%">Service:</td>
                  <td style="padding-bottom: 12px; color: ${brandNavy}; font-weight: 800;">{{serviceName}}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; color: ${textMuted}; font-weight: 600;">Clinic:</td>
                  <td style="padding-bottom: 12px; color: ${brandNavy}; font-weight: 800;">{{providerName}}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; color: ${textMuted}; font-weight: 600;">Date & Time:</td>
                  <td style="padding-bottom: 12px; color: ${brandNavy}; font-weight: 800;">{{formattedTime}}</td>
                </tr>
                <tr>
                  <td style="color: ${textMuted}; font-weight: 600;">Booking ID:</td>
                  <td style="color: ${brandTeal}; font-weight: 800; font-family: monospace;">{{bookingId}}</td>
                </tr>
              </table>

              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 8px; margin-bottom: 24px; color: #14532d; font-size: 12px; line-height: 18px;">
                💡 <strong>Important Note:</strong> Please arrive 5 minutes early and bring details of any medication you are currently taking. If you need to cancel or reschedule, please do so at least 24 hours in advance.
              </div>

              <p style="color: ${textMuted}; font-size: 12px; margin: 0; line-height: 18px;">
                Thank you for choosing NextDoorClinic for your healthcare needs.
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    case "BOOKING_REMINDER":
      return {
        subject: "Reminder: Appointment Upcoming with {{providerName}}",
        body: `
          ${getHeader("Appointment Reminder", "Upcoming Clinical Slot")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Hello {{patientName}},</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                This is a quick friendly reminder that your clinical appointment on NextDoorClinic is scheduled soon.
              </p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${bgLight}; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 13px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding-bottom: 12px; color: ${textMuted}; font-weight: 600;" width="35%">Service:</td>
                  <td style="padding-bottom: 12px; color: ${brandNavy}; font-weight: 800;">{{serviceName}}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px; color: ${textMuted}; font-weight: 600;">Clinic:</td>
                  <td style="padding-bottom: 12px; color: ${brandNavy}; font-weight: 800;">{{providerName}}</td>
                </tr>
                <tr>
                  <td style="color: ${textMuted}; font-weight: 600;">Date & Time:</td>
                  <td style="color: ${brandNavy}; font-weight: 800;">{{formattedTime}}</td>
                </tr>
              </table>

              <p style="color: ${textMuted}; font-size: 12px; margin: 0; line-height: 18px;">
                If you have already attended this visit or need to make adjustments, please log into your Patient Portal.
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    case "BOOKING_CANCELLATION":
      return {
        subject: "Appointment Cancelled - NextDoorClinic",
        body: `
          ${getHeader("Appointment Cancelled", "Booking Status: CANCELLED")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Hello {{patientName}},</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                Your appointment for <strong>{{serviceName}}</strong> at <strong>{{providerName}}</strong> (originally scheduled on {{formattedTime}}) has been cancelled.
              </p>

              <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 20px; border-radius: 8px; margin-bottom: 24px; color: #9f1239; font-size: 13px; line-height: 20px;">
                If this cancellation was in error or you would like to book a different clinic, please return to the marketplace to secure a new time slot.
              </div>

              <p style="color: ${textMuted}; font-size: 12px; margin: 0; line-height: 18px;">
                Sincerely,<br />NextDoorClinic Support Operations
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    case "PASSWORD_RESET":
      return {
        subject: "Reset Your NextDoorClinic Password",
        body: `
          ${getHeader("Password Reset Request", "Security Verification")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Dear User,</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                We received a request to reset the password for your account associated with {{userEmail}}.
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px; margin-top: 10px;">
                <tr>
                  <td align="center">
                    <a href="{{resetUrl}}" style="background-color: ${brandNavy}; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 13px; font-weight: 700; display: inline-block;">Reset Password</a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 11px; color: ${textMuted}; border: 1px solid #e2e8f0; word-break: break-all;">
                <strong>Link not working?</strong> Copy and paste this URL into your browser:<br />
                <a href="{{resetUrl}}" style="color: ${brandTeal}; text-decoration: none;">{{resetUrl}}</a>
              </div>

              <p style="color: ${textMuted}; font-size: 11px; margin: 0; line-height: 18px;">
                This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email; your account details remain secure.
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    case "EMAIL_VERIFICATION":
      return {
        subject: "Verify Your Email Address - NextDoorClinic OTP Code",
        body: `
          ${getHeader("Verify Your Email", "Security Authentication")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Security Verification Code</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                Please enter the following One-Time Password (OTP) code in your browser to complete your email verification and unlock full account access:
              </p>

              <div style="text-align: center; margin: 24px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 0.15em; color: ${brandTeal}; background-color: ${bgLight}; padding: 12px 32px; border-radius: 8px; border: 1px solid #e2e8f0; display: inline-block;">{{otp}}</span>
              </div>

              <p style="color: ${textMuted}; font-size: 11px; margin: 0; line-height: 18px;">
                This code is valid for 10 minutes. For security, never share this code with anyone. NextDoorClinic employees will never ask for your verification code.
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    case "SUBSCRIPTION_RENEWAL":
      return {
        subject: "Subscription Renewal Notice - NextDoorClinic Partner",
        body: `
          ${getHeader("Subscription Renewal Alert", "Account Billing Services")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Hello {{providerName}},</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                This is a billing notice that your premium partner SaaS subscription is scheduled to renew on <strong>{{renewDate}}</strong>.
              </p>

              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                The billing card on file will be automatically charged. To review your invoice breakdown, billing frequency, or update payment information, please log into your partner settings dashboard.
              </p>

              <p style="color: ${textMuted}; font-size: 12px; margin: 0; line-height: 18px;">
                Thank you for partnering with NextDoorClinic. We are excited to continue driving public booking referrals to your clinic.
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    case "FAILED_PAYMENT":
      return {
        subject: "ACTION REQUIRED: Subscription Payment Failed ⚠️",
        body: `
          ${getHeader("Billing Notice", "Payment Refused - Account Suspended Warning")}
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <h2 style="color: ${brandNavy}; font-size: 20px; font-weight: 800; margin: 0 0 16px 0;">Dear {{providerName}},</h2>
              <p style="color: ${textDark}; font-size: 14px; line-height: 22px; margin: 0 0 20px 0;">
                We were unable to process your recurring SaaS subscription payment. Our billing system will attempt an automatic retry on <strong>{{retryDate}}</strong>.
              </p>

              <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 20px; border-radius: 8px; margin-bottom: 24px; color: #9f1239; font-size: 13px; line-height: 20px;">
                ⚠️ <strong>Suspension Warning:</strong> Failure to clear outstanding invoices will result in temporary suspension of your clinic&apos;s booking listings and public directory details on our marketplace.
              </div>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="{{invoiceUrl}}" style="background-color: #f43f5e; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 13px; font-weight: 700; display: inline-block;">Pay Invoice & Update Card</a>
                  </td>
                </tr>
              </table>

              <p style="color: ${textMuted}; font-size: 12px; margin: 0; line-height: 18px;">
                Need help or require an extension? Please reach out to our partner accounts office immediately.
              </p>
            </td>
          </tr>
          ${getFooter()}
        `,
      };

    default:
      return { subject: "", body: "" };
  }
}

export default async function EmailTemplatesPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  const selectedName = searchParams.template || "PROVIDER_APPROVAL";
  const errorMsg = searchParams.error || "";
  const successMsg = searchParams.success || "";

  // Standard required templates to pre-seed/list
  const templateList = [
    { name: "PROVIDER_APPROVAL", label: "Provider Approval", vars: "providerName, loginUrl" },
    { name: "PROVIDER_REJECTION", label: "Provider Rejection", vars: "providerName" },
    {
      name: "BOOKING_CONFIRMATION",
      label: "Booking Confirmation",
      vars: "patientName, providerName, serviceName, formattedTime, bookingId",
    },
    {
      name: "BOOKING_REMINDER",
      label: "Booking Reminder",
      vars: "patientName, serviceName, formattedTime, providerName",
    },
    {
      name: "BOOKING_CANCELLATION",
      label: "Booking Cancellation",
      vars: "patientName, serviceName, formattedTime, providerName",
    },
    { name: "PASSWORD_RESET", label: "Password Reset", vars: "userEmail, resetUrl" },
    { name: "EMAIL_VERIFICATION", label: "Email Verification OTP", vars: "otp" },
    {
      name: "SUBSCRIPTION_RENEWAL",
      label: "Subscription Renewal Alert",
      vars: "providerName, renewDate",
    },
    {
      name: "FAILED_PAYMENT",
      label: "Subscription Payment Failed",
      vars: "providerName, retryDate, invoiceUrl",
    },
  ];

  // Fetch or create selected template in DB
  let template = await db.emailTemplate.findUnique({
    where: { name: selectedName },
  });

  const hasLogo = template && template.body.includes("header-logo.png");
  const hasMarketing = template && template.body.includes("Transforming Primary Care Access");
  const isBasicBoilerplate =
    template &&
    (template.body.includes("NextDoorClinic Operations Team") ||
      template.body.includes("Template variables:") ||
      template.body.includes('NextDoor<span style="color: #0d9488;">Clinic</span>') ||
      template.body.includes("SaaS Billing Management") ||
      template.body.includes("SaaS Billing Issue"));

  if (!template) {
    const defaultMeta = templateList.find((t) => t.name === selectedName);
    const seedData = getDefaultTemplate(selectedName);
    template = await db.emailTemplate.create({
      data: {
        name: selectedName,
        subject: seedData.subject,
        body: seedData.body,
        variables: defaultMeta?.vars || "",
      },
    });
  } else if (!hasLogo || hasMarketing || isBasicBoilerplate) {
    const seedData = getDefaultTemplate(selectedName);
    template = await db.emailTemplate.update({
      where: { name: selectedName },
      data: {
        subject: seedData.subject,
        body: seedData.body,
      },
    });
  }

  // Server action triggers
  const handleSave = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const vars = formData.get("variables") as string;

    const res = await updateEmailTemplateAction(name, subject, body, vars);
    if (!res.success) {
      redirect(
        `/admin/email-templates?template=${name}&error=${encodeURIComponent(res.error || "Failed to save")}`
      );
    } else {
      redirect(`/admin/email-templates?template=${name}&success=Template saved successfully!`);
    }
  };

  const handleSendTest = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const email = formData.get("testEmail") as string;

    const res = await sendTestEmailAction(name, email);
    if (!res.success) {
      redirect(
        `/admin/email-templates?template=${name}&error=${encodeURIComponent(res.error || "Test dispatch failed")}`
      );
    } else {
      redirect(
        `/admin/email-templates?template=${name}&success=Test email successfully dispatched! Check mock logs.`
      );
    }
  };

  // Interpolate mock variables for live preview rendering
  const getPreviewHtml = (subj: string, bodyText: string) => {
    const previewBody = bodyText
      .replace(/\{\{providerName\}\}/g, "Springfield Clinic")
      .replace(/\{\{patientName\}\}/g, "John Smith")
      .replace(/\{\{serviceName\}\}/g, "Influenza Vaccination")
      .replace(/\{\{formattedTime\}\}/g, new Date().toLocaleString())
      .replace(/\{\{bookingId\}\}/g, "APT-100293")
      .replace(/\{\{userEmail\}\}/g, "patient@email.com")
      .replace(/\{\{resetUrl\}\}/g, "http://localhost:3000/reset-password")
      .replace(/\{\{otp\}\}/g, "584920")
      .replace(
        /\{\{renewDate\}\}/g,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      )
      .replace(
        /\{\{retryDate\}\}/g,
        new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toLocaleDateString()
      )
      .replace(/\{\{invoiceUrl\}\}/g, "https://stripe.com/invoice/mock")
      .replace(/\{\{loginUrl\}\}/g, "http://localhost:3000/login");

    return {
      subject: subj,
      body: previewBody,
    };
  };

  const preview = getPreviewHtml(template.subject, template.body);

  return (
    <div className="space-y-6 pb-12 font-sans">
      <div>
        <H1 className="font-black text-slate-900 dark:text-slate-50">Email Template Manager</H1>
        <P className="mt-1 text-slate-500 dark:text-zinc-400">
          Customize transactional notifications sent to clinic providers and patients, test
          delivery, and configure template bodies.
        </P>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Left Side: Templates Selector */}
        <div className="md:col-span-1">
          <Card className="shadow-premium sticky top-6 border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="border-b border-slate-100 pb-3 dark:border-zinc-900/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Platform Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pt-2">
              <div className="flex flex-col">
                {templateList.map((t) => {
                  const isActive = selectedName === t.name;
                  return (
                    <Link
                      key={t.name}
                      href={`/admin/email-templates?template=${t.name}`}
                      className={`flex items-center justify-between border-l-2 px-4 py-3 text-xs font-bold transition-all ${
                        isActive
                          ? "dark:border-zinc-150 border-slate-900 bg-slate-50 text-slate-900 dark:bg-zinc-900/40 dark:text-white"
                          : "border-transparent text-slate-500 hover:bg-slate-50/50 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-900/10 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span>{t.label}</span>
                      <Mail
                        className={`h-3.5 w-3.5 ${isActive ? "animate-pulse text-blue-500" : "text-slate-400"}`}
                      />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: Editor */}
        <div className="space-y-6 md:col-span-3">
          {errorMsg && (
            <div className="border-rose-250 flex items-center space-x-2 rounded-lg border bg-rose-50 p-3 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="border-emerald-250 flex items-center space-x-2 rounded-lg border bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Template Edit Form */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-900/60">
              <CardTitle className="text-slate-850 text-sm font-bold dark:text-slate-200">
                Template Editor &mdash; {selectedName.replace(/_/g, " ")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form action={handleSave} className="space-y-4 text-xs">
                <input type="hidden" name="name" value={template.name} />
                <input type="hidden" name="variables" value={template.variables} />

                <div>
                  <label className="mb-1 block font-semibold text-slate-500">
                    Email Subject Header
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    defaultValue={template.subject}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-500">
                    Email Body Content (HTML Supported)
                  </label>
                  <textarea
                    name="body"
                    required
                    rows={12}
                    defaultValue={template.body}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>

                <div className="text-slate-650 flex items-start space-x-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-[11px] leading-relaxed dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-zinc-400">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <div>
                    <strong className="mb-0.5 block text-slate-800 dark:text-slate-200">
                      Supported Interpolation Variables
                    </strong>
                    <span>
                      You can paste these tokens in the text editor. They will resolve dynamically
                      during dispatch:
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[9px]">
                      {template.variables.split(", ").map((v) => (
                        <span
                          key={v}
                          className="rounded bg-slate-200 px-1 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {"{{"}
                          {v}
                          {"}}"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-50 pt-2 dark:border-zinc-900">
                  <Button type="submit" className="h-9 font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Test Email Dispatch Card */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="border-b border-slate-50 pb-2 dark:border-zinc-900">
              <CardTitle className="text-slate-850 text-sm font-bold dark:text-slate-200">
                Send Delivery Test
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form
                action={handleSendTest}
                className="flex flex-col items-end gap-4 text-xs sm:flex-row"
              >
                <input type="hidden" name="name" value={template.name} />
                <div className="w-full flex-1">
                  <label className="mb-1 block font-semibold text-slate-500">
                    Recipient Test Email Address
                  </label>
                  <input
                    type="email"
                    name="testEmail"
                    required
                    placeholder="e.g. tester@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-9 w-full items-center justify-center space-x-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Test Email</span>
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Live Preview Display */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-900/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Client Preview Renderer
              </CardTitle>
              <Eye className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-zinc-800/40 dark:bg-zinc-900">
                <span className="mr-1.5 font-semibold text-slate-400">Subject:</span>
                <strong className="font-bold text-slate-900 dark:text-white">
                  {preview.subject}
                </strong>
              </div>
              <div className="dark:border-zinc-850 overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                <div className="flex items-center justify-between bg-slate-100 p-2 font-mono text-[10px] text-slate-400 dark:bg-zinc-900">
                  <span>Client Window Render Preview</span>
                  <span>SMTP Secure Mode</span>
                </div>
                <div
                  className="overflow-x-auto bg-white p-6 text-slate-900 dark:bg-zinc-950 dark:text-slate-100"
                  dangerouslySetInnerHTML={{ __html: preview.body }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
