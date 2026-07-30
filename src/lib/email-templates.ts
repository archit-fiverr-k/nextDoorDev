import { db } from "@/lib/db";
import { env } from "@/lib/env";

export type StatusBadgeType =
  "CONFIRMED" | "RESERVATION" | "REMINDER" | "RESCHEDULED" | "CANCELLED" | "COMPLETED" | "VERIFIED";

/**
 * Generates the unified responsive email layout matching the NextDoorClinic template design.
 * Un-carded on mobile, clean typography, 3px emerald left-bordered guidance box, and promotional banner.
 */
export function renderEmailTemplateLayout({
  title,
  badgeText,
  badgeColor = "#10B981",
  serviceName = "{{serviceName}}",
  providerName = "{{providerName}}",
  formattedTime = "{{formattedTime}}",
  bookingId = "{{bookingId}}",
  mainTitle,
  introText,
  summaryTitle = "APPOINTMENT SUMMARY",
  guidanceTitle = "Important Patient Guidance:",
  guidanceItems = [],
  ctaText,
  ctaUrl,
  closingText = "Thank you for choosing NextDoorClinic for your healthcare needs.",
}: {
  title: string;
  badgeText: string;
  badgeColor?: string;
  serviceName?: string;
  providerName?: string;
  formattedTime?: string;
  bookingId?: string;
  mainTitle: string;
  introText: string;
  summaryTitle?: string;
  guidanceTitle?: string;
  guidanceItems?: { label: string; text: string }[];
  ctaText: string;
  ctaUrl: string;
  closingText?: string;
}) {
  const appBaseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const bannerUrl =
    "https://res.cloudinary.com/freefiresaga/image/upload/v1785090150/promotion_2068_x_760_converted_xvsqev.webp";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: transparent !important;
      background: transparent !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #334155;
    }
    table {
      border-collapse: collapse;
      background-color: transparent !important;
      background: transparent !important;
    }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px 12px !important; }
      .summary-label { width: 42% !important; font-size: 12px !important; }
      .summary-value { width: 58% !important; font-size: 12px !important; }
      .main-heading { font-size: 22px !important; line-height: 28px !important; }
      .cta-btn { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: transparent; background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: transparent; background: transparent; table-layout: fixed; padding: 20px 0;">
    <tr>
      <td align="center" style="background-color: transparent; background: transparent;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 620px; margin: 0 auto; padding: 24px 20px; background-color: transparent; background: transparent;">
          
          <!-- TOP HEADER: LOGO & STATUS BADGE -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <a href="${appBaseUrl}" style="text-decoration: none;">
                      <span style="font-weight: 900; font-size: 22px; color: #0F172A; letter-spacing: -0.03em;">NextDoor<span style="color: #10B981;">Clinic</span></span>
                    </a>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-size: 11px; font-weight: 800; color: ${badgeColor}; text-transform: uppercase; letter-spacing: 0.08em;">${badgeText}</span>
                  </td>
                </tr>
              </table>
              <!-- EMERALD HEADER DIVIDER LINE -->
              <div style="height: 2px; background-color: #10B981; margin-top: 14px; margin-bottom: 28px;"></div>
            </td>
          </tr>

          <!-- MAIN HEADING & GREETING -->
          <tr>
            <td style="padding-bottom: 24px;">
              <h1 class="main-heading" style="font-size: 26px; font-weight: 800; color: #0F172A; margin: 0 0 14px 0; letter-spacing: -0.02em;">${mainTitle}</h1>
              <p style="font-size: 14px; line-height: 22px; color: #334155; margin: 0;">${introText}</p>
            </td>
          </tr>

          <!-- APPOINTMENT SUMMARY SECTION (UN-CARDED / RESPONSIVE TABLE) -->
          <tr>
            <td style="padding-bottom: 28px;">
              <p style="font-size: 11px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 14px 0;">${summaryTitle}</p>
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 22px;">
                <tr>
                  <td class="summary-label" style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #64748B; font-weight: 500;" width="38%">Treatment / Service</td>
                  <td class="summary-value" style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #0F172A; font-weight: 700;" align="right">${serviceName}</td>
                </tr>
                <tr>
                  <td class="summary-label" style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #64748B; font-weight: 500;">Healthcare Clinic</td>
                  <td class="summary-value" style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #0F172A; font-weight: 700;" align="right">${providerName}</td>
                </tr>
                <tr>
                  <td class="summary-label" style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #64748B; font-weight: 500;">Date & Time</td>
                  <td class="summary-value" style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #0F172A; font-weight: 700;" align="right">${formattedTime}</td>
                </tr>
                <tr>
                  <td class="summary-label" style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #64748B; font-weight: 500;">Booking Reference</td>
                  <td class="summary-value" style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; color: #10B981; font-weight: 800; font-family: monospace; font-size: 14px;" align="right">${bookingId}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- IMPORTANT PATIENT GUIDANCE BOX (GREEN LEFT BORDER) -->
          ${
            guidanceItems.length > 0
              ? `
          <tr>
            <td style="padding-bottom: 28px;">
              <div style="border-left: 3px solid #10B981; padding-left: 16px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 10px 0;">${guidanceTitle}</h3>
                <ul style="margin: 0; padding-left: 16px; font-size: 13px; line-height: 22px; color: #334155;">
                  ${guidanceItems
                    .map(
                      (item) =>
                        `<li style="margin-bottom: 4px;"><strong>${item.label}:</strong> ${item.text}</li>`
                    )
                    .join("")}
                </ul>
              </div>
            </td>
          </tr>
          `
              : ""
          }

          <!-- CTA BUTTON -->
          <tr>
            <td style="padding-bottom: 24px;">
              <a href="${ctaUrl}" class="cta-btn" style="background-color: #10B981; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block;">${ctaText}</a>
            </td>
          </tr>

          <!-- CLOSING TEXT -->
          <tr>
            <td style="padding-bottom: 32px;">
              <p style="font-size: 13px; color: #64748B; margin: 0;">${closingText}</p>
            </td>
          </tr>

          <!-- PROMOTIONAL BANNER -->
          <tr>
            <td style="padding-bottom: 32px;">
              <a href="${appBaseUrl}" style="display: block; text-decoration: none;">
                <img src="${bannerUrl}" alt="Better Health, Made Simple. NextDoorClinic" width="580" style="width: 100%; max-width: 580px; height: auto; display: block; border-radius: 12px; border: 0;" />
              </a>
            </td>
          </tr>

          <!-- NEED HELP SECTION -->
          <tr>
            <td style="padding-bottom: 28px;">
              <h4 style="font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 6px 0;">Need Help with your Booking or Account?</h4>
              <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 20px;">
                Our patient care team is available 7 days a week. Visit our <a href="${appBaseUrl}/help" style="color: #10B981; font-weight: 700; text-decoration: none;">Help & Support Center</a> or email <a href="mailto:support@nextdoorclinic.com" style="color: #10B981; font-weight: 700; text-decoration: none;">support@nextdoorclinic.com</a>.
              </p>
            </td>
          </tr>

          <!-- LEGAL FOOTER -->
          <tr>
            <td style="border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 11px; color: #94A3B8; line-height: 18px;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #475569;">NextDoorClinic Ltd • Digital Healthcare Platform</p>
              <p style="margin: 0 0 8px 0;">Registered in England & Wales • Care Quality Commission (CQC) & ICO Compliant</p>
              <p style="margin: 0; font-size: 10px; color: #94A3B8;">
                This automated transactional message was sent regarding your activity on NextDoorClinic. Please do not reply directly to this automated email address.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getDefaultEmailTemplate(name: string) {
  const appBaseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  switch (name) {
    case "BOOKING_RESERVATION":
      return {
        subject: "Appointment Reservation Received - Ref: {{bookingId}} ⏳",
        body: renderEmailTemplateLayout({
          title: "Appointment Reservation Received",
          badgeText: "RESERVATION RECEIVED",
          badgeColor: "#10B981",
          mainTitle: "Appointment Reservation Received",
          introText:
            "Hello <strong>{{patientName}}</strong>, your appointment reservation at <strong>{{providerName}}</strong> has been received and is being processed by our clinical team.",
          guidanceTitle: "Important Patient Guidance:",
          guidanceItems: [
            { label: "Arrival", text: "Please arrive 5 minutes prior to your scheduled time." },
            {
              label: "What to bring",
              text: "Photo ID, NHS number (if applicable), and list of current medications.",
            },
            {
              label: "Confirmation",
              text: "The clinic team will review and confirm your reservation shortly.",
            },
            {
              label: "Changes",
              text: "You can view or update your reservation in the patient portal.",
            },
          ],
          ctaText: "View Reservation in Patient Portal",
          ctaUrl: `${appBaseUrl}/patient/dashboard`,
        }),
      };

    case "BOOKING_CONFIRMATION":
      return {
        subject: "Your Appointment is Confirmed! - Ref: {{bookingId}} 📅",
        body: renderEmailTemplateLayout({
          title: "Your Appointment is Confirmed!",
          badgeText: "CONFIRMED APPOINTMENT",
          badgeColor: "#10B981",
          mainTitle: "Your Appointment is Confirmed!",
          introText:
            "Hello <strong>{{patientName}}</strong>, your appointment at <strong>{{providerName}}</strong> has been successfully booked and confirmed. We look forward to providing your healthcare service.",
          guidanceTitle: "Important Patient Guidance:",
          guidanceItems: [
            { label: "Arrival", text: "Please arrive 5 minutes prior to your scheduled time." },
            {
              label: "What to bring",
              text: "Photo ID, NHS number (if applicable), and list of current medications.",
            },
            {
              label: "Clothing",
              text: "Wear loose clothing around arms/shoulders for vaccination appointments.",
            },
            {
              label: "Changes",
              text: "You can reschedule or cancel free of charge up to 24 hours in advance.",
            },
          ],
          ctaText: "Manage Booking in Patient Portal",
          ctaUrl: `${appBaseUrl}/patient/dashboard`,
        }),
      };

    case "BOOKING_RESCHEDULED":
      return {
        subject: "Your Appointment has been Rescheduled - Ref: {{bookingId}} 🔄",
        body: renderEmailTemplateLayout({
          title: "Your Appointment has been Rescheduled!",
          badgeText: "RESCHEDULED APPOINTMENT",
          badgeColor: "#10B981",
          mainTitle: "Your Appointment has been Rescheduled!",
          introText:
            "Hello <strong>{{patientName}}</strong>, your appointment at <strong>{{providerName}}</strong> has been successfully rescheduled to a new requested time slot.",
          guidanceTitle: "Important Patient Guidance:",
          guidanceItems: [
            {
              label: "New Date & Time",
              text: "Please verify your updated date and time in the summary above.",
            },
            { label: "Arrival", text: "Please arrive 5 minutes prior to your updated time." },
            {
              label: "What to bring",
              text: "Photo ID, NHS number (if applicable), and list of current medications.",
            },
            {
              label: "Changes",
              text: "Further changes can be made up to 24 hours prior to your visit.",
            },
          ],
          ctaText: "Manage Booking in Patient Portal",
          ctaUrl: `${appBaseUrl}/patient/dashboard`,
        }),
      };

    case "BOOKING_CANCELLATION":
      return {
        subject: "Your Appointment has been Cancelled - Ref: {{bookingId}} ❌",
        body: renderEmailTemplateLayout({
          title: "Your Appointment has been Cancelled",
          badgeText: "APPOINTMENT CANCELLED",
          badgeColor: "#EF4444",
          mainTitle: "Your Appointment has been Cancelled",
          introText:
            "Hello <strong>{{patientName}}</strong>, your appointment at <strong>{{providerName}}</strong> has been cancelled.",
          guidanceTitle: "Important Cancellation Notice:",
          guidanceItems: [
            {
              label: "Refunds",
              text: "If you paid online, any eligible refund will be credited back to your account within 3-5 business days.",
            },
            {
              label: "Rebooking",
              text: "You can browse alternative clinical slots or book a new appointment at any time.",
            },
            {
              label: "Support",
              text: "Contact our patient care team if you have any questions regarding your cancellation.",
            },
          ],
          ctaText: "Browse Alternative Slots",
          ctaUrl: `${appBaseUrl}/search`,
        }),
      };

    case "PATIENT_WELCOME":
      return {
        subject: "Welcome to NextDoorClinic! 🎁 Enjoy 15% Off Your First Booking",
        body: renderEmailTemplateLayout({
          title: "Welcome to NextDoorClinic!",
          badgeText: "WELCOME TO NEXTDOORCLINIC",
          badgeColor: "#10B981",
          mainTitle: "Welcome to NextDoorClinic!",
          introText:
            "Hello <strong>{{patientName}}</strong>, welcome to NextDoorClinic! Your patient account has been created. You can now search local pharmacies, book clinical treatments in under 60 seconds, and track your healthcare journey.",
          summaryTitle: "FEATURED HEALTHCARE SERVICES",
          serviceName: "Travel Health & Vaccinations",
          providerName: "Partnered GPhC Pharmacies",
          formattedTime: "Book Online 24/7",
          bookingId: "WELCOME15 (-15%)",
          guidanceTitle: "Exclusive Welcome Perks & Guidance:",
          guidanceItems: [
            {
              label: "Welcome Offer",
              text: "Use promo code <strong>WELCOME15</strong> to receive 15% off your first private consultation or travel vaccine.",
            },
            {
              label: "Instant Bookings",
              text: "Schedule travel health, comprehensive blood tests, ear microsuction, and flu vaccinations in under 60 seconds.",
            },
            {
              label: "Patient Dashboard",
              text: "View your upcoming appointments, prescription notes, and receipt records anytime.",
            },
            {
              label: "Verified Care",
              text: "All partner clinics are GPhC and CQC verified with 100% encrypted medical records.",
            },
          ],
          ctaText: "Explore Healthcare Services & Book",
          ctaUrl: `${appBaseUrl}/search`,
          closingText: "We look forward to supporting your health and wellness journey.",
        }),
      };

    case "EMAIL_VERIFICATION":
      return {
        subject: "Verify Your Email Address - NextDoorClinic 🔐",
        body: renderEmailTemplateLayout({
          title: "Security Verification Code",
          badgeText: "SECURITY VERIFICATION",
          badgeColor: "#10B981",
          mainTitle: "Security Verification Code",
          introText:
            "Hello <strong>{{patientName}}</strong>, enter this One-Time Password (OTP) in your browser to verify your email address: <br/><br/><span style='font-family: monospace; font-size: 32px; font-weight: 800; color: #10B981; letter-spacing: 0.15em;'>{{otp}}</span>",
          summaryTitle: "VERIFICATION DETAILS",
          guidanceTitle: "Security Guidance:",
          guidanceItems: [
            { label: "Expiry", text: "This security code expires in 10 minutes." },
            { label: "Privacy", text: "Never disclose this verification code to anyone." },
            {
              label: "Notice",
              text: "NextDoorClinic staff will never ask for your verification code.",
            },
          ],
          ctaText: "Go to Login",
          ctaUrl: `${appBaseUrl}/login`,
        }),
      };

    default:
      return {
        subject: "Notification - NextDoorClinic",
        body: renderEmailTemplateLayout({
          title: "Notification",
          badgeText: "NOTIFICATION",
          badgeColor: "#10B981",
          mainTitle: "NextDoorClinic Notification",
          introText:
            "Hello, you have a new transactional notification regarding your account activity.",
          ctaText: "View Patient Portal",
          ctaUrl: `${appBaseUrl}/patient/dashboard`,
        }),
      };
  }
}

export async function getRenderedTemplate(name: string, variables: Record<string, string>) {
  let dbTemplate = null;
  try {
    dbTemplate = await db.emailTemplate.findUnique({ where: { name } });
  } catch (err) {
    console.warn("⚠️ Failed to load email template from DB, using default:", err);
  }

  const templateData =
    dbTemplate && dbTemplate.body
      ? { subject: dbTemplate.subject, body: dbTemplate.body }
      : getDefaultEmailTemplate(name);

  let subject = templateData.subject;
  let html = templateData.body;

  for (const [key, value] of Object.entries(variables)) {
    const reg = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    subject = subject.replace(reg, value || "");
    html = html.replace(reg, value || "");
  }

  return { subject, html };
}
