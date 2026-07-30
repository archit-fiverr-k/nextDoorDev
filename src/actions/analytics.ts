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

export async function getPharmacyAnalyticsAction(pharmacyId: string) {
  try {
    const [allAppointments, totalPatients] = await Promise.all([
      db.appointment.findMany({
        where: { pharmacyId },
        include: {
          service: true,
          customer: true,
        },
        orderBy: { startTime: "desc" },
      }),
      db.customer.count({
        where: {
          appointments: {
            some: { pharmacyId },
          },
        },
      }),
    ]);

    const totalCount = allAppointments.length;
    let pendingCount = 0;
    let confirmedCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let totalRevenue = 0;
    let privateRevenue = 0;
    let nhsRevenue = 0;

    let morningSlots = 0;
    let afternoonSlots = 0;
    let eveningSlots = 0;

    let potentialRevenue = 0;

    allAppointments.forEach((app) => {
      const price = Number(app.service?.price || 0);
      if (app.status === "PENDING") {
        pendingCount++;
        potentialRevenue += price;
      }
      if (app.status === "CONFIRMED") {
        confirmedCount++;
        potentialRevenue += price;
      }
      if (app.status === "COMPLETED") {
        completedCount++;
        totalRevenue += price;
        const isNhs = app.service?.category?.toLowerCase().includes("nhs") || false;
        if (isNhs) nhsRevenue += price;
        else privateRevenue += price;
      }
      if (app.status === "CANCELLED" || app.status === "REJECTED") cancelledCount++;

      const hour = new Date(app.startTime).getHours();
      if (hour < 12) morningSlots++;
      else if (hour < 17) afternoonSlots++;
      else eveningSlots++;
    });

    // Compute Monthly Trend (Last 6 Months) strictly from COMPLETED appointments
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();
    const monthlyMap = new Map<
      string,
      { label: string; revenue: number; bookings: number; completedBookings: number }
    >();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = `${monthNames[d.getMonth()]} '${d.getFullYear().toString().substring(2)}`;
      monthlyMap.set(key, { label, revenue: 0, bookings: 0, completedBookings: 0 });
    }

    // Compute Weekly Trend (Last 4 Weeks) strictly from COMPLETED appointments
    const weeklyTrend: Array<{
      label: string;
      revenue: number;
      bookings: number;
      completedBookings: number;
    }> = [
      { label: "3 Wks Ago", revenue: 0, bookings: 0, completedBookings: 0 },
      { label: "2 Wks Ago", revenue: 0, bookings: 0, completedBookings: 0 },
      { label: "Last Week", revenue: 0, bookings: 0, completedBookings: 0 },
      { label: "This Week", revenue: 0, bookings: 0, completedBookings: 0 },
    ];

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const nowMs = now.getTime();

    allAppointments.forEach((app) => {
      const price = Number(app.service?.price || 0);
      const appDate = new Date(app.startTime);

      // Monthly aggregation
      const mKey = `${appDate.getFullYear()}-${appDate.getMonth()}`;
      if (monthlyMap.has(mKey)) {
        const mData = monthlyMap.get(mKey)!;
        mData.bookings += 1;
        if (app.status === "COMPLETED") {
          mData.completedBookings += 1;
          mData.revenue += price;
        }
      }

      // Weekly aggregation
      const diffMs = nowMs - appDate.getTime();
      if (diffMs >= 0 && diffMs < 4 * oneWeekMs) {
        const weekIndex = 3 - Math.floor(diffMs / oneWeekMs);
        if (weekIndex >= 0 && weekIndex < 4) {
          weeklyTrend[weekIndex].bookings += 1;
          if (app.status === "COMPLETED") {
            weeklyTrend[weekIndex].completedBookings += 1;
            weeklyTrend[weekIndex].revenue += price;
          }
        }
      }
    });

    const monthlyTrend = Array.from(monthlyMap.values());

    const totalProcessed = completedCount + cancelledCount;
    const attendanceRate =
      totalProcessed > 0 ? Number(((completedCount / totalProcessed) * 100).toFixed(1)) : 100;

    // Service Breakdown Matrix (Only COMPLETED appointments generate realized revenue)
    const serviceStatsMap = new Map<
      string,
      {
        name: string;
        category: string;
        count: number;
        completedCount: number;
        price: number;
        revenue: number;
      }
    >();
    allAppointments.forEach((app) => {
      if (!app.service) return;
      const sId = app.service.id;
      const existing = serviceStatsMap.get(sId) || {
        name: app.service.name,
        category: app.service.category || "Clinical Service",
        count: 0,
        completedCount: 0,
        price: Number(app.service.price || 0),
        revenue: 0,
      };
      existing.count += 1;
      if (app.status === "COMPLETED") {
        existing.completedCount += 1;
        existing.revenue += Number(app.service.price || 0);
      }
      serviceStatsMap.set(sId, existing);
    });

    const topServices = Array.from(serviceStatsMap.values()).sort(
      (a, b) => b.revenue - a.revenue || b.completedCount - a.completedCount
    );

    return {
      success: true,
      analytics: {
        totalAppointments: totalCount,
        pendingCount,
        confirmedCount,
        completedCount,
        cancelledCount,
        attendanceRate,
        totalPatients,
        totalRevenue,
        potentialRevenue,
        privateRevenue,
        nhsRevenue,
        monthlyTrend,
        weeklyTrend,
        slotDistribution: {
          morning: morningSlots,
          afternoon: afternoonSlots,
          evening: eveningSlots,
        },
        topServices,
        recentAppointments: JSON.parse(JSON.stringify(allAppointments.slice(0, 20))),
      },
    };
  } catch (error: any) {
    console.error("❌ getPharmacyAnalyticsAction error:", error);
    return { success: false, error: error.message || "Failed to fetch analytics" };
  }
}
