import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { H1, H2, P } from "@/components/ui/typography";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from "date-fns";
import { CalendarRange, DollarSign, Users, PlusCircle, Clock, User } from "lucide-react";
import Link from "next/link";
import { BlockDatesButton } from "./block-dates-button";

export const revalidate = 0; // Dynamic data

interface PharmacyDashboardPageProps {
  params: {
    tenantId: string;
  };
}

export default async function PharmacyDashboardPage({ params }: PharmacyDashboardPageProps) {
  const pharmacyId = params.tenantId;

  // 1. Calculate date boundaries
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Starts Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // 2. Fetch statistics & lists concurrently
  const [
    todayAppointments,
    upcomingAppointments,
    weeklyAppointmentsCount,
    weeklyAppointmentsForRevenue,
    totalCustomersCount,
    recentCustomers,
  ] = await Promise.all([
    // Today's appointments
    db.appointment.findMany({
      where: {
        pharmacyId,
        startTime: { gte: todayStart, lte: todayEnd },
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        startTime: "asc",
      },
    }),
    // Next 5 upcoming appointments
    db.appointment.findMany({
      where: {
        pharmacyId,
        startTime: { gt: todayEnd },
      },
      take: 5,
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        startTime: "asc",
      },
    }),
    // Weekly bookings count
    db.appointment.count({
      where: {
        pharmacyId,
        startTime: { gte: weekStart, lte: weekEnd },
      },
    }),
    // Weekly bookings list to sum up revenue
    db.appointment.findMany({
      where: {
        pharmacyId,
        startTime: { gte: weekStart, lte: weekEnd },
        status: { not: "CANCELLED" },
      },
      include: {
        service: {
          select: {
            price: true,
          },
        },
      },
    }),
    // Total pharmacy customers
    db.customer.count({
      where: {
        pharmacyId,
      },
    }),
    // 5 most recent customers
    db.customer.findMany({
      where: {
        pharmacyId,
      },
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  // Sum up estimated weekly revenue
  const weeklyRevenue = weeklyAppointmentsForRevenue.reduce(
    (sum, app) => sum + Number(app.service.price),
    0
  );

  return (
    <div className="space-y-8">
      {/* Dashboard welcome header */}
      <div>
        <H1>Workspace Dashboard</H1>
        <P className="mt-1">
          Review daily schedules, track weekly performance stats, and access pharmacy setup
          operations.
        </P>
      </div>

      {/* Grid of 3 Weekly Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Weekly Bookings
            </CardTitle>
            <CalendarRange className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              {weeklyAppointmentsCount}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Appointments scheduled for this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Estimated Weekly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              £{weeklyRevenue.toFixed(2)}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Excludes cancelled slots this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              {totalCustomersCount}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Unique patients registered at your branch
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Today/Upcoming (3 cols) and Actions/Recent Customers (2 cols) */}
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Bookings Section (3 cols) */}
        <div className="space-y-8 lg:col-span-3">
          {/* Today's Bookings */}
          <div className="space-y-4">
            <H2>{"Today's Bookings"}</H2>
            <div className="shadow-premium overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
              {todayAppointments.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
                  No appointments scheduled for today.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-900/60">
                  {todayAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between space-x-4 p-4 sm:p-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
                          {app.customer.firstName} {app.customer.lastName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                          {app.service.name} • Duration: {app.service.duration} mins • £
                          {Number(app.service.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block font-mono text-xs font-bold text-blue-600 dark:text-blue-500">
                          {format(new Date(app.startTime), "h:mm a")}
                        </span>
                        <span className="dark:text-zinc-450 mt-1 inline-block rounded-full border bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-800 dark:bg-zinc-900">
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="space-y-4">
            <H2>Upcoming Bookings</H2>
            <div className="shadow-premium overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
              {upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
                  No upcoming appointments.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-900/60">
                  {upcomingAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between space-x-4 p-4 sm:p-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
                          {app.customer.firstName} {app.customer.lastName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                          {app.service.name} • ${Number(app.service.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block font-mono text-xs font-semibold text-slate-600 dark:text-zinc-400">
                          {format(new Date(app.startTime), "MMM d, h:mm a")}
                        </span>
                        <span className="dark:text-zinc-450 mt-1 inline-block rounded-full border bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:border-zinc-800 dark:bg-zinc-900">
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Controls Section (2 cols) */}
        <div className="space-y-8 lg:col-span-2">
          {/* Quick Actions */}
          <div className="space-y-4">
            <H2>Quick Actions</H2>
            <div className="grid gap-3">
              <Link
                href={`/pharmacy/${pharmacyId}/services`}
                className="flex items-center space-x-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:bg-zinc-900/50"
              >
                <PlusCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Register Services
                  </h4>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Define vaccinations, reviews, or checks.
                  </p>
                </div>
              </Link>

              <Link
                href={`/pharmacy/${pharmacyId}/availability`}
                className="flex items-center space-x-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:bg-slate-50 dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:bg-zinc-900/50"
              >
                <Clock className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Configure Hours
                  </h4>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Set weekly operating hours & timeslots.
                  </p>
                </div>
              </Link>

              <BlockDatesButton />
            </div>
          </div>

          {/* Recent Customers */}
          <div className="space-y-4">
            <H2>Recent Customers</H2>
            <div className="shadow-premium overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
              {recentCustomers.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
                  No customers registered yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-zinc-900/60">
                  {recentCustomers.map((cust) => (
                    <div key={cust.id} className="flex items-center space-x-3 p-3 sm:p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 dark:bg-zinc-900 dark:text-blue-500">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                          {cust.firstName} {cust.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {cust.email} | {cust.phone}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
