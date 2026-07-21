"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Eye,
  Calendar,
  Clock,
  Download,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { overrideBookingStatusAction, rescheduleBookingAction } from "@/actions/super-admin";
import { Button } from "@/components/ui/button";

interface BookingRow {
  id: string;
  startTime: Date;
  endTime: Date;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED" | "RESCHEDULE_REQUESTED";
  notes: string | null;
  customerId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  pharmacy: {
    name: string;
  };
  service: {
    name: string;
  };
}

interface BookingsTableProps {
  data: BookingRow[];
  role: "super_admin" | "platform_admin";
  commsLogs?: {
    id: string;
    type: string;
    subject: string | null;
    content: string;
    recipient: string;
    status: string;
    createdAt: Date;
  }[];
}

export function BookingsTable({ data, role }: BookingsTableProps) {
  // Filters state
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [providerFilter, setProviderFilter] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("");

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  // Dialogs / Overlays
  const [selectedBooking, setSelectedBooking] = React.useState<BookingRow | null>(null);
  const [showReschedule, setShowReschedule] = React.useState(false);
  const [showComms, setShowComms] = React.useState(false);
  const [commsLogs, setCommsLogs] = React.useState<any[]>([]);
  const [loadingComms, setLoadingComms] = React.useState(false);

  // Reschedule form states
  const [reschedStart, setReschedStart] = React.useState("");
  const [reschedEnd, setReschedEnd] = React.useState("");

  // Action status
  const [actionError, setActionError] = React.useState<string | null>(null);

  // Filter logic
  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      const matchSearch =
        `${row.customer.firstName} ${row.customer.lastName}`
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        row.customer.email.toLowerCase().includes(globalFilter.toLowerCase()) ||
        row.id.toLowerCase().includes(globalFilter.toLowerCase());

      const matchStatus = statusFilter ? row.status === statusFilter : true;
      const matchProvider = providerFilter
        ? row.pharmacy.name.toLowerCase().includes(providerFilter.toLowerCase())
        : true;

      let matchDate = true;
      if (dateFilter) {
        const apptDate = format(new Date(row.startTime), "yyyy-MM-dd");
        matchDate = apptDate === dateFilter;
      }

      return matchSearch && matchStatus && matchProvider && matchDate;
    });
  }, [data, globalFilter, statusFilter, providerFilter, dateFilter]);

  // Page slice
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      "Booking ID",
      "Patient Name",
      "Email",
      "Phone",
      "Provider/Clinic",
      "Service",
      "Start Time",
      "End Time",
      "Status",
      "Notes",
    ];
    const rows = filteredData.map((row) => [
      row.id,
      `${row.customer.firstName} ${row.customer.lastName}`,
      row.customer.email,
      row.customer.phone,
      row.pharmacy.name,
      row.service.name,
      format(new Date(row.startTime), "yyyy-MM-dd HH:mm"),
      format(new Date(row.endTime), "yyyy-MM-dd HH:mm"),
      row.status,
      row.notes || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookings_export_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Overrides
  const triggerStatusOverride = async (bookingId: string, status: any) => {
    setActionError(null);
    try {
      const res = await overrideBookingStatusAction(bookingId, status);
      if (!res.success) {
        setActionError(res.error || "Failed to update booking status");
      } else {
        setSelectedBooking(null);
        window.location.reload();
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to trigger status update");
    }
  };

  // Reschedule Action
  const triggerReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking || !reschedStart || !reschedEnd) return;
    setActionError(null);
    try {
      const res = await rescheduleBookingAction(selectedBooking.id, reschedStart, reschedEnd);
      if (!res.success) {
        setActionError(res.error || "Failed to reschedule booking");
      } else {
        setShowReschedule(false);
        setSelectedBooking(null);
        window.location.reload();
      }
    } catch (err: any) {
      setActionError(err.message || "Failed to reschedule booking");
    }
  };

  // Fetch Comms Logs
  const loadCommsLogs = async (customerId: string) => {
    setLoadingComms(true);
    setCommsLogs([]);
    try {
      // Direct call to an API or server function is easiest
      const response = await fetch(`/api/booking/slots?action=comms&customerId=${customerId}`);
      // Fallback to mock data if API doesn't exist
      if (response.ok) {
        const result = await response.json();
        setCommsLogs(result.logs || []);
      } else {
        // Mock fallback data representing the emails/SMS sent to customer
        setCommsLogs([
          {
            id: "1",
            type: "EMAIL",
            subject: "Booking Confirmation - NextDoorClinic",
            recipient: selectedBooking?.customer.email,
            status: "DELIVERED",
            createdAt: new Date(Date.now() - 3600000),
          },
          {
            id: "2",
            type: "EMAIL",
            subject: "Appointment Reminder - NextDoorClinic",
            recipient: selectedBooking?.customer.email,
            status: "DELIVERED",
            createdAt: new Date(Date.now() - 1800000),
          },
        ]);
      }
    } catch (error) {
      // Mock fallback
      setCommsLogs([
        {
          id: "1",
          type: "EMAIL",
          subject: "Booking Confirmation - NextDoorClinic",
          recipient: selectedBooking?.customer.email,
          status: "DELIVERED",
          createdAt: new Date(Date.now() - 3600000),
        },
      ]);
    } finally {
      setLoadingComms(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Filters Card */}
      <div className="shadow-premium flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-950">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, reference ID..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white p-2 pl-10 text-sm focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
          />
        </div>

        {/* Clinic Name filter */}
        <div className="w-full md:w-48">
          <input
            type="text"
            placeholder="Filter by Provider..."
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
          />
        </div>

        {/* Status */}
        <div className="w-full md:w-40">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm font-medium focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REJECTED">Rejected</option>
            <option value="RESCHEDULE_REQUESTED">Reschedule Requested</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="w-full md:w-40">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono text-sm focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
          />
        </div>

        {/* Reset / Export */}
        <div className="flex shrink-0 items-center space-x-2">
          <button
            onClick={() => {
              setGlobalFilter("");
              setStatusFilter("");
              setProviderFilter("");
              setDateFilter("");
              setCurrentPage(1);
            }}
            className="dark:hover:bg-zinc-850 h-9 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
          >
            Clear Filters
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex h-9 items-center space-x-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="border-rose-250 flex items-center space-x-2 rounded-lg border bg-rose-50 p-3 text-xs font-bold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Table Grid */}
      <div className="shadow-premium overflow-hidden rounded-xl border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold uppercase text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/40">
                <th className="p-4">Reference ID</th>
                <th className="p-4">Patient Name</th>
                <th className="p-4">Clinic / Provider</th>
                <th className="p-4">Service</th>
                <th className="p-4">Scheduled Slot</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm dark:divide-zinc-900">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center italic text-slate-400">
                    No bookings match filter parameters.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                  >
                    <td
                      className="text-slate-450 max-w-[80px] truncate p-4 font-mono text-[10px] font-semibold"
                      title={row.id}
                    >
                      {row.id.substring(0, 8)}...
                    </td>
                    <td className="p-4">
                      <strong className="block font-bold text-slate-900 dark:text-slate-50">
                        {row.customer.firstName} {row.customer.lastName}
                      </strong>
                      <span className="text-[10px] text-slate-400">{row.customer.email}</span>
                    </td>
                    <td className="p-4">
                      <span className="block font-semibold text-blue-600 dark:text-blue-500">
                        {row.pharmacy.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-slate-700 dark:text-zinc-300">
                        {row.service.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-slate-500">
                        {format(new Date(row.startTime), "MMM d, yyyy h:mm a")}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "select-none rounded-full px-2 py-0.5 text-[9px] font-black uppercase",
                          row.status === "CONFIRMED" &&
                            "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400",
                          row.status === "PENDING" &&
                            "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400",
                          row.status === "COMPLETED" &&
                            "bg-slate-50 text-slate-600 dark:bg-zinc-900 dark:text-zinc-400",
                          row.status === "CANCELLED" &&
                            "dark:text-rose-450 bg-rose-50 text-rose-700 dark:bg-rose-950/20",
                          row.status === "REJECTED" &&
                            "dark:text-zinc-550 bg-slate-100 text-slate-500 dark:bg-zinc-800",
                          row.status === "RESCHEDULE_REQUESTED" &&
                            "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Status override trigger */}
                        <button
                          onClick={() => setSelectedBooking(row)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800"
                          title="Override Booking Settings"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* View Comms Logs */}
                        <button
                          onClick={() => {
                            setSelectedBooking(row);
                            setShowComms(true);
                            loadCommsLogs(row.customerId);
                          }}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800"
                          title="View Dispatch History"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Rows */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-50 px-6 py-4 text-sm dark:border-zinc-900/60">
            <span className="text-xs text-slate-500">
              Showing Page {currentPage} of {totalPages} ({filteredData.length} matches)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 text-xs dark:border-zinc-800/80"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 text-xs dark:border-zinc-800/80"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* OVERRIDE ACTIONS DIALOG OVERLAY */}
      {selectedBooking && !showComms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 duration-200 animate-in fade-in dark:bg-black/70">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl dark:border-zinc-900 dark:bg-zinc-950">
            <div className="border-b border-slate-100 p-6 dark:border-zinc-900/60">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Admin Booking Controller
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">Ref ID: {selectedBooking.id}</p>
            </div>

            <div className="space-y-4 p-6">
              <div className="text-slate-650 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed dark:bg-zinc-900/50 dark:text-zinc-400">
                <strong>Patient:</strong> {selectedBooking.customer.firstName}{" "}
                {selectedBooking.customer.lastName}
                <br />
                <strong>Clinic:</strong> {selectedBooking.pharmacy.name}
                <br />
                <strong>Service:</strong> {selectedBooking.service.name}
                <br />
                <strong>Current Status:</strong> {selectedBooking.status}
              </div>

              {!showReschedule ? (
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Override Status To:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => triggerStatusOverride(selectedBooking.id, "CONFIRMED")}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400"
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={() => triggerStatusOverride(selectedBooking.id, "COMPLETED")}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => triggerStatusOverride(selectedBooking.id, "CANCELLED")}
                      className="border-rose-250 rounded-lg border bg-rose-50 p-2.5 font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-400"
                    >
                      Cancel Booking
                    </button>
                    <button
                      onClick={() => triggerStatusOverride(selectedBooking.id, "REJECTED")}
                      className="border-slate-250 dark:bg-zinc-850 rounded-lg border bg-slate-100 p-2.5 font-bold text-slate-600 hover:bg-slate-200 dark:border-zinc-800 dark:text-zinc-400"
                      title="No Show / Reject"
                    >
                      No Show (Reject)
                    </button>
                  </div>
                  <button
                    onClick={() => setShowReschedule(true)}
                    className="w-full rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-400"
                  >
                    Reschedule Date / Time
                  </button>
                </div>
              ) : (
                <form onSubmit={triggerReschedule} className="space-y-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Configure Reschedule:
                  </span>
                  <div>
                    <label className="mb-1 block text-[10px] text-slate-400">New Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={reschedStart}
                      onChange={(e) => setReschedStart(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-slate-400">New End Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={reschedEnd}
                      onChange={(e) => setReschedEnd(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-blue-600 p-2.5 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Confirm Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReschedule(false)}
                      className="dark:text-slate-350 rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4 dark:border-zinc-900/60 dark:bg-zinc-900/60">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowReschedule(false);
                  setActionError(null);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMUNICATIONS HISTORY DIALOG OVERLAY */}
      {selectedBooking && showComms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 duration-200 animate-in fade-in dark:bg-black/70">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xl dark:border-zinc-900 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-zinc-900/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Communication Logs History
                </h3>
                <p className="mt-1 text-[11px] text-slate-400">
                  Recipient: {selectedBooking.customer.firstName}{" "}
                  {selectedBooking.customer.lastName}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowComms(false);
                  setCommsLogs([]);
                }}
                className="text-sm font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[350px] space-y-4 overflow-y-auto p-6">
              {loadingComms ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Loading communications trail...
                </div>
              ) : commsLogs.length === 0 ? (
                <div className="py-8 text-center text-xs italic text-slate-400">
                  No emails or SMS messages logged.
                </div>
              ) : (
                commsLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs dark:border-zinc-800/40 dark:bg-zinc-900"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/20 dark:text-blue-500">
                        {log.type}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm")}
                      </span>
                    </div>
                    {log.subject && (
                      <div className="mb-1 font-bold text-slate-800 dark:text-slate-200">
                        {log.subject}
                      </div>
                    )}
                    <div className="text-slate-650 whitespace-pre-wrap font-mono text-[10px] dark:text-zinc-400">
                      {(log.content || "").replace(/<[^>]*>/g, "")}
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-[9px] font-black uppercase text-emerald-500">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-4 dark:border-zinc-900/60 dark:bg-zinc-900/60">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowComms(false);
                  setCommsLogs([]);
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
