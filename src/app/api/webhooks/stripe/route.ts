import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const eventId = body.id || `evt_${Date.now()}`;
    const eventType = body.type || "unknown_event";

    // Save webhook event to DB for audit verification
    await db.webhookEvent.upsert({
      where: { eventId },
      update: { processedAt: new Date() },
      create: {
        eventId,
        eventType,
        payload: body,
      },
    });

    if (eventType === "payment_intent.succeeded") {
      const intent = body.data?.object;
      if (intent && intent.metadata?.appointmentId) {
        await db.payment.updateMany({
          where: { appointmentId: intent.metadata.appointmentId },
          data: { status: "COMPLETED", stripePaymentIntentId: intent.id },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Stripe Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
