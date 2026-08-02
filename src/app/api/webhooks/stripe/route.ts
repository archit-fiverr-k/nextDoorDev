import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    console.error("❌ Stripe credentials missing in environment variables.");
    return NextResponse.json({ error: "Stripe credentials missing" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16" as any,
  });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("❌ Stripe Webhook Signature Verification Failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`🔔 Stripe Webhook Received: ${event.type} [${event.id}]`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const pharmacyId = session.metadata?.pharmacyId || session.client_reference_id;
        const planTier = session.metadata?.planTier || "STARTER";

        if (pharmacyId) {
          const subscriptionId =
            typeof session.subscription === "string" ? session.subscription : null;
          const customerId = typeof session.customer === "string" ? session.customer : null;

          await db.pharmacy.update({
            where: { id: pharmacyId },
            data: {
              subscriptionPlan: planTier,
              subscriptionStatus: "ACTIVE",
              ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
              ...(customerId ? { stripeCustomerId: customerId } : {}),
            },
          });
          console.log(
            `✅ Pharmacy Subscription Activated via Checkout: ${pharmacyId} -> Plan: ${planTier}`
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : null;

        if (customerId) {
          const status =
            subscription.status === "active"
              ? "ACTIVE"
              : subscription.status === "past_due"
                ? "PAST_DUE"
                : "CANCELLED";
          const periodEndUnix = (subscription as any).current_period_end;
          const currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;

          await db.pharmacy.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionStatus: status,
              ...(currentPeriodEnd ? { subscriptionCurrentPeriodEnd: currentPeriodEnd } : {}),
            },
          });
          console.log(
            `ℹ️ Pharmacy Subscription Updated: Customer ${customerId} -> Status: ${status}`
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : null;

        if (customerId) {
          await db.pharmacy.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionStatus: "CANCELLED",
              subscriptionPlan: "FREE",
            },
          });
          console.log(`🛑 Pharmacy Subscription Cancelled: Customer ${customerId}`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        // Update Payment status to CAPTURED
        const payment = await db.payment.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });

        if (payment) {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: "CAPTURED" },
          });

          // Confirm associated appointment if pending
          if (payment.appointmentId) {
            await db.appointment.update({
              where: { id: payment.appointmentId },
              data: { status: "CONFIRMED" },
            });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;

        const payment = await db.payment.findFirst({
          where: { stripePaymentIntentId: paymentIntentId },
        });

        if (payment) {
          await db.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string" ? charge.payment_intent : null;

        if (paymentIntentId) {
          const payment = await db.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (payment) {
            const isFullRefund = charge.amount_refunded >= charge.amount;
            await db.payment.update({
              where: { id: payment.id },
              data: { status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED" },
            });
          }
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId =
          typeof dispute.payment_intent === "string" ? dispute.payment_intent : null;

        if (paymentIntentId) {
          const payment = await db.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (payment) {
            await db.payment.update({
              where: { id: payment.id },
              data: { status: "DISPUTED" },
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (dbErr: any) {
    console.error("❌ Stripe Webhook Processing Error:", dbErr);
    return NextResponse.json({ error: "Webhook processing exception" }, { status: 500 });
  }
}
