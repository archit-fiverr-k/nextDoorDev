import { db } from "@/lib/db";
import { PendingPharmacies } from "./pending-pharmacies";
import { ApprovedPharmacies } from "./approved-pharmacies";
import { AnalyticsChart } from "./analytics-chart";
import { SystemSettingsPanel } from "./system-settings-panel";
import { SubscriptionReminderTable } from "./subscriptions/reminder-table";
import { Store, Clock, CalendarDays, CheckCircle } from "lucide-react";
import { H1, H2, P } from "@/components/ui/typography";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const revalidate = 0; // Dynamic component

interface PageProps {
  searchParams: { tab?: string };
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  if ((session.user.role as string) === "super_admin") {
    redirect("/admin/dashboard");
  }
  const canManageSettings =
    (session.user.role as string) === "super_admin" || !!session.user.canManageSettings;
  const canManagePharmacies =
    (session.user.role as string) === "super_admin" || !!session.user.canManagePharmacies;

  const activeTab = searchParams.tab || "overview";

  // 1. Fetch statistics
  const [totalPharmacies, pendingPharmaciesCount, totalBookings, completedBookings] =
    await Promise.all([
      db.pharmacy.count(),
      db.pharmacy.count({ where: { status: "PENDING" } }),
      db.appointment.count(),
      db.appointment.count({ where: { status: "COMPLETED" } }),
    ]);

  // 2. Fetch pending pharmacies
  const pendingPharmacies = await db.pharmacy.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      createdAt: true,
    },
  });

  // 3. Fetch approved pharmacies
  const approvedPharmacies = await db.pharmacy.findMany({
    where: { status: "APPROVED" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
    },
  });

  // 4. Fetch unsubscribed pharmacies
  const allPharmaciesForSubs = await db.pharmacy.findMany({
    where: { deletedAt: null },
    include: { subscription: true },
  });
  const unsubscribedPharmacies = allPharmaciesForSubs
    .filter((p) => {
      if (!p.subscription) return true;
      const sub = p.subscription;
      return sub.status !== "ACTIVE" && sub.status !== "TRIAL" && sub.status !== "GRACE_PERIOD";
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      subStatus: p.subscription ? p.subscription.status : "NONE",
    }));

  // 5. Load monthly booking counts for chart (past 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const bookingsByMonth = await db.appointment.findMany({
    where: { startTime: { gte: sixMonthsAgo } },
    select: { startTime: true },
  });

  const monthlyData: { [key: string]: number } = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    monthlyData[monthKey] = 0;
  }

  bookingsByMonth.forEach((b) => {
    const monthKey = new Date(b.startTime).toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
    });
    if (monthlyData[monthKey] !== undefined) {
      monthlyData[monthKey]++;
    }
  });

  const chartData = Object.keys(monthlyData)
    .reverse()
    .map((month) => ({
      name: month,
      value: monthlyData[month],
    }));

  // 6. Fetch system settings
  let settings = await db.systemSetting.findFirst();
  if (!settings) {
    settings = await db.systemSetting.create({
      data: { isMaintenanceMode: false, announcementBanner: null },
    });
  }

  const tabsList = [
    { id: "overview", label: "Dashboard Overview" },
    { id: "directories", label: "Verification Directory" },
    { id: "settings", label: "Global Settings" },
  ];

  return (
    <div className="space-y-10 bg-white pb-12 font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      {/* Welcome header */}
      <div className="dark:border-zinc-850 select-none border-b border-slate-200/80 pb-6">
        <H1>Platform Administration</H1>
        <P className="mt-1">
          Review business statistics, approve pending branches, start secure login impersonation
          sessions, and manage global settings.
        </P>
      </div>

      {/* Tabs navigation row */}
      <div className="dark:border-zinc-850 flex select-none items-center space-x-2 border-b border-slate-200/80 pb-3">
        {tabsList.map((t) => {
          if (t.id === "settings" && !canManageSettings) return null;
          if (t.id === "directories" && !canManagePharmacies) return null;

          const isActive = activeTab === t.id;
          return (
            <a
              key={t.id}
              href={`/admin?tab=${t.id}`}
              className={`cursor-pointer rounded px-4 py-2 text-xs font-black transition-all ${
                isActive
                  ? "dark:text-zinc-150 bg-slate-900 text-white dark:bg-zinc-800"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200"
              }`}
            >
              {t.label}
            </a>
          );
        })}
      </div>

      {/* TAB CONTENTS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-10 duration-200 animate-in fade-in">
          {/* Flat KPI Metrics Row */}
          <div className="dark:border-zinc-850 grid select-none grid-cols-2 gap-6 border-b border-slate-200/80 pb-10 md:grid-cols-4">
            {/* Total Pharmacies */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Pharmacies
                </span>
                <Store className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
                {totalPharmacies}
              </div>
              <div className="text-[10px] text-slate-400">Registrations on directory</div>
            </div>

            {/* Pending Verification */}
            <div className="dark:border-zinc-850 space-y-2 border-l border-slate-200/80 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pending Verification
                </span>
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
                {pendingPharmaciesCount}
              </div>
              <div className="text-slate-450 text-[10px] dark:text-zinc-500">
                Awaiting setup reviews
              </div>
            </div>

            {/* Total Bookings */}
            <div className="dark:border-zinc-850 space-y-2 border-l border-slate-200/80 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Bookings
                </span>
                <CalendarDays className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
                {totalBookings}
              </div>
              <div className="text-[10px] text-slate-400">Appointments booked by consumers</div>
            </div>

            {/* Completed Visits */}
            <div className="dark:border-zinc-850 space-y-2 border-l border-slate-200/80 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Completed Visits
                </span>
                <CheckCircle className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
                {completedBookings}
              </div>
              <div className="text-[10px] text-slate-400">Appointments marked completed</div>
            </div>
          </div>

          {/* Chart Container directly on page */}
          <div className="w-full pt-4">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-slate-400">
              Marketplace Analytics Trend
            </h3>
            <AnalyticsChart data={chartData} />
          </div>
        </div>
      )}

      {/* TAB 2: DIRECTORIES */}
      {activeTab === "directories" && canManagePharmacies && (
        <div className="space-y-12 duration-200 animate-in fade-in">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Verification Queue (3 cols) */}
            <div className="space-y-4 lg:col-span-3">
              <H2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
                Verification Queue
              </H2>
              <PendingPharmacies
                pharmacies={pendingPharmacies}
                role={session.user.role as "super_admin" | "platform_admin" | "pharmacy"}
              />
            </div>

            {/* Approved Directory (2 cols) */}
            <div className="space-y-4 lg:col-span-2">
              <H2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
                Approved Directories
              </H2>
              <ApprovedPharmacies pharmacies={approvedPharmacies} />
            </div>
          </div>

          {/* Unsubscribed clinics section */}
          <div className="dark:border-zinc-850 space-y-4 border-t border-slate-200/80 pt-8">
            <H2 className="pb-2 text-sm font-bold uppercase tracking-wider text-slate-400">
              Unsubscribed Clinics & Payment Reminders
            </H2>
            <SubscriptionReminderTable pharmacies={unsubscribedPharmacies} />
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === "settings" && canManageSettings && (
        <div className="max-w-3xl duration-200 animate-in fade-in">
          <SystemSettingsPanel
            initialMaintenance={settings.isMaintenanceMode}
            initialBanner={settings.announcementBanner}
            initialMetrics={settings.trustMetrics}
            initialTabs={settings.trustTabs}
            initialTicker={settings.trustTicker}
            initialTickerTitle={settings.trustTickerTitle}
          />
        </div>
      )}
    </div>
  );
}
