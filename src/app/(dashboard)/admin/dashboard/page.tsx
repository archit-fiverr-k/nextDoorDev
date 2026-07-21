import { db } from "@/lib/db";
import { H1, P } from "@/components/ui/typography";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  Users,
  Store,
  CalendarDays,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  Settings,
  Layers,
  FileText,
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function SuperAdminDashboardPage() {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  // 1. Fetch live KPIs
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalProviders,
    activeProviders,
    pendingProviders,
    suspendedProviders,
    totalPatients,
    appointmentsToday,
    appointmentsThisMonth,
    activeSubscriptions,
    failedRenewals,
  ] = await Promise.all([
    db.pharmacy.count({ where: { deletedAt: null } }),
    db.pharmacy.count({ where: { status: "APPROVED", deletedAt: null } }),
    db.pharmacy.count({ where: { status: "PENDING", deletedAt: null } }),
    db.pharmacy.count({ where: { status: "SUSPENDED", deletedAt: null } }),
    db.customer.count({ where: { deletedAt: null } }),
    db.appointment.count({ where: { startTime: { gte: todayStart, lte: todayEnd } } }),
    db.appointment.count({ where: { startTime: { gte: monthStart } } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "FAILED_PAYMENT" } }),
  ]);

  // 2. Fetch Recent Activity Feed
  const [latestRegistrations, latestBookings, latestFailedPayments] = await Promise.all([
    db.pharmacy.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, status: true },
    }),
    db.appointment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        pharmacy: { select: { name: true } },
        service: { select: { name: true } },
      },
    }),
    db.subscriptionHistory.findMany({
      where: { action: "PAYMENT_FAILED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        pharmacy: { select: { name: true } },
      },
    }),
  ]);

  // 3. Aggregate Monthly Trends for past 6 months
  const monthlyTrends: {
    label: string;
    providers: number;
    bookings: number;
    patients: number;
    subscriptions: number;
  }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);

    const nextM = new Date(d);
    nextM.setMonth(d.getMonth() + 1);

    const label = d.toLocaleString("en-US", { month: "short", year: "2-digit" });

    const [providersCount, bookingsCount, patientsCount, subsCount] = await Promise.all([
      db.pharmacy.count({ where: { createdAt: { lte: nextM }, deletedAt: null } }),
      db.appointment.count({ where: { startTime: { gte: d, lt: nextM } } }),
      db.customer.count({ where: { createdAt: { lte: nextM }, deletedAt: null } }),
      db.subscription.count({ where: { createdAt: { lte: nextM }, status: "ACTIVE" } }),
    ]);

    monthlyTrends.push({
      label,
      providers: providersCount,
      bookings: bookingsCount,
      patients: patientsCount,
      subscriptions: subsCount,
    });
  }

  // Visual helper for rendering inline Sparklines/Trend lines
  const renderSparkline = (dataPoints: number[], color: string) => {
    const maxVal = Math.max(...dataPoints, 1);
    const height = 40;
    const width = 120;
    const padding = 2;
    const pts = dataPoints
      .map((val, idx) => {
        const x = padding + (idx * (width - padding * 2)) / (dataPoints.length - 1);
        const y = height - padding - (val * (height - padding * 2)) / maxVal;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg className="h-[40px] w-[120px]" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-10 bg-white pb-12 font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      {/* Title Header */}
      <div className="dark:border-zinc-850 flex select-none flex-col gap-4 border-b border-slate-200/80 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <H1 className="font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Super Admin Portal
          </H1>
          <P className="mt-1 text-slate-500 dark:text-zinc-400">
            System executive cockpit. Live marketplace overview, configurations, SaaS subscriptions,
            and CMS templates.
          </P>
        </div>
        <div className="text-slate-650 dark:text-zinc-350 flex items-center space-x-2 rounded border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-semibold dark:border-zinc-800 dark:bg-zinc-900">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-teal" />
          <span>Production Ready Database Connected</span>
        </div>
      </div>

      {/* KPI Stats Flat Row */}
      <div className="dark:border-zinc-850 grid select-none grid-cols-2 gap-6 border-b border-slate-200/80 pb-10 md:grid-cols-5">
        {/* Providers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Providers
            </span>
            <Store className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
            {totalProviders}
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-400">
            <span className="text-brand-teal">{activeProviders} Approved</span>
            <span>&bull;</span>
            <span className="text-slate-500">{pendingProviders} Pending</span>
          </div>
        </div>

        {/* Patients */}
        <div className="md:dark:border-zinc-850 space-y-2 md:border-l md:border-slate-200/80 md:pl-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Patients
            </span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
            {totalPatients}
          </div>
          <div className="text-[10px] text-slate-400">Marketplace consumers</div>
        </div>

        {/* Bookings */}
        <div className="dark:border-zinc-850 space-y-2 border-l border-slate-200/80 pl-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Bookings (Today)
            </span>
            <CalendarDays className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
            {appointmentsToday}
          </div>
          <div className="text-[10px] text-slate-400">{appointmentsThisMonth} this month</div>
        </div>

        {/* Subscriptions */}
        <div className="dark:border-zinc-850 space-y-2 border-l border-slate-200/80 pl-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active SaaS Plans
            </span>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
            {activeSubscriptions}
          </div>
          <div className="text-[10px] text-slate-400">Active subscriptions</div>
        </div>

        {/* Failed Renewals */}
        <div className="dark:border-zinc-850 space-y-2 border-l border-slate-200/80 pl-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Failed Renewals
            </span>
            <ShieldAlert className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
            {failedRenewals}
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-400">
            <span className="text-rose-500">{suspendedProviders} Suspended</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grids */}
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Bookings & Provider Growth Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-900">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Booking Trends & Provider Growth
              </h2>
              <P className="mt-0.5 text-[11px] text-slate-500">
                Performance statistics over the past 6 months
              </P>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4">
            <div className="dark:border-zinc-850 rounded border border-slate-200/80 bg-slate-50 p-3 dark:bg-zinc-900/50">
              <span className="block text-[10px] font-bold uppercase text-slate-400">
                Booking Sparkline
              </span>
              <div className="mt-2 flex items-end justify-between">
                <div className="text-lg font-black text-slate-900 dark:text-slate-50">
                  {monthlyTrends.reduce((sum, item) => sum + item.bookings, 0)} Total
                </div>
                {renderSparkline(
                  monthlyTrends.map((t) => t.bookings),
                  "#10B981"
                )}
              </div>
            </div>
            <div className="dark:border-zinc-850 rounded border border-slate-200/80 bg-slate-50 p-3 dark:bg-zinc-900/50">
              <span className="block text-[10px] font-bold uppercase text-slate-400">
                Provider Sparkline
              </span>
              <div className="mt-2 flex items-end justify-between">
                <div className="text-lg font-black text-slate-900 dark:text-slate-50">
                  +{monthlyTrends[monthlyTrends.length - 1].providers - monthlyTrends[0].providers}{" "}
                  Growth
                </div>
                {renderSparkline(
                  monthlyTrends.map((t) => t.providers),
                  "#10B981"
                )}
              </div>
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="relative mt-4 flex h-[200px] w-full items-end">
            <div className="pointer-events-none absolute inset-0 flex select-none flex-col justify-between">
              {[1, 2, 3, 4].map((line) => (
                <div
                  key={line}
                  className="h-0 w-full border-t border-slate-100 dark:border-zinc-900/60"
                />
              ))}
            </div>

            <div className="relative z-10 flex h-[160px] w-full items-end justify-between px-6">
              {monthlyTrends.map((trend, idx) => {
                const maxBookings = Math.max(...monthlyTrends.map((t) => t.bookings), 1);
                const barHeight = (trend.bookings / maxBookings) * 120 + 20;

                return (
                  <div key={trend.label} className="group flex flex-1 flex-col items-center">
                    <div
                      className="relative flex w-8 flex-col justify-end rounded-t bg-slate-100 transition-all duration-300 hover:bg-brand-teal dark:bg-zinc-800 dark:hover:bg-brand-teal"
                      style={{ height: `${barHeight}px` }}
                    >
                      <span className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {trend.bookings} Bookings
                      </span>
                    </div>
                    <span className="mt-2 block text-[10px] font-bold text-slate-400">
                      {trend.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subscription & Patient Growth Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-900">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Patient & Subscription Expansion
              </h2>
              <P className="mt-0.5 text-[11px] text-slate-500">
                Marketplace customer acquisition tracking
              </P>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4">
            <div className="dark:border-zinc-850 rounded border border-slate-200/80 bg-slate-50 p-3 dark:bg-zinc-900/50">
              <span className="block text-[10px] font-bold uppercase text-slate-400">
                Patient Sparkline
              </span>
              <div className="mt-2 flex items-end justify-between">
                <div className="text-lg font-black text-slate-900 dark:text-slate-50">
                  {monthlyTrends[monthlyTrends.length - 1].patients} Total
                </div>
                {renderSparkline(
                  monthlyTrends.map((t) => t.patients),
                  "#10B981"
                )}
              </div>
            </div>
            <div className="dark:border-zinc-850 rounded border border-slate-200/80 bg-slate-50 p-3 dark:bg-zinc-900/50">
              <span className="block text-[10px] font-bold uppercase text-slate-400">
                Subscribers Sparkline
              </span>
              <div className="mt-2 flex items-end justify-between">
                <div className="text-lg font-black text-slate-900 dark:text-slate-50">
                  {monthlyTrends[monthlyTrends.length - 1].subscriptions} Active
                </div>
                {renderSparkline(
                  monthlyTrends.map((t) => t.subscriptions),
                  "#10B981"
                )}
              </div>
            </div>
          </div>

          {/* Custom SVG Line Chart */}
          <div className="relative mt-4 flex h-[200px] w-full items-end">
            <div className="pointer-events-none absolute inset-0 flex select-none flex-col justify-between">
              {[1, 2, 3, 4].map((line) => (
                <div
                  key={line}
                  className="h-0 w-full border-t border-slate-100 dark:border-zinc-900/60"
                />
              ))}
            </div>

            <div className="relative z-10 flex h-[160px] w-full items-end justify-between px-6">
              {monthlyTrends.map((trend, idx) => {
                const maxPatients = Math.max(...monthlyTrends.map((t) => t.patients), 1);
                const barHeight = (trend.patients / maxPatients) * 120 + 20;

                return (
                  <div key={trend.label} className="group flex flex-1 flex-col items-center">
                    <div
                      className="relative flex w-8 flex-col justify-end rounded-t bg-slate-100 transition-all duration-300 hover:bg-brand-teal dark:bg-zinc-800 dark:hover:bg-brand-teal"
                      style={{ height: `${barHeight}px` }}
                    >
                      <span className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {trend.patients} Patients
                      </span>
                    </div>
                    <span className="mt-2 block text-[10px] font-bold text-slate-400">
                      {trend.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Flat Section */}
      <div className="dark:border-zinc-850 space-y-4 border-t border-slate-200/80 pt-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Super Admin Quick Commands
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Link
            href="/admin/providers"
            className="group flex select-none items-center space-x-3 rounded border border-slate-200/80 p-3 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
          >
            <div className="text-slate-650 dark:text-zinc-350 rounded bg-slate-100 p-2 transition-transform group-hover:scale-105 dark:bg-zinc-800">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Approve Providers
              </span>
              <span className="text-[10px] text-slate-400">Review sign-up requests</span>
            </div>
          </Link>
          <Link
            href="/admin/categories"
            className="group flex select-none items-center space-x-3 rounded border border-slate-200/80 p-3 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
          >
            <div className="text-slate-650 dark:text-zinc-350 rounded bg-slate-100 p-2 transition-transform group-hover:scale-105 dark:bg-zinc-800">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Manage Categories
              </span>
              <span className="text-[10px] text-slate-400">Configure taxonomies</span>
            </div>
          </Link>
          <Link
            href="/admin/reports"
            className="group flex select-none items-center space-x-3 rounded border border-slate-200/80 p-3 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
          >
            <div className="text-slate-650 dark:text-zinc-350 rounded bg-slate-100 p-2 transition-transform group-hover:scale-105 dark:bg-zinc-800">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Generate Reports
              </span>
              <span className="text-[10px] text-slate-400">Export growth analytics</span>
            </div>
          </Link>
          <Link
            href="/admin/settings"
            className="group flex select-none items-center space-x-3 rounded border border-slate-200/80 p-3 transition-all hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
          >
            <div className="text-slate-650 dark:text-zinc-350 rounded bg-slate-100 p-2 transition-transform group-hover:scale-105 dark:bg-zinc-800">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Global Settings
              </span>
              <span className="text-[10px] text-slate-400">Configure system policies</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Activity Feeds (Flat lists, no cards, divided by borders) */}
      <div className="dark:border-zinc-850 grid gap-12 border-t border-slate-200/80 pt-8 md:grid-cols-3">
        {/* Latest Registrations */}
        <div className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
            Latest Providers
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-zinc-900">
            {latestRegistrations.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No recent registrations</div>
            ) : (
              latestRegistrations.map((prov) => (
                <div
                  key={prov.id}
                  className="flex items-center justify-between py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                >
                  <div>
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      {prov.name}
                    </span>
                    <span className="block text-[10px] text-slate-400">{prov.email}</span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(prov.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`select-none rounded px-2 py-0.5 text-[9px] font-black ${
                      prov.status === "APPROVED"
                        ? "border border-slate-100 bg-slate-50 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400"
                        : prov.status === "PENDING"
                          ? "border border-slate-100 bg-slate-50 text-amber-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-amber-400"
                          : "border border-slate-100 bg-slate-50 text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500"
                    }`}
                  >
                    {prov.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Bookings */}
        <div className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
            Latest Bookings
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-zinc-900">
            {latestBookings.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No recent bookings</div>
            ) : (
              latestBookings.map((b) => (
                <div
                  key={b.id}
                  className="py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {b.customer.firstName} {b.customer.lastName}
                    </span>
                    <span className="font-mono text-[9px] font-semibold uppercase text-slate-500">
                      {b.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {b.service.name} @ {b.pharmacy.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                    <span>{new Date(b.startTime).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Failed Payments */}
        <div className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
            Payment Failures
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-zinc-900">
            {latestFailedPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400">
                <span className="mb-1 font-bold text-emerald-500">✓ Billing Healthy</span>
                <span>No recent renewal failures</span>
              </div>
            ) : (
              latestFailedPayments.map((hist) => (
                <div
                  key={hist.id}
                  className="py-3 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{hist.pharmacy.name}</span>
                    <span className="font-black text-rose-600 dark:text-rose-400">FAILED</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {hist.details || "Subscription renewal payment failed."}
                  </p>
                  <span className="mt-1 block text-[9px] text-slate-400">
                    {new Date(hist.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
