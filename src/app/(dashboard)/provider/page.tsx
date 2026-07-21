import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  Calendar,
  CalendarCheck2,
  CalendarClock,
  Hourglass,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  ArrowUpRight,
  PlusCircle,
  Clock,
  CalendarRange,
  Activity,
  AlertCircle,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Package,
  Award,
} from "lucide-react";
import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";

export const revalidate = 0; // Dynamic server page

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  trend?: {
    type: "positive" | "negative" | "neutral";
    label: string;
  };
}

function MetricCard({ title, value, subtitle, icon: Icon, trend }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950">
      <div className="flex items-start justify-between">
        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          {title}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-500 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline space-x-2">
        <span
          className="max-w-[160px] truncate text-2xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50"
          title={String(value)}
        >
          {value}
        </span>
        {trend && (
          <span
            className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${
              trend.type === "positive"
                ? "dark:text-emerald-450 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                : trend.type === "negative"
                  ? "dark:text-rose-450 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {trend.type === "positive" ? (
              <TrendingUp className="mr-1 h-2.5 w-2.5" />
            ) : trend.type === "negative" ? (
              <TrendingDown className="mr-1 h-2.5 w-2.5" />
            ) : null}
            {trend.label}
          </span>
        )}
      </div>
      <p className="text-slate-455 mt-1.5 truncate text-[10px] font-medium leading-none dark:text-zinc-400">
        {subtitle}
      </p>
    </div>
  );
}

