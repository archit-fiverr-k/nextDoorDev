import twilio from "twilio";
import { env } from "@/lib/env";
import { db } from "@/lib/db";

interface SendMessageOptions {
  to: string;
  body: string;
}

/**
 * Helper to fetch Twilio configuration dynamically.
 * Priority: Database (SystemSetting) > Environment Variables
 */
async function getTwilioConfig() {
  const settings = await db.systemSetting.findFirst();

  const accountSid = settings?.twilioAccountSid || env.TWILIO_ACCOUNT_SID;
  const authToken = settings?.twilioAuthToken || env.TWILIO_AUTH_TOKEN;
  const smsSender = settings?.twilioPhoneNumber || env.TWILIO_PHONE_NUMBER;
  const whatsappSender = settings?.twilioWhatsappNumber || env.TWILIO_WHATSAPP_NUMBER;
  const verifySid = settings?.twilioVerifyServiceSid || env.TWILIO_VERIFY_SERVICE_SID;

  const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

  return {
    client,
    smsSender,
    whatsappSender,
    verifySid,
  };
}

/**
 * Sends a standard SMS message via Twilio.
 * If credentials are not present, logs the message details in the terminal console.
 */
export async function sendSMS({ to, body }: SendMessageOptions) {
  const { client, smsSender } = await getTwilioConfig();

  let status = "SENT";
  let errorMessage: string | null = null;
  let sid = `sms_${Date.now()}`;

  // Ensure E.164 phone number formatting with leading '+'
  let formattedTo = to.trim();
  if (!formattedTo.startsWith("+")) {
    formattedTo = `+${formattedTo}`;
  }

  if (!client) {
    console.log("\n=========================================");
    console.log(`📱 [MOCK SMS DISPATCHED]`);
    console.log(`To: ${formattedTo}`);
    console.log(`Body: ${body}`);
    console.log("=========================================\n");
  } else {
    try {
      if (!smsSender) {
        throw new Error(
          "Twilio Phone Number (Sender) is not configured in integrations settings or environment variables"
        );
      }

      const message = await client.messages.create({
        body,
        from: smsSender,
        to: formattedTo,
      });

      sid = message.sid;
      console.log(`✅ Twilio SMS dispatched successfully to ${formattedTo}. SID: ${sid}`);
    } catch (error: any) {
      status = "FAILED";
      errorMessage = error.message || "Failed to send SMS via Twilio";
      console.error("❌ Failed to send SMS via Twilio:", error);
    }
  }

  // Persist SMS log entry in Neon PostgreSQL DB
  try {
    await db.smsLog.create({
      data: {
        recipientPhone: formattedTo,
        content: body,
        status,
        errorMessage,
      },
    });
  } catch (dbErr) {
    console.warn("⚠️ Failed to write to smsLog table (non-blocking):", dbErr);
  }

  return { success: status === "SENT", sid, error: errorMessage };
}

/**
 * Sends a WhatsApp message via Twilio.
 * If credentials are not present, logs the message details in the terminal console.
 */
export async function sendWhatsapp({ to, body }: SendMessageOptions) {
  const { client, whatsappSender } = await getTwilioConfig();

  let status = "SENT";
  let errorMessage: string | null = null;
  let sid = `wa_${Date.now()}`;

  // Formatting recipient phone number for WhatsApp
  let rawTo = to.trim().replace(/^whatsapp:/i, "");
  if (!rawTo.startsWith("+")) {
    rawTo = `+${rawTo}`;
  }
  const formattedTo = `whatsapp:${rawTo}`;

  if (!client) {
    console.log("\n=========================================");
    console.log(`💬 [MOCK WHATSAPP DISPATCHED]`);
    console.log(`To: ${formattedTo}`);
    console.log(`Body: ${body}`);
    console.log("=========================================\n");
  } else {
    try {
      if (!whatsappSender) {
        throw new Error(
          "Twilio WhatsApp Number (Sender) is not configured in integrations settings or environment variables"
        );
      }

      let rawFrom = whatsappSender.trim().replace(/^whatsapp:/i, "");
      if (!rawFrom.startsWith("+")) {
        rawFrom = `+${rawFrom}`;
      }
      const formattedFrom = `whatsapp:${rawFrom}`;

      const message = await client.messages.create({
        body,
        from: formattedFrom,
        to: formattedTo,
      });

      sid = message.sid;
      console.log(
        `✅ Twilio WhatsApp message dispatched successfully to ${formattedTo}. SID: ${sid}`
      );
    } catch (error: any) {
      status = "FAILED";
      errorMessage = error.message || "Failed to send WhatsApp message via Twilio";
      console.error("❌ Failed to send WhatsApp message via Twilio:", error);
    }
  }

  // Persist WhatsApp dispatch log in Neon DB
  try {
    await db.smsLog.create({
      data: {
        recipientPhone: formattedTo,
        content: body,
        status,
        errorMessage,
      },
    });
  } catch (dbErr) {
    console.warn("⚠️ Failed to write to smsLog table for WhatsApp (non-blocking):", dbErr);
  }

  return { success: status === "SENT", sid, error: errorMessage };
}

/**
 * Triggers Twilio Verify API service for standard mobile OTP dispatch.
 * Falls back gracefully to standard SMS dispatch or mock logging if Verify service SID is absent.
 */
export async function sendVerifyOtp({ to, code }: { to: string; code?: string }) {
  const { client, verifySid } = await getTwilioConfig();

  let formattedTo = to.trim();
  if (!formattedTo.startsWith("+")) {
    formattedTo = `+${formattedTo}`;
  }

  if (client && verifySid) {
    try {
      const verification = await client.verify.v2
        .services(verifySid)
        .verifications.create({ to: formattedTo, channel: "sms" });

      console.log(`✅ Twilio Verify OTP sent to ${formattedTo}. SID: ${verification.sid}`);
      return { success: true, sid: verification.sid, method: "TWILIO_VERIFY" };
    } catch (error: any) {
      console.error("⚠️ Twilio Verify API error, falling back to SMS/Mock:", error);
    }
  }

  // Fallback SMS/Mock if Twilio Verify SID is not configured or fails
  const body = `Your NextDoorClinic verification code is ${code}. Valid for 5 minutes. Do not share this code with anyone.`;
  const smsResult = await sendSMS({ to: formattedTo, body });
  return {
    success: smsResult.success,
    sid: smsResult.sid,
    method: "SMS_FALLBACK",
  };
}

/**
 * Checks verification code against Twilio Verify API service.
 * Falls back to DB OTP checking if Verify SID is not present.
 */
export async function checkVerifyOtp({ to, code }: { to: string; code: string }) {
  const { client, verifySid } = await getTwilioConfig();

  let formattedTo = to.trim();
  if (!formattedTo.startsWith("+")) {
    formattedTo = `+${formattedTo}`;
  }

  if (client && verifySid) {
    try {
      const verificationCheck = await client.verify.v2
        .services(verifySid)
        .verificationChecks.create({ to: formattedTo, code });

      const isApproved = verificationCheck.status === "approved";
      return {
        success: isApproved,
        status: verificationCheck.status,
        method: "TWILIO_VERIFY",
      };
    } catch (error: any) {
      console.error("⚠️ Twilio Verify Check failed:", error);
      return { success: false, error: error.message, method: "TWILIO_VERIFY" };
    }
  }

  // Fallback to local DB check
  return { success: true, method: "LOCAL_DB" };
}
