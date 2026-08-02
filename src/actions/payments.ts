"use server";

import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { assertTenantAccess } from "@/lib/tenant-guard";
import Stripe from "stripe";
import { formatErrorMessage } from "@/lib/error-utils";

export async function processRefundAction(data: {
  paymentId: string;
  amount?: number;
  reason?: string;
}) {
  try {
    const session = await getRequiredSession();
    const payment = await db.payment.findUnique({
      where: { id: data.paymentId },
      include: { pharmacy: true },
    });

    if (!payment) {
      return { success: false, error: "Payment record not found." };
    }

    // Tenant authorization check
    assertTenantAccess(session, payment.pharmacyId, ["owner", "manager", "super_admin"]);

    const refundAmount = data.amount || Number(payment.amount);
    let stripeRefundId: string | null = null;

    // Process gateway refund if Stripe PaymentIntent exists
    if (payment.stripePaymentIntentId) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (stripeSecretKey) {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" as any });
        const stripeRefund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100), // convert GBP to pence
          reason: "requested_by_customer",
        });
        stripeRefundId = stripeRefund.id;
      }
    }

    // Create Refund DB Record
    const refund = await db.refund.create({
      data: {
        paymentId: payment.id,
        amount: refundAmount,
        reason: data.reason || "Patient appointment cancellation refund",
        stripeRefundId,
        status: "COMPLETED",
      },
    });

    // Update Payment Status
    const isFullRefund = refundAmount >= Number(payment.amount);
    const newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

    await db.payment.update({
      where: { id: payment.id },
      data: { status: newStatus },
    });

    // Audit Log Entry
    await db.auditLog.create({
      data: {
        pharmacyId: payment.pharmacyId,
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE",
        entityName: "Payment",
        entityId: payment.id,
        changes: {
          action: "REFUND",
          amount: refundAmount,
          refundId: refund.id,
          stripeRefundId,
          newStatus,
        },
      },
    });

    return {
      success: true,
      refundId: refund.id,
      newStatus,
    };
  } catch (error: any) {
    console.error("❌ processRefundAction failed:", error);
    return { success: false, error: formatErrorMessage(error) };
  }
}
