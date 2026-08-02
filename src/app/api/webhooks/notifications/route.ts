import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Handle Twilio SMS/WhatsApp Delivery Status Callbacks (application/x-www-form-urlencoded)
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const messageSid = formData.get("MessageSid") as string;
      const messageStatus = ((formData.get("MessageStatus") as string) || "").toUpperCase(); // delivered, failed, undelivered, sent
      const toPhone = formData.get("To") as string;

      if (messageSid && messageStatus) {
        const normalizedStatus =
          messageStatus === "DELIVERED"
            ? "DELIVERED"
            : messageStatus === "FAILED" || messageStatus === "UNDELIVERED"
              ? "FAILED"
              : "SENT";

        // Update SmsLog / CommunicationsLog
        await db.smsLog.updateMany({
          where: { recipientPhone: toPhone },
          data: { status: normalizedStatus },
        });

        console.log(`📱 Twilio Delivery Callback: ${toPhone} -> ${normalizedStatus}`);
      }

      return NextResponse.json({ success: true });
    }

    // 2. Handle Resend Email Webhook Events (application/json)
    const body = await req.json();
    const eventType = body.type; // email.sent, email.delivered, email.bounced
    const recipient = body.data?.to?.[0];

    if (eventType && recipient) {
      let emailStatus = "SENT";
      if (eventType === "email.delivered") emailStatus = "DELIVERED";
      if (eventType === "email.bounced" || eventType === "email.failed") emailStatus = "BOUNCED";

      await db.emailLog.updateMany({
        where: { recipient },
        data: { status: emailStatus },
      });

      console.log(`📧 Resend Email Callback: ${recipient} -> ${emailStatus}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Notification Webhook Callback Exception:", error);
    return NextResponse.json({ error: "Notification webhook processing error" }, { status: 500 });
  }
}