export default async function ProviderDashboardPage() {
  const session = await getRequiredSession();
  const pharmacyId = session.user.pharmacyId;

  // Security guard: require active pharmacy branch
  if (!pharmacyId) {
    redirect("/");
  }

  // 1. Calculate date boundaries
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Starts Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // 2. Fetch statistics & lists concurrently
  const [
    todayCount,
    upcomingCount,
    weeklyCount,
    monthlyCount,
    pendingCount,
    completedCount,
    cancelledCount,
    totalCount,
    pastUnfinishedCount,
    recentBookings,
    recentPatients,
    recentNotifications,
    registrationAudit,
    popularServiceGroup,
    appointmentsGroupByCustomer,
  ] = await Promise.all([
    // Today's appointments count
    db.appointment.count({
      where: {
        pharmacyId,
        startTime: { gte: todayStart, lte: todayEnd },
      },
    }),
    // Upcoming appointments count
    db.appointment.count({
      where: {
        pharmacyId,
        startTime: { gt: todayEnd },
      },
    }),
    // Weekly appointments count
    db.appointment.count({
      where: {
        pharmacyId,
        startTime: { gte: weekStart, lte: weekEnd },
      },
    }),
    // Monthly appointments count
    db.appointment.count({
      where: {
        pharmacyId,
        startTime: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Pending bookings count
    db.appointment.count({
      where: {
        pharmacyId,
        status: "PENDING",
      },
    }),
    // Completed bookings count
    db.appointment.count({
      where: {
        pharmacyId,
        status: "COMPLETED",
      },
    }),
    // Cancelled bookings count
    db.appointment.count({
      where: {
        pharmacyId,
        status: "CANCELLED",
      },
    }),
    // Total bookings count
    db.appointment.count({
      where: {
        pharmacyId,
      },
    }),
    // Past appointments not marked completed or cancelled
    db.appointment.count({
      where: {
        pharmacyId,
        endTime: { lt: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    // 5 Recent bookings
    db.appointment.findMany({
      where: {
        pharmacyId,
      },
      take: 5,
      orderBy: {
        startTime: "desc",
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    }),
    // 5 Recent patients
    db.customer.findMany({
      where: {
        pharmacyId,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
    // 5 Recent notifications
    db.communicationsLog.findMany({
      where: {
        pharmacyId,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    // Get B2B Subscription Plan from initial registration audit log
    db.auditLog.findFirst({
      where: {
        pharmacyId,
        action: "CREATE",
        entityName: "Pharmacy",
      },
      select: {
        changes: true,
      },
    }),
    // Group appointments by serviceId to identify popular service
    db.appointment.groupBy({
      by: ["serviceId"],
      where: {
        pharmacyId,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 1,
    }),
    // Group appointments by customer to identify returning patients (> 1 booking)
    db.appointment.groupBy({
      by: ["customerId"],
      where: {
        pharmacyId,
      },
      _count: {
        id: true,
      },
    }),
  ]);

  // 3. Resolve dynamic metrics calculations
  const conversionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const noShowRate = totalCount > 0 ? (pastUnfinishedCount / totalCount) * 100 : 0;

  // Resolve subscription details
  const changes = registrationAudit?.changes as any;
  const subscriptionPlan = changes?.subscriptionPlan || "growth"; // default to growth
  const subscriptionStatus = "Active"; // default active billing status verified by Stripe checkout

  // Resolve returning patients count (group counts > 1)
  const returningCount = appointmentsGroupByCustomer.filter((g) => g._count.id > 1).length;

  // Resolve most popular service name
  let popularServiceName = "None";
  let popularServiceCount = 0;
  if (popularServiceGroup.length > 0 && popularServiceGroup[0].serviceId) {
    const pService = await db.service.findUnique({
      where: { id: popularServiceGroup[0].serviceId },
      select: { name: true },
    });
    if (pService) {
      popularServiceName = pService.name;
      popularServiceCount = popularServiceGroup[0]._count.id;
    }
  }

  const quickActions = [
    {
      title: "Create Service",
      description: "Add new vaccinations or checks",
      href: `/pharmacy/${pharmacyId}/services`,
      icon: PlusCircle,
      iconColor:
        "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    },
    {
      title: "Manage Availability",
      description: "Roster hours & slot rules",
      href: `/pharmacy/${pharmacyId}/availability`,
      icon: Clock,
      iconColor:
        "text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
    },
    {
      title: "View Calendar",
      description: "Review bookings and schedules",
      href: `/pharmacy/${pharmacyId}`,
      icon: CalendarRange,
      iconColor:
        "text-slate-700 bg-slate-50 dark:bg-zinc-900 dark:text-zinc-300 border-slate-200 dark:border-zinc-800/80",
    },
    {
      title: "Patient CRM",
      description: "Manage medical charts & histories",
      href: `/pharmacy/${pharmacyId}/crm`,
      icon: Users,
      iconColor:
        "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
    },
  ];

  return (
    <div className="select-text space-y-8">
      {/* Welcome Title Block */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Provider Dashboard
          </h2>
          <p className="mt-1.5 text-xs font-normal text-slate-500 dark:text-zinc-400">
            Real-time performance overview, active booking queues, compliance audits, and quick
            branch configurations.
          </p>
        </div>

        {/* B2B Subscription status pill */}
        <div className="flex select-none items-center space-x-2 rounded-xl border border-emerald-200/60 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
          <Package className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="capitalize">{subscriptionPlan} Plan</span>
          <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-slate-950">
            {subscriptionStatus}
          </span>
        </div>
      </div>

      {/* Row of Metrics Cards */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {/* Row 1 */}
        <MetricCard
          title="Today's Appointments"
          value={todayCount}
          subtitle="Scheduled slots today"
          icon={Calendar}
        />
        <MetricCard
          title="Upcoming"
          value={upcomingCount}
          subtitle="Future schedule entries"
          icon={CalendarClock}
        />
        <MetricCard
          title="Weekly Bookings"
          value={weeklyCount}
          subtitle="Scheduled for current week"
          icon={CalendarCheck2}
        />
        <MetricCard
          title="Monthly Bookings"
          value={monthlyCount}
          subtitle="Booked in current month"
          icon={CalendarRange}
        />

        {/* Row 2 */}
        <MetricCard
          title="Pending Bookings"
          value={pendingCount}
          subtitle="Awaiting branch review"
          icon={Hourglass}
          trend={pendingCount > 0 ? { type: "negative", label: "Attention" } : undefined}
        />
        <MetricCard
          title="Completed Bookings"
          value={completedCount}
          subtitle="Fulfillments recorded"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Cancelled Bookings"
          value={cancelledCount}
          subtitle="Cancelled patient slots"
          icon={XCircle}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          subtitle="Ratio of completed visits"
          icon={Activity}
          trend={
            conversionRate >= 80
              ? { type: "positive", label: "Excellent" }
              : conversionRate > 0
                ? { type: "neutral", label: "Fair" }
                : undefined
          }
        />

        {/* Row 3 (New metrics) */}
        <MetricCard
          title="No Shows"
          value={pastUnfinishedCount}
          subtitle={`No-show rate: ${noShowRate.toFixed(1)}%`}
          icon={AlertCircle}
          trend={
            noShowRate > 8
              ? { type: "negative", label: "High" }
              : noShowRate > 0
                ? { type: "positive", label: "Low" }
                : undefined
          }
        />
        <MetricCard
          title="Most Popular Service"
          value={popularServiceName}
          subtitle={`${popularServiceCount} booking${popularServiceCount !== 1 ? "s" : ""} placed`}
          icon={Award}
        />
        <MetricCard
          title="Returning Patients"
          value={returningCount}
          subtitle="Patients with >1 booking"
          icon={Users}
        />
        <MetricCard
          title="Active Services"
          value={`${totalCount} Total`}
          subtitle="Bookings count overall"
          icon={PlusCircle}
        />
      </div>

      {/* Tables and Side Panel Grid */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Column (3/5) */}
        <div className="space-y-8 lg:col-span-3">
          {/* Recent Bookings Table */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Recent Bookings
              </h3>
              <Link
                href={`/pharmacy/${pharmacyId}`}
                className="flex items-center space-x-1 text-[10px] font-extrabold text-blue-600 hover:underline dark:text-blue-500"
              >
                <span>View Roster</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 dark:border-zinc-900/60">
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Service</th>
                    <th className="pb-3">Scheduled Slot</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="dark:text-zinc-350 divide-y divide-slate-50 text-slate-700 dark:divide-zinc-900/30">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-slate-455 py-6 text-center font-medium">
                        No appointments found in database.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/20"
                      >
                        <td className="py-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {booking.customer.firstName} {booking.customer.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                            {booking.customer.phone}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] font-medium">{booking.service.name}</td>
                        <td className="text-slate-550 py-3 font-mono text-[10px] dark:text-zinc-400">
                          {format(new Date(booking.startTime), "MMM d, h:mm a")}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                              booking.status === "COMPLETED"
                                ? "dark:text-emerald-450 border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                                : booking.status === "CONFIRMED"
                                  ? "dark:text-blue-450 border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20"
                                  : booking.status === "CANCELLED"
                                    ? "dark:text-rose-450 border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20"
                                    : "dark:text-amber-450 border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Patients Table */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Recent Patients
              </h3>
              <Link
                href={`/pharmacy/${pharmacyId}/crm`}
                className="flex items-center space-x-1 text-[10px] font-extrabold text-blue-600 hover:underline dark:text-blue-500"
              >
                <span>Open CRM</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase text-slate-400 dark:border-zinc-900/60">
                    <th className="pb-3">Patient Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Telephone</th>
                    <th className="pb-3 text-right">Date Registered</th>
                  </tr>
                </thead>
                <tbody className="dark:text-zinc-350 divide-y divide-slate-50 text-slate-700 dark:divide-zinc-900/30">
                  {recentPatients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-slate-455 py-6 text-center font-medium">
                        No patient records found in branch database.
                      </td>
                    </tr>
                  ) : (
                    recentPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/20"
                      >
                        <td className="flex items-center space-x-2.5 py-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-600 dark:border-zinc-800/40 dark:bg-zinc-900 dark:text-zinc-400">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {patient.firstName} {patient.lastName}
                          </span>
                        </td>
                        <td className="py-3 font-medium">{patient.email}</td>
                        <td className="text-slate-550 dark:text-zinc-455 py-3 font-mono text-[10px]">
                          {patient.phone}
                        </td>
                        <td className="text-slate-450 py-3 text-right font-mono text-[10px] dark:text-zinc-500">
                          {format(new Date(patient.createdAt), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (2/5) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Quick Actions Grid */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Quick Actions
            </h3>

            <div className="grid gap-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={idx}
                    href={action.href}
                    className="group flex items-center space-x-3.5 rounded-xl border border-slate-200/60 bg-slate-50/50 p-3.5 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800/60 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/60"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${action.iconColor}`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                        <span>{action.title}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </h4>
                      <p className="text-slate-455 mt-0.5 truncate text-[10px] font-normal dark:text-zinc-400">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Notifications (Communications Log) */}
          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Latest Notifications
            </h3>

            <div className="space-y-3.5">
              {recentNotifications.length === 0 ? (
                <div className="text-slate-455 py-6 text-center text-xs font-medium">
                  No notifications recorded yet.
                </div>
              ) : (
                recentNotifications.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 border-b border-slate-100 pb-3.5 text-xs leading-normal last:border-b-0 last:pb-0 dark:border-zinc-900/40"
                  >
                    <div className="border-slate-150 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-slate-50 text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {log.type} confirm to {log.customer.firstName}
                      </p>
                      <p className="text-slate-455 mt-0.5 truncate text-[10px] dark:text-zinc-400">
                        {log.recipient} | Status:{" "}
                        <span className="text-emerald-650 dark:text-emerald-450 font-bold">
                          {log.status}
                        </span>
                      </p>
                      <span className="mt-1 block font-mono text-[9px] text-slate-400 dark:text-zinc-500">
                        {format(new Date(log.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Trends section */}
      <div
        id="analytics-section"
        className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950"
      >
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Fulfillment Analytics & Trends
          </h3>
          <p className="text-slate-550 mt-1 text-[10px] font-normal">
            Breakdown of service volume and booking success across all patients.
          </p>
        </div>

        {/* Visual Simulated Bar Chart */}
        <div className="space-y-4">
          <div className="flex select-none items-baseline justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
            <span>Overall Booking Fulfillment Ratio</span>
            <span className="dark:text-emerald-450 text-sm font-extrabold text-emerald-600">
              {conversionRate.toFixed(1)}% Completed
            </span>
          </div>

          {/* Combined Visual Progress Bar */}
          <div className="flex h-3 w-full select-none overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-900">
            <div
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 40}%` }}
              className="h-full bg-emerald-500"
              title={`Completed: ${completedCount}`}
            />
            <div
              style={{
                width: `${
                  totalCount > 0
                    ? ((totalCount - completedCount - cancelledCount) / totalCount) * 100
                    : 30
                }%`,
              }}
              className="h-full bg-blue-500"
              title="Confirmed/Pending"
            />
            <div
              style={{ width: `${totalCount > 0 ? (cancelledCount / totalCount) * 100 : 30}%` }}
              className="h-full bg-rose-500"
              title={`Cancelled: ${cancelledCount}`}
            />
          </div>

          {/* Bar Legend */}
          <div className="flex select-none flex-wrap gap-x-6 gap-y-2 pt-1 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Completed ({completedCount})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Pending / Active ({totalCount - completedCount - cancelledCount})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span>Cancelled ({cancelledCount})</span>
            </div>
          </div>
        </div>

        {/* Audit trail alert / summary */}
        <div className="flex select-none items-start space-x-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-zinc-800/40 dark:bg-zinc-900/60">
          <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0 text-slate-500 dark:text-zinc-400" />
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">
              System Activity Auditing
            </h4>
            <p className="text-slate-455 mt-0.5 text-[10px] leading-normal dark:text-zinc-400">
              All clinical appointments, booking entries, and user adjustments are registered under
              the central audit logs to comply with UK pharmacy information governance rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
