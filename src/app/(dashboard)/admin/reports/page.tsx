import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, H2, P } from "@/components/ui/typography";
import {
  TrendingUp,
  Calendar,
  Percent,
  Store,
  BriefcaseMedical,
  FileSpreadsheet,
} from "lucide-react";
import { format, subDays } from "date-fns";
import { CsvExporter } from "./csv-exporter";

export const revalidate = 0;

interface PageProps {
  searchParams: {
    startDate?: string;
    endDate?: string;
  };
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  // Date range defaults
  const startStr = searchParams.startDate || format(subDays(new Date(), 30), "yyyy-MM-dd");
  const endStr = searchParams.endDate || format(new Date(), "yyyy-MM-dd");

  const startDate = new Date(startStr);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(endStr);
  endDate.setHours(23, 59, 59, 999);

  // 1. Fetch bookings in range
  const bookings = await db.appointment.findMany({
    where: {
      startTime: { gte: startDate, lte: endDate },
    },
    include: {
      customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      pharmacy: { select: { name: true, email: true } },
      service: { select: { name: true, price: true } },
    },
  });

  // Calculate trends & rates
  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledBookings = bookings.filter(
    (b) => b.status === "CANCELLED" || b.status === "REJECTED"
  ).length;

  const cancellationRate =
    totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : "0.0";

