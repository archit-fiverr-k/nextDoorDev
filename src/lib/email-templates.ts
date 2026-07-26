import { db } from "@/lib/db";
import { env } from "@/lib/env";

export type StatusBadgeType =
  "CONFIRMED" | "REMINDER" | "RESCHEDULED" | "CANCELLED" | "COMPLETED" | "VERIFIED";

export function getStatusBadgeHtml(type: StatusBadgeType, labelOverride?: string) {
  let bgColor = "#ECFDF5";
  let textColor = "#047857";
  let borderColor = "#A7F3D0";
  let text = labelOverride || "Confirmed";

  switch (type) {
    case "CONFIRMED":
      bgColor = "#ECFDF5";
      textColor = "#047857";
      borderColor = "#A7F3D0";
      text = labelOverride || "Confirmed";
      break;
    case "REMINDER":
      bgColor = "#FEF3C7";
      textColor = "#B45309";
      borderColor = "#FDE68A";
      text = labelOverride || "Reminder";
      break;
    case "RESCHEDULED":
      bgColor = "#EFF6FF";
      textColor = "#1D4ED8";
      borderColor = "#BFDBFE";
      text = labelOverride || "Rescheduled";
      break;
    case "CANCELLED":
      bgColor = "#FEF2F2";
      textColor = "#B91C1C";
      borderColor = "#FECACA";
      text = labelOverride || "Cancelled";
      break;
    case "COMPLETED":
    case "VERIFIED":
      bgColor = "#F1F5F9";
      textColor = "#475569";
      borderColor = "#E2E8F0";
      text = labelOverride || (type === "VERIFIED" ? "Verified" : "Completed");
      break;
  }

  return `
    <span style="display: inline-block; padding: 6px 14px; background-color: ${bgColor}; border: 1px solid ${borderColor}; color: ${textColor}; font-size: 11px; font-weight: 800; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      ${text}
    </span>
  `;
}

