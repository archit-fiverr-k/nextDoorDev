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

  const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

  return {
    client,
    smsSender,
    whatsappSender,
  };
}

/**
 * Sends a standard SMS message via Twilio.
 * If credentials are not present, logs the message details in the terminal console.
 */
export async function sendSMS({ to, body }: SendMessageOptions) {
  const { client, smsSender } = await getTwilioConfig();

  if (!client) {
    console.log("\n=========================================");
    console.log(`📱 [MOCK SMS DISPATCHED]`);
    console.log(`To: ${to}`);
    console.log(`Body: ${body}`);
    console.log("=========================================\n");
    return { success: true, sid: "mock-sms-sid" };
  }

  try {
    if (!smsSender) {
      throw new Error(
        "Twilio Phone Number (Sender) is not configured in integrations settings or environment variables"
      );
    }

    const message = await client.messages.create({
      body,
      from: smsSender,
      to,
    });

    console.log(`✅ Twilio SMS dispatched successfully. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error("❌ Failed to send SMS via Twilio:", error);
    return { success: false, error: error.message || error };
  }
}

/**
 * Sends a WhatsApp message via Twilio.
 * If credentials are not present, logs the message details in the terminal console.
 */
export async function sendWhatsapp({ to, body }: SendMessageOptions) {
  const { client, whatsappSender } = await getTwilioConfig();

  if (!client) {
    console.log("\n=========================================");
    console.log(`💬 [MOCK WHATSAPP DISPATCHED]`);
    console.log(`To: ${to}`);
    console.log(`Body: ${body}`);
    console.log("=========================================\n");
    return { success: true, sid: "mock-whatsapp-sid" };
  }

  try {
    if (!whatsappSender) {
      throw new Error(
        "Twilio WhatsApp Number (Sender) is not configured in integrations settings or environment variables"
      );
    }

    // Twilio WhatsApp integration requires formatting with prefix 'whatsapp:'
    const formattedFrom = whatsappSender.startsWith("whatsapp:")
      ? whatsappSender
      : `whatsapp:${whatsappSender}`;
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const message = await client.messages.create({
      body,
      from: formattedFrom,
      to: formattedTo,
    });

    console.log(`✅ Twilio WhatsApp message dispatched successfully. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error("❌ Failed to send WhatsApp message via Twilio:", error);
    return { success: false, error: error.message || error };
  }
}