  // Provider Performance
  const providerPerfMap: { [key: string]: { name: string; email: string; bookings: number } } = {};
  bookings.forEach((b) => {
    const id = b.pharmacyId;
    if (!providerPerfMap[id]) {
      providerPerfMap[id] = {
        name: b.pharmacy.name,
        email: b.pharmacy.email,
        bookings: 0,
      };
    }
    providerPerfMap[id].bookings++;
  });
  const providerPerformance = Object.keys(providerPerfMap)
    .map((id) => ({ id, ...providerPerfMap[id] }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  // Popular Services
  const servicePopularityMap: { [key: string]: { name: string; count: number } } = {};
  bookings.forEach((b) => {
    const name = b.service.name;
    if (!servicePopularityMap[name]) {
      servicePopularityMap[name] = { name, count: 0 };
    }
    servicePopularityMap[name].count++;
  });
  const popularServices = Object.values(servicePopularityMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Export CSV Data
  const bookingsCsvData = bookings.map((b) => ({
    id: b.id,
    date: format(new Date(b.startTime), "yyyy-MM-dd HH:mm"),
    patientName: `${b.customer.firstName} ${b.customer.lastName}`,
    patientEmail: b.customer.email,
    patientPhone: b.customer.phone,
    clinicName: b.pharmacy.name,
    serviceName: b.service.name,
    price: b.service.price.toString(),
    status: b.status,
  }));

  // Fetch Providers list for CSV
  const providersRaw = await db.pharmacy.findMany({
    where: { deletedAt: null },
    include: { subscription: true, services: true },
  });
  const providersCsvData = providersRaw.map((p) => ({
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    status: p.status,
    saasPlan: p.subscription?.plan || "NONE",
    saasStatus: p.subscription?.status || "NONE",
    totalServices: p.services.length.toString(),
    joinedDate: format(new Date(p.createdAt), "yyyy-MM-dd"),
  }));

  // Fetch Patients list for CSV
  const patientsRaw = await db.customer.findMany({
    where: { deletedAt: null },
    include: { appointments: true },
  });
  const patientsCsvData = patientsRaw.map((pat) => ({
    id: pat.id,
    name: `${pat.firstName} ${pat.lastName}`,
    email: pat.email,
    phone: pat.phone,
    status: pat.isActive ? "ACTIVE" : "SUSPENDED",
    totalBookings: pat.appointments.length.toString(),
    joinedDate: format(new Date(pat.createdAt), "yyyy-MM-dd"),
  }));

  return (
    <div className="space-y-10 bg-white pb-12 font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      {/* Page Header */}
      <div className="dark:border-zinc-850 flex flex-col gap-4 border-b border-slate-200/80 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <H1 className="font-black text-slate-900 dark:text-slate-50">Marketplace Reports</H1>
          <P className="mt-1 text-slate-500 dark:text-zinc-400">
            Aggregate clinical metrics, review cancellation rates, and export structured databases
            to CSV/Excel formats.
          </P>
        </div>

        {/* Date Filter Form */}
        <div className="dark:border-zinc-850 shrink-0 rounded border border-slate-200/80 bg-white p-3 dark:bg-zinc-950">
          <form
            method="GET"
            action="/admin/reports"
            className="flex items-center space-x-2 text-xs font-semibold"
          >
            <div className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                name="startDate"
                defaultValue={startStr}
                className="rounded border border-slate-200 bg-white p-1 font-mono text-[11px] focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <span className="text-slate-400">&rarr;</span>
            <div className="flex items-center space-x-1">
              <input
                type="date"
                name="endDate"
                defaultValue={endStr}
                className="rounded border border-slate-200 bg-white p-1 font-mono text-[11px] focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="h-8 rounded bg-slate-900 px-3 py-1.5 text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {/* Analytics Flat Row */}
      <div className="dark:border-zinc-850 grid select-none grid-cols-2 gap-6 border-b border-slate-200/80 pb-10 md:grid-cols-4">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Range Bookings
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {totalBookings}
          </div>
        </div>
        <div className="dark:border-zinc-850 border-l border-slate-200/80 pl-6">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            Visits Completed
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {completedBookings}
          </div>
        </div>
        <div className="dark:border-zinc-850 border-l border-slate-200/80 pl-6">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-500">
            Cancellations
          </span>
          <div className="dark:text-rose-450 mt-1 text-2xl font-black text-rose-600">
            {cancelledBookings}
          </div>
        </div>
        <div className="dark:border-zinc-850 border-l border-slate-200/80 pl-6">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-violet-500">
            Cancellation Rate
          </span>
          <div className="mt-1 text-2xl font-black text-violet-600 dark:text-violet-400">
            {cancellationRate}%
          </div>
        </div>
      </div>

      {/* CSV Export Templates */}
      <div className="space-y-4">
        <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
          Structured Data Exporter
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Bookings CSV */}
          <CsvExporter
            data={bookingsCsvData}
            filename={`bookings_report_${startStr}_to_${endStr}.csv`}
            title="Export Bookings CSV"
            subtitle={`${bookingsCsvData.length} records in date range`}
            icon="bookings"
          />

          {/* Providers CSV */}
          <CsvExporter
            data={providersCsvData}
            filename="providers_directory_export.csv"
            title="Export Providers CSV"
            subtitle={`${providersCsvData.length} active platform clinics`}
            icon="providers"
          />

          {/* Patients CSV */}
          <CsvExporter
            data={patientsCsvData}
            filename="patients_directory_export.csv"
            title="Export Patients CSV"
            subtitle={`${patientsCsvData.length} registered consumers`}
            icon="patients"
          />
        </div>
      </div>

      {/* Lists directly on page separated by thin border dividers */}
      <div className="dark:border-zinc-850 grid gap-12 border-t border-slate-200/80 pt-8 md:grid-cols-2">
        {/* Provider Performance */}
        <div className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
            Provider Performance (Top 5)
          </h2>
          <div className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
            {providerPerformance.length === 0 ? (
              <div className="p-6 text-center italic text-slate-400">
                No booking records in range.
              </div>
            ) : (
              providerPerformance.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <div>
                      <strong className="block font-bold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </strong>
                      <span className="text-[10px] text-slate-400">{item.email}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <strong className="block text-sm font-black text-slate-900 dark:text-white">
                      {item.bookings} Bookings
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Services */}
        <div className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
            Popular Services (Top 5)
          </h2>
          <div className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
            {popularServices.length === 0 ? (
              <div className="p-6 text-center italic text-slate-400">No bookings recorded.</div>
            ) : (
              popularServices.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-slate-650 dark:text-zinc-350 shrink-0 rounded bg-slate-50 p-2 dark:bg-zinc-900">
                      <BriefcaseMedical className="h-4 w-4" />
                    </div>
                    <strong className="block font-bold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </strong>
                  </div>
                  <div className="text-right">
                    <strong className="block text-sm font-black text-slate-900 dark:text-white">
                      {item.count} Booked
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
