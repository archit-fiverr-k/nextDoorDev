"use server";

import { db } from "@/lib/db";
import { formatErrorMessage } from "@/lib/error-utils";
import { getAppBaseUrl } from "@/lib/url";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

export type SubscriptionPlanTier = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

const PLAN_PRICES: Record<
  SubscriptionPlanTier,
  { amountGbP: number; name: string; description: string }
> = {
  FREE: {
    amountGbP: 0,
    name: "Free Directory Tier",
    description: "Basic clinic listing on NextDoorClinic directory.",
  },
  STARTER: {
    amountGbP: 49,
    name: "Starter Clinic Plan",
    description: "Standard clinic listing, calendar booking engine, and SMS notifications.",
  },
  PRO: {
    amountGbP: 99,
    name: "Professional Practice Plan",
    description:
      "Multi-staff calendar management, WhatsApp dispatch, custom brand colors, and analytics.",
  },
  ENTERPRISE: {
    amountGbP: 199,
    name: "Enterprise Multi-Branch Plan",
    description: "Unlimited branches, dedicated account manager, API access, and priority support.",
  },
};

/**
 * Creates a Stripe Checkout Session for a Pharmacy B2B Subscription Plan
 */
export async function createPharmacySubscriptionCheckoutAction(params: {
  pharmacyId: string;
  planTier: SubscriptionPlanTier;
}) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return {
        success: false,
        error: "Stripe Secret Key is not configured in server environment variables.",
      };
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    const pharmacy = await db.pharmacy.findUnique({
      where: { id: params.pharmacyId },
    });

    if (!pharmacy) {
      return { success: false, error: "Pharmacy workspace not found." };
    }

    const planInfo = PLAN_PRICES[params.planTier] || PLAN_PRICES.STARTER;
    const baseUrl = getAppBaseUrl();

    // Create or reuse Stripe Customer ID
    let stripeCustomerId = pharmacy.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: pharmacy.email,
        name: pharmacy.displayName || pharmacy.name,
        metadata: {
          pharmacyId: pharmacy.id,
          pharmacySlug: pharmacy.slug,
        },
      });
      stripeCustomerId = customer.id;

      await db.pharmacy.update({
        where: { id: pharmacy.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      client_reference_id: pharmacy.id,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `NextDoorClinic - ${planInfo.name}`,
              description: planInfo.description,
            },
            unit_amount: planInfo.amountGbP * 100, // in pence
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        pharmacyId: pharmacy.id,
        planTier: params.planTier,
      },
      success_url: `${baseUrl}/pharmacy/settings?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pharmacy/settings?subscription=cancelled`,
    });

    return {
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  } catch (error: any) {
    console.error("❌ Failed to create pharmacy subscription checkout session:", error);
    return { success: false, error: formatErrorMessage(error) };
  }
}

/**
 * Creates a Stripe Customer Portal session allowing a Pharmacy Manager to update billing/card details
 */
export async function createPharmacyBillingPortalAction(pharmacyId: string) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return {
        success: false,
        error: "Stripe Secret Key is not configured in server environment variables.",
      };
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    });

    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
    });

    if (!pharmacy || !pharmacy.stripeCustomerId) {
      return {
        success: false,
        error:
          "No active Stripe customer account found for this pharmacy. Please subscribe to a plan first.",
      };
    }

    const baseUrl = getAppBaseUrl();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: pharmacy.stripeCustomerId,
      return_url: `${baseUrl}/pharmacy/settings`,
    });

    return {
      success: true,
      portalUrl: portalSession.url,
    };
  } catch (error: any) {
    console.error("❌ Failed to create billing portal session:", error);
    return { success: false, error: formatErrorMessage(error) };
  }
}

/**
 * Direct administrative plan update
 */
export async function updatePharmacySubscriptionPlanAction(params: {
  pharmacyId: string;
  planTier: SubscriptionPlanTier;
  status: "ACTIVE" | "INACTIVE" | "TRIALING" | "CANCELLED";
}) {
  try {
    await db.pharmacy.update({
      where: { id: params.pharmacyId },
      data: {
        subscriptionPlan: params.planTier,
        subscriptionStatus: params.status,
      },
    });

    try {
      revalidatePath("/pharmacy/settings");
      revalidatePath("/admin/pharmacies");
    } catch (e) {}

    return {
      success: true,
      message: `Updated pharmacy plan to ${params.planTier} (${params.status}).`,
    };
  } catch (error: any) {
    console.error("❌ Failed to update pharmacy subscription plan:", error);
    return { success: false, error: formatErrorMessage(error) };
  }
}