export function getDefaultEmailTemplate(name: string) {
  const brandEmerald = "#10B981";
  const brandNavy = "#0F172A";
  const textMuted = "#64748B";
  const textDark = "#334155";
  const borderLight = "#E2E8F0";
  const bgCard = "#F8FAFC";
  const appBaseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const logoUrl = `${appBaseUrl}/assets/header-logo.png`;
  const bannerUrl =
    "https://res.cloudinary.com/freefiresaga/image/upload/v1785090150/promotion_2068_x_760_converted_xvsqev.webp";

  const getHeader = (title: string, badgeType: StatusBadgeType, badgeLabel?: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; padding: 12px !important; }
          .content-card { padding: 24px 18px !important; border-radius: 12px !important; }
          .email-title { font-size: 22px !important; line-height: 28px !important; }
          .hero-subtitle { font-size: 14px !important; line-height: 20px !important; }
          .btn-primary { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          .btn-secondary { display: block !important; width: 100% !important; margin-bottom: 8px !important; text-align: center !important; box-sizing: border-box !important; }
          .mobile-stack { display: block !important; width: 100% !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: ${textDark};">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F1F5F9; table-layout: fixed; padding: 24px 8px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 640px; margin: 0 auto;">
              <!-- Outer White Card Wrapper -->
              <tr>
                <td class="content-card" style="background-color: #FFFFFF; border-radius: 16px; padding: 36px 36px; border: 1px solid #E2E8F0; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);">
                  <!-- Header Row: Logo & Status Badge -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px; border-bottom: 1px solid ${borderLight}; padding-bottom: 20px;">
                    <tr>
                      <td align="left" style="vertical-align: middle;">
                        <a href="${appBaseUrl}" style="text-decoration: none;">
                          <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 900; font-size: 22px; color: ${brandNavy}; tracking: -0.03em;">NextDoor<span style="color: ${brandEmerald};">Clinic</span></span>
                        </a>
                      </td>
                      <td align="right" style="vertical-align: middle;">
                        ${getStatusBadgeHtml(badgeType, badgeLabel)}
                      </td>
                    </tr>
                  </table>
  `;

  const getFooter = () => `
                  <!-- Recommended Healthcare Services (Marketing Block) -->
                  <div style="margin-top: 36px; border-top: 1px solid ${borderLight}; padding-top: 28px;">
                    <p style="font-size: 11px; font-weight: 800; color: ${brandEmerald}; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px 0;">RECOMMENDED HEALTHCARE SERVICES</p>
                    <h3 style="font-size: 16px; font-weight: 800; color: ${brandNavy}; margin: 0 0 16px 0;">Preventative Care & Clinical Treatments</h3>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <span style="font-size: 20px;">💉</span>
                              </td>
                              <td style="vertical-align: middle; padding-left: 10px;">
                                <strong style="font-size: 13px; color: ${brandNavy}; display: block;">Travel Vaccinations</strong>
                                <span style="font-size: 11px; color: ${textMuted}; display: block;">Yellow Fever, Rabies, Typhoid & Travel Health Advice</span>
                              </td>
                              <td align="right" style="vertical-align: middle;">
                                <a href="${appBaseUrl}/search?service=Travel+Vaccination" style="font-size: 12px; font-weight: 700; color: ${brandEmerald}; text-decoration: none;">Book &rarr;</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <span style="font-size: 20px;">🩸</span>
                              </td>
                              <td style="vertical-align: middle; padding-left: 10px;">
                                <strong style="font-size: 13px; color: ${brandNavy}; display: block;">Comprehensive Blood Testing</strong>
                                <span style="font-size: 11px; color: ${textMuted}; display: block;">Full Health Profile, Hormones, Vitamins & Cholesterol</span>
                              </td>
                              <td align="right" style="vertical-align: middle;">
                                <a href="${appBaseUrl}/search?service=Blood+Test" style="font-size: 12px; font-weight: 700; color: ${brandEmerald}; text-decoration: none;">Book &rarr;</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td width="36" style="vertical-align: middle;">
                                <span style="font-size: 20px;">👂</span>
                              </td>
                              <td style="vertical-align: middle; padding-left: 10px;">
                                <strong style="font-size: 13px; color: ${brandNavy}; display: block;">Ear Wax Removal</strong>
                                <span style="font-size: 11px; color: ${textMuted}; display: block;">Gentle microsuction by trained clinical pharmacists</span>
                              </td>
                              <td align="right" style="vertical-align: middle;">
                                <a href="${appBaseUrl}/search?service=Ear+Wax+Removal" style="font-size: 12px; font-weight: 700; color: ${brandEmerald}; text-decoration: none;">Book &rarr;</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Patient Trust & Benefits -->
                  <div style="margin-top: 28px; background-color: ${bgCard}; border-radius: 12px; padding: 18px; border: 1px solid #E2E8F0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 11px; color: ${textMuted};">
                      <tr>
                        <td width="50%" style="padding: 4px 0;">🔒 <strong>100% Encrypted Records</strong></td>
                        <td width="50%" style="padding: 4px 0;">👨‍⚕️ <strong>CQC & GPhC Verified</strong></td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 4px 0;">⚡ <strong>Book in under 60 seconds</strong></td>
                        <td width="50%" style="padding: 4px 0;">💻 <strong>Online Management</strong></td>
                      </tr>
                    </table>
                  </div>

                  <!-- Branding Promotion Banner -->
                  <div style="margin-top: 28px;">
                    <a href="${appBaseUrl}" style="display: block; text-decoration: none;">
                      <img src="${bannerUrl}" alt="NextDoorClinic - Primary Healthcare Services" width="580" style="width: 100%; max-width: 580px; height: auto; display: block; border: 0; border-radius: 10px; background-color: ${bgCard}; text-align: center; font-size: 12px; color: ${textMuted};" />
                    </a>
                  </div>

                  <!-- Patient Support Card -->
                  <div style="margin-top: 28px; border-top: 1px solid ${borderLight}; padding-top: 24px;">
                    <h4 style="font-size: 14px; font-weight: 800; color: ${brandNavy}; margin: 0 0 6px 0;">Need Help with your Appointment?</h4>
                    <p style="font-size: 12px; line-height: 18px; color: ${textMuted}; margin: 0 0 12px 0;">Our UK-based patient care team is available 7 days a week to support your booking.</p>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; font-weight: 700;">
                      <tr>
                        <td style="padding-right: 12px;">
                          <a href="${appBaseUrl}/help" style="color: ${brandEmerald}; text-decoration: none;">💬 Live Chat / Help Center</a>
                        </td>
                        <td>
                          <a href="mailto:support@nextdoorclinic.com" style="color: ${brandEmerald}; text-decoration: none;">✉️ support@nextdoorclinic.com</a>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Footer Legal & Copyright -->
                  <div style="margin-top: 32px; border-top: 1px solid ${borderLight}; padding-top: 20px; font-size: 11px; color: #94A3B8; line-height: 18px;">
                    <p style="margin: 0 0 4px 0; font-weight: 700; color: ${brandNavy};">NextDoorClinic Ltd &bull; Primary Healthcare & Pharmacy Marketplace</p>
                    <p style="margin: 0 0 8px 0;">Registered in England & Wales &bull; Care Quality Commission (CQC) Compliant</p>
                    <p style="margin: 0; font-size: 10px; color: #CBD5E1;">
                      <a href="${appBaseUrl}/privacy" style="color: #94A3B8; text-decoration: underline;">Privacy Policy</a> &bull; 
                      <a href="${appBaseUrl}/terms" style="color: #94A3B8; text-decoration: underline;">Terms of Service</a> &bull; 
                      <a href="${appBaseUrl}/help" style="color: #94A3B8; text-decoration: underline;">Patient Support</a>
                    </p>
                  </div>
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
    case "BOOKING_CONFIRMATION":
      return {
        subject: "Your Appointment is Confirmed - Ref: {{bookingId}} 📅",
        body: `
          ${getHeader("Booking Confirmation", "CONFIRMED", "Confirmed")}
          <!-- Hero Section -->
          <div style="text-align: center; padding: 12px 0 28px 0;">
            <div style="width: 56px; height: 56px; background-color: #ECFDF5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid #A7F3D0;">
              <span style="font-size: 28px; line-height: 56px;">✅</span>
            </div>
            <h1 class="email-title" style="font-size: 24px; font-weight: 900; color: ${brandNavy}; margin: 0 0 8px 0; tracking: -0.03em;">Your Appointment Is Confirmed</h1>
            <p class="hero-subtitle" style="font-size: 15px; color: ${textMuted}; margin: 0; line-height: 22px;">We're looking forward to seeing you at <strong>{{providerName}}</strong>.</p>
          </div>

          <!-- Appointment Summary Card -->
          <div style="background-color: ${bgCard}; border-radius: 14px; padding: 24px; border: 1px solid ${borderLight}; margin-bottom: 28px;">
            <p style="font-size: 11px; font-weight: 800; color: ${brandEmerald}; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 14px 0;">APPOINTMENT DETAILS</p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${textMuted}; font-weight: 600;" width="38%">📋 Treatment / Service</td>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${brandNavy}; font-weight: 800;" align="right">{{serviceName}}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${textMuted}; font-weight: 600;">📍 Healthcare Clinic</td>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${brandNavy}; font-weight: 800;" align="right">{{providerName}}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${textMuted}; font-weight: 600;">📅 Date & Time</td>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${brandNavy}; font-weight: 800;" align="right"><span style="background-color: #ECFDF5; color: #047857; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 800;">{{formattedTime}}</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${textMuted}; font-weight: 600;">🔖 Booking Reference</td>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${brandEmerald}; font-weight: 900; font-family: monospace; font-size: 14px;" align="right">{{bookingId}}</td>
              </tr>
            </table>
          </div>

          <!-- CTAs -->
          <div style="margin-bottom: 32px; text-align: center;">
            <a href="${appBaseUrl}/patient/appointments/{{bookingId}}" class="btn-primary" style="background-color: ${brandEmerald}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); margin-bottom: 12px;">Manage Appointment</a>
            
            <div style="margin-top: 12px;">
              <a href="https://maps.google.com/?q={{providerName}}" class="btn-secondary" style="font-size: 12px; font-weight: 700; color: ${brandNavy}; background-color: #F1F5F9; padding: 8px 16px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 0 4px 6px 4px;">📍 Get Directions</a>
              <a href="${appBaseUrl}/patient/appointments/{{bookingId}}/calendar" class="btn-secondary" style="font-size: 12px; font-weight: 700; color: ${brandNavy}; background-color: #F1F5F9; padding: 8px 16px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 0 4px 6px 4px;">🗓️ Add to Calendar</a>
            </div>
          </div>

          <!-- Patient Preparation Information Card -->
          <div style="border-left: 4px solid ${brandEmerald}; background-color: #FAFAFA; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 32px;">
            <h3 style="font-size: 14px; font-weight: 800; color: ${brandNavy}; margin: 0 0 10px 0;">Patient Preparation Guidance</h3>
            <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 22px; color: ${textDark};">
              <li style="margin-bottom: 4px;">⏱️ <strong>Arrive Early:</strong> Please arrive 5 minutes prior to your allocated appointment time.</li>
              <li style="margin-bottom: 4px;">🪪 <strong>What to Bring:</strong> Bring valid photo ID and a list of any current medications.</li>
              <li style="margin-bottom: 4px;">👕 <strong>Attire:</strong> Wear comfortable, loose-fitting clothing around arms for vaccinations.</li>
              <li style="margin-bottom: 0;">🔄 <strong>Cancellation Policy:</strong> Free rescheduling or cancellation up to 24 hours prior.</li>
            </ul>
          </div>
          ${getFooter()}
        `,
      };

    case "EMAIL_VERIFICATION":
      return {
        subject: "Verify Your Email Address - NextDoorClinic",
        body: `
          ${getHeader("Security Verification", "VERIFIED", "Verification")}
          <!-- Hero Section -->
          <div style="text-align: center; padding: 12px 0 24px 0;">
            <div style="width: 56px; height: 56px; background-color: #F1F5F9; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid ${borderLight};">
              <span style="font-size: 28px; line-height: 56px;">🔐</span>
            </div>
            <h1 class="email-title" style="font-size: 24px; font-weight: 900; color: ${brandNavy}; margin: 0 0 8px 0;">Security Verification Code</h1>
            <p class="hero-subtitle" style="font-size: 14px; color: ${textMuted}; margin: 0; line-height: 22px;">Enter this One-Time Password (OTP) in your browser to verify your account.</p>
          </div>

          <!-- OTP Card -->
          <div style="background-color: ${bgCard}; border-radius: 14px; padding: 24px; text-align: center; border: 1px solid ${borderLight}; margin-bottom: 28px;">
            <span style="font-family: monospace; font-size: 40px; font-weight: 900; letter-spacing: 0.22em; color: ${brandEmerald}; display: inline-block;">{{otp}}</span>
            <p style="font-size: 12px; color: ${textMuted}; margin: 12px 0 0 0;">This security code expires in <strong>10 minutes</strong>.</p>
          </div>

          <!-- Security Guidance -->
          <div style="border-left: 4px solid ${brandNavy}; padding-left: 16px; margin-bottom: 28px; font-size: 12px; color: ${textMuted}; line-height: 18px;">
            <p style="margin: 0 0 4px 0; font-weight: 700; color: ${brandNavy};">Security Notice:</p>
            <p style="margin: 0 0 4px 0;">&bull; Never disclose this verification code to anyone.</p>
            <p style="margin: 0;">&bull; NextDoorClinic staff will never ask for your verification code.</p>
          </div>
          ${getFooter()}
        `,
      };

    case "BOOKING_REMINDER":
      return {
        subject: "Upcoming Appointment Reminder - Ref: {{bookingId}} ⏰",
        body: `
          ${getHeader("Appointment Reminder", "REMINDER", "Reminder")}
          <!-- Hero Section -->
          <div style="text-align: center; padding: 12px 0 28px 0;">
            <div style="width: 56px; height: 56px; background-color: #FEF3C7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid #FDE68A;">
              <span style="font-size: 28px; line-height: 56px;">⏰</span>
            </div>
            <h1 class="email-title" style="font-size: 24px; font-weight: 900; color: ${brandNavy}; margin: 0 0 8px 0;">Your Appointment is Tomorrow</h1>
            <p class="hero-subtitle" style="font-size: 15px; color: ${textMuted}; margin: 0; line-height: 22px;">Friendly reminder for your visit to <strong>{{providerName}}</strong>.</p>
          </div>

          <!-- Summary Card -->
          <div style="background-color: ${bgCard}; border-radius: 14px; padding: 24px; border: 1px solid ${borderLight}; margin-bottom: 28px;">
            <p style="font-size: 11px; font-weight: 800; color: #B45309; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 14px 0;">RESERVATION SUMMARY</p>
            
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${textMuted}; font-weight: 600;" width="38%">📋 Service</td>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${brandNavy}; font-weight: 800;" align="right">{{serviceName}}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${textMuted}; font-weight: 600;">📍 Clinic</td>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${brandNavy}; font-weight: 800;" align="right">{{providerName}}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${textMuted}; font-weight: 600;">📅 Date & Time</td>
                <td style="padding: 10px 0; border-bottom: 1px solid ${borderLight}; color: ${brandNavy}; font-weight: 800;" align="right"><span style="background-color: #FEF3C7; color: #B45309; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 800;">{{formattedTime}}</span></td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 28px; text-align: center;">
            <a href="${appBaseUrl}/patient/appointments/{{bookingId}}" class="btn-primary" style="background-color: ${brandEmerald}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block;">Manage Appointment</a>
          </div>
          ${getFooter()}
        `,
      };

    case "BOOKING_CANCELLATION":
      return {
        subject: "Appointment Cancelled - Ref: {{bookingId}}",
        body: `
          ${getHeader("Appointment Cancellation", "CANCELLED", "Cancelled")}
          <!-- Hero Section -->
          <div style="text-align: center; padding: 12px 0 28px 0;">
            <div style="width: 56px; height: 56px; background-color: #FEF2F2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid #FECACA;">
              <span style="font-size: 28px; line-height: 56px;">❌</span>
            </div>
            <h1 class="email-title" style="font-size: 24px; font-weight: 900; color: ${brandNavy}; margin: 0 0 8px 0;">Appointment Cancelled</h1>
            <p class="hero-subtitle" style="font-size: 15px; color: ${textMuted}; margin: 0; line-height: 22px;">Your appointment for <strong>{{serviceName}}</strong> has been cancelled.</p>
          </div>

          <div style="border-left: 4px solid #EF4444; background-color: #FEF2F2; padding: 18px; border-radius: 0 10px 10px 0; margin-bottom: 28px; font-size: 13px; color: #991B1B; line-height: 20px;">
            If you paid online, any eligible refund will be credited to your card within 3-5 business days. If you wish to re-book, you can browse available slots online.
          </div>

          <div style="margin-bottom: 28px; text-align: center;">
            <a href="${appBaseUrl}/search" class="btn-primary" style="background-color: ${brandNavy}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block;">Find Alternative Clinics</a>
          </div>
          ${getFooter()}
        `,
      };

    case "PROVIDER_APPROVAL":
      return {
        subject: "Welcome to NextDoorClinic! Your Clinic Workspace is Approved 🎉",
        body: `
          ${getHeader("Partner Onboarding", "CONFIRMED", "Approved")}
          <div style="text-align: center; padding: 12px 0 28px 0;">
            <div style="width: 56px; height: 56px; background-color: #ECFDF5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid #A7F3D0;">
              <span style="font-size: 28px; line-height: 56px;">🎉</span>
            </div>
            <h1 class="email-title" style="font-size: 24px; font-weight: 900; color: ${brandNavy}; margin: 0 0 8px 0;">Welcome to NextDoorClinic!</h1>
            <p class="hero-subtitle" style="font-size: 15px; color: ${textMuted}; margin: 0; line-height: 22px;">Your pharmacy workspace for <strong>{{providerName}}</strong> is now active.</p>
          </div>

          <div style="margin-bottom: 28px; text-align: center;">
            <a href="{{loginUrl}}" class="btn-primary" style="background-color: ${brandEmerald}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block;">Access Partner Dashboard</a>
          </div>
          ${getFooter()}
        `,
      };

    case "PASSWORD_RESET":
      return {
        subject: "Reset Your Password - NextDoorClinic Security",
        body: `
          ${getHeader("Security Request", "VERIFIED", "Security")}
          <div style="text-align: center; padding: 12px 0 28px 0;">
            <div style="width: 56px; height: 56px; background-color: #F1F5F9; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid ${borderLight};">
              <span style="font-size: 28px; line-height: 56px;">🔑</span>
            </div>
            <h1 class="email-title" style="font-size: 24px; font-weight: 900; color: ${brandNavy}; margin: 0 0 8px 0;">Reset Your Password</h1>
            <p class="hero-subtitle" style="font-size: 14px; color: ${textMuted}; margin: 0; line-height: 22px;">We received a password reset request for <strong>{{userEmail}}</strong>.</p>
          </div>

          <div style="margin-bottom: 28px; text-align: center;">
            <a href="{{resetUrl}}" class="btn-primary" style="background-color: ${brandNavy}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block;">Reset Password</a>
          </div>
          ${getFooter()}
        `,
      };

    default:
      return {
        subject: "Notification - NextDoorClinic",
        body: `
          ${getHeader("Notification", "VERIFIED", "Notice")}
          <div style="padding: 24px 0;">
            <p style="font-size: 14px; color: ${textDark}; margin: 0;">Hello, you have a new notification from NextDoorClinic.</p>
          </div>
          ${getFooter()}
        `,
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
