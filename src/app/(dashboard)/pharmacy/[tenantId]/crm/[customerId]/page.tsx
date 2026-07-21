import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PatientNotesManager } from "./patient-notes-manager";
import { format } from "date-fns";
import { Calendar, Mail, Phone, Clock, FileText, ChevronRight, Bookmark } from "lucide-react";
import { PatientTagsEditor } from "./patient-tags-editor";

export const revalidate = 0;

interface CustomerDetailPageProps {
  params: {
    tenantId: string;
    customerId: string;
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const customer = await db.customer.findUnique({
    where: { id: params.customerId },
    include: {
      appointments: {
        include: {
          service: true,
        },
        orderBy: {
          startTime: "desc",
        },
      },
      crmNotes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // Verify existence & Tenant Boundary Isolation
  if (!customer || customer.pharmacyId !== params.tenantId) {
    notFound();
  }

  // Filter Bookings into Upcoming vs Previous
  const now = new Date();
  const upcomingBookings = customer.appointments.filter((app) => new Date(app.startTime) >= now);
  const previousBookings = customer.appointments.filter((app) => new Date(app.startTime) < now);

  return (
    <div className="flex h-full flex-1 select-text flex-col overflow-hidden bg-slate-50/20">
      {/* Profile Header */}
      <div className="flex flex-col gap-6 border-b border-slate-100 bg-white p-6 dark:border-zinc-900/60 dark:bg-zinc-950 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-12 w-12 select-none items-center justify-center rounded-full bg-blue-50 text-lg font-extrabold uppercase text-blue-600 dark:bg-blue-950/20 dark:text-blue-500">
            {customer.firstName[0]}
            {customer.lastName[0]}
          </div>
          <div>
            <h3 className="flex items-center space-x-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
              <span>
                {customer.firstName} {customer.lastName}
              </span>
            </h3>
            <p className="text-slate-450 mt-0.5 text-[10px] font-semibold">
              Patient since {format(new Date(customer.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Contact credentials & Tags Editor */}
        <div className="flex flex-col space-y-2 md:items-end">
          <div className="text-slate-550 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold dark:text-zinc-400">
            <span className="flex items-center">
              <Mail className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              {customer.email}
            </span>
            <span className="flex items-center">
              <Phone className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              {customer.phone}
            </span>
            {customer.dateOfBirth && (
              <span className="flex items-center">
                <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                DoB: {format(new Date(customer.dateOfBirth), "MMMM d, yyyy")}
              </span>
            )}
          </div>

          {/* Patient tags editor component */}
          <PatientTagsEditor customerId={customer.id} initialTags={customer.tags || ""} />
        </div>
      </div>

      {/* Main CRM Workspace (split row: history and logs) */}
      <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
        {/* Left pane: Booking History */}
        <div className="space-y-6">
          {/* Upcoming bookings */}
          <div className="space-y-3">
            <h4 className="flex select-none items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <Clock className="text-blue-650 mr-1.5 h-4 w-4" />
              <span>Upcoming Bookings ({upcomingBookings.length})</span>
            </h4>

            {upcomingBookings.length === 0 ? (
              <p className="rounded-2xl border border-slate-100 bg-white p-4 text-center text-xs font-medium italic text-slate-400 shadow-sm">
                No upcoming appointments scheduled.
              </p>
            ) : (
              upcomingBookings.map((app) => (
                <div
                  key={app.id}
                  className="border-slate-150 space-y-3 rounded-2xl border bg-white p-4 shadow-sm dark:border-zinc-900/60 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {app.service.name}
                      </h5>
                      <span className="text-slate-450 mt-0.5 block text-[10px] font-bold">
                        £{Number(app.service.price).toFixed(2)} • {app.service.duration} mins
                      </span>
                    </div>

                    <span className="rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-blue-700 dark:bg-blue-950/20 dark:text-blue-500">
                      {app.status}
                    </span>
                  </div>

                  <div className="dark:text-zinc-450 space-y-0.5 text-[10px] font-semibold text-slate-500">
                    <p className="flex items-center">
                      <Calendar className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {format(new Date(app.startTime), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="flex items-center">
                      <Clock className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {format(new Date(app.startTime), "h:mm a")} -{" "}
                      {format(new Date(app.endTime), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Previous bookings */}
          <div className="space-y-3">
            <h4 className="flex select-none items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <Clock className="text-slate-450 mr-1.5 h-4 w-4" />
              <span>Previous History ({previousBookings.length})</span>
            </h4>

            {previousBookings.length === 0 ? (
              <p className="rounded-2xl border border-slate-100 bg-white p-4 text-center text-xs font-medium italic text-slate-400 shadow-sm">
                No past treatment logs.
              </p>
            ) : (
              previousBookings.map((app) => (
                <div
                  key={app.id}
                  className="border-slate-150 space-y-2 rounded-2xl border bg-white p-4 opacity-85 shadow-sm dark:border-zinc-900/60 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {app.service.name}
                      </h5>
                      <span className="text-slate-450 mt-0.5 block text-[10px] font-bold">
                        £{Number(app.service.price).toFixed(2)} • {app.service.duration} mins
                      </span>
                    </div>

                    <span className="rounded border border-slate-100 bg-slate-50 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
                      {app.status}
                    </span>
                  </div>

                  <div className="text-slate-455 text-[10px] font-semibold">
                    <span>Treatment date: {format(new Date(app.startTime), "MMMM d, yyyy")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right pane: Clinical CRM Notes Manager (Supports Clinical and Internal Notes) */}
        <div className="space-y-4">
          <h4 className="flex select-none items-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <FileText className="text-blue-650 mr-1.5 h-4 w-4" />
            <span>Consultation logs & Notes</span>
          </h4>

          <PatientNotesManager
            pharmacyId={params.tenantId}
            customerId={params.customerId}
            notes={customer.crmNotes}
          />
        </div>
      </div>
    </div>
  );
}
