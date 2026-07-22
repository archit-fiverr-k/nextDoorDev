"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCouponAction(data: {
  pharmacyId?: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minBookingAmount?: number;
  usageLimit?: number;
  expiresAt?: string;
}) {
  try {
    if (!data.code || !data.discountValue) {
      return { success: false, error: "Coupon code and discount value are required" };
    }

    const upperCode = data.code.trim().toUpperCase();

    const existing = await db.coupon.findUnique({
      where: { code: upperCode },
    });

    if (existing) {
      return { success: false, error: "Coupon code already exists" };
    }

    const coupon = await db.coupon.create({
      data: {
        pharmacyId: data.pharmacyId || null,
        code: upperCode,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minBookingAmount: data.minBookingAmount || null,
        usageLimit: data.usageLimit || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: true,
      },
    });

    revalidatePath(`/admin/marketing`);
    return { success: true, data: coupon };
  } catch (error: any) {
    console.error("❌ createCouponAction error:", error);
    return { success: false, error: "Failed to create coupon" };
  }
}

export async function getPharmacyCouponsAction(pharmacyId?: string) {
  try {
    const coupons = await db.coupon.findMany({
      where: pharmacyId ? { pharmacyId } : {},
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      coupons: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        discountType: c.discountType,
        discountValue: Number(c.discountValue),
        minBookingAmount: c.minBookingAmount ? Number(c.minBookingAmount) : null,
        usageLimit: c.usageLimit,
        timesUsed: c.timesUsed,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        isActive: c.isActive,
      })),
    };
  } catch (error: any) {
    console.error("❌ getPharmacyCouponsAction error:", error);
    return { success: false, error: "Failed to fetch coupons" };
  }
}

export async function validateCouponAction(code: string, pharmacyId: string, totalAmount: number) {
  try {
    if (!code) return { success: false, error: "Coupon code required" };
    const upperCode = code.trim().toUpperCase();

    const coupon = await db.coupon.findUnique({
      where: { code: upperCode },
    });

    if (!coupon || !coupon.isActive) {
      return { success: false, error: "Invalid or inactive promotional coupon code" };
    }

    if (coupon.pharmacyId && coupon.pharmacyId !== pharmacyId) {
      return { success: false, error: "This coupon is not applicable for this pharmacy location" };
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return { success: false, error: "This promotional coupon code has expired" };
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return { success: false, error: "This coupon has reached its maximum redemptions limit" };
    }

    if (coupon.minBookingAmount && totalAmount < Number(coupon.minBookingAmount)) {
      return {
        success: false,
        error: `Minimum booking amount of £${Number(coupon.minBookingAmount).toFixed(2)} required to apply this coupon`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountAmount = (totalAmount * Number(coupon.discountValue)) / 100;
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    if (discountAmount > totalAmount) discountAmount = totalAmount;

    return {
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        discountAmount: Number(discountAmount.toFixed(2)),
      },
    };
  } catch (error: any) {
    console.error("❌ validateCouponAction error:", error);
    return { success: false, error: "Failed to validate coupon" };
  }
}

export async function createCampaignAction(data: {
  pharmacyId: string;
  title: string;
  type: string;
  startDate: string;
  endDate?: string;
  targetAudience?: string;
}) {
  try {
    const campaign = await db.campaign.create({
      data: {
        pharmacyId: data.pharmacyId,
        title: data.title,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        targetAudience: data.targetAudience || "ALL",
        status: "ACTIVE",
      },
    });

    return { success: true, data: campaign };
  } catch (error: any) {
    console.error("❌ createCampaignAction error:", error);
    return { success: false, error: "Failed to create campaign" };
  }
}

export async function getPharmacyCampaignsAction(pharmacyId: string) {
  try {
    const campaigns = await db.campaign.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      campaigns: campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        targetAudience: c.targetAudience,
        status: c.status,
        clicksCount: c.clicksCount,
        conversionsCount: c.conversionsCount,
        revenueGenerated: Number(c.revenueGenerated),
        startDate: c.startDate.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("❌ getPharmacyCampaignsAction error:", error);
    return { success: false, error: "Failed to fetch campaigns" };
  }
}
