"use server";

import { db } from "@/lib/db";

export async function getDashboardAnalyticsAction(pharmacyId?: string) {
  try {
    const wherePharmacy = pharmacyId ? { pharmacyId } : {};

    const [
      totalRevenueAgg,
      totalAppointments,
      totalPatients,
      avgRatingAgg,
      statusBreakdown,
      recentAuditLogs,
      dailyStats,
    ] = await Promise.all([
      db.payment.aggregate({
        where: { ...wherePharmacy, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      db.appointment.count({ where: wherePharmacy }),
      db.customer.count({ where: wherePharmacy }),
      db.review.aggregate({
        where: { ...wherePharmacy, status: "APPROVED" },
        _avg: { rating: true },
      }),
      db.appointment.groupBy({
        by: ["status"],
        where: wherePharmacy,
        _count: { id: true },
      }),
      db.auditLog.findMany({
        where: pharmacyId ? { pharmacyId } : {},
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.dailyAnalytics.findMany({
        where: pharmacyId ? { pharmacyId } : {},
        orderBy: { date: "desc" },
        take: 30,
      }),
    ]);

    const totalRevenue = Number(totalRevenueAgg._sum.amount || 0);
    const averageRating = Number((avgRatingAgg._avg.rating || 5.0).toFixed(1));

    const statusCounts: Record<string, number> = {
      CONFIRMED: 0,
      PENDING: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    statusBreakdown.forEach((s) => {
      statusCounts[s.status] = s._count.id;
    });

    const completionRate =
      totalAppointments > 0
        ? Number((((statusCounts.COMPLETED || 0) / totalAppointments) * 100).toFixed(1))
        : 100;

    return {
      success: true,
      metrics: {
        totalRevenue,
        totalAppointments,
        totalPatients,
        averageRating,
        completionRate,
        statusCounts,
      },
      liveActivity: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityName: log.entityName,
        userEmail: log.userEmail || "System Admin",
        createdAt: log.createdAt.toISOString(),
      })),
      dailyStats: dailyStats.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        bookings: d.totalBookings,
        revenue: Number(d.totalRevenue),
      })),
    };
  } catch (error: any) {
    console.error("❌ getDashboardAnalyticsAction error:", error);
    return { success: false, error: "Failed to fetch dashboard analytics" };
  }
}
