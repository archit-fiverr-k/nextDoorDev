"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPaymentRecordAction(data: {
  appointmentId?: string;
  customerId: string;
  pharmacyId: string;
  amount: number;
  paymentMethod?: string;
  stripePaymentIntentId?: string;
}) {
  try {
    const payment = await db.payment.create({
      data: {
        appointmentId: data.appointmentId || null,
        customerId: data.customerId,
        pharmacyId: data.pharmacyId,
        amount: data.amount,
        currency: "GBP",
        status: "COMPLETED",
        paymentMethod: data.paymentMethod || "PAY_AT_CLINIC",
        stripePaymentIntentId: data.stripePaymentIntentId || null,
      },
    });

    // Aggregate daily analytics for pharmacy
    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);

    await db.dailyAnalytics.upsert({
      where: {
        pharmacyId_date: {
          pharmacyId: data.pharmacyId,
          date: todayDate,
        },
      },
      update: {
        totalRevenue: { increment: data.amount },
      },
      create: {
        pharmacyId: data.pharmacyId,
        date: todayDate,
        totalRevenue: data.amount,
      },
    });

    revalidatePath(`/admin/financials`);
    return { success: true, data: payment };
  } catch (error: any) {
    console.error("❌ createPaymentRecordAction error:", error);
    return { success: false, error: "Failed to record payment" };
  }
}

export async function processRefundAction(data: {
  paymentId: string;
  amount: number;
  reason?: string;
  stripeRefundId?: string;
}) {
  try {
    const payment = await db.payment.findUnique({ where: { id: data.paymentId } });
    if (!payment) return { success: false, error: "Payment record not found" };

    const refund = await db.refund.create({
      data: {
        paymentId: data.paymentId,
        amount: data.amount,
        reason: data.reason || "Patient Cancellation",
        stripeRefundId: data.stripeRefundId || null,
        status: "COMPLETED",
      },
    });

    await db.payment.update({
      where: { id: data.paymentId },
      data: { status: "REFUNDED" },
    });

    revalidatePath(`/admin/financials`);
    return { success: true, data: refund };
  } catch (error: any) {
    console.error("❌ processRefundAction error:", error);
    return { success: false, error: "Failed to process refund" };
  }
}

export async function getFinancialAnalyticsAction(pharmacyId?: string) {
  try {
    const where = pharmacyId ? { pharmacyId } : {};

    const [payments, agg, refundsAgg] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          appointment: { include: { service: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.payment.aggregate({
        where: { ...where, status: "COMPLETED" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      db.refund.aggregate({
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = Number(agg._sum.amount || 0);
    const totalPayments = agg._count.id || 0;
    const totalRefunds = Number(refundsAgg._sum.amount || 0);
    const netRevenue = Number((totalRevenue - totalRefunds).toFixed(2));

    return {
      success: true,
      metrics: {
        totalRevenue,
        totalPayments,
        totalRefunds,
        netRevenue,
      },
      payments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        patientName: `${p.customer.firstName} ${p.customer.lastName}`,
        serviceName: p.appointment?.service?.name || "Clinical Service",
        createdAt: p.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("❌ getFinancialAnalyticsAction error:", error);
    return { success: false, error: "Failed to fetch financial analytics" };
  }
}
