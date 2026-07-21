"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  updateAppointmentStatusAction,
  rescheduleAppointmentAction,
  updateAppointmentNotesAction,
  bulkUpdateAppointmentStatusAction,
} from "@/actions/appointments";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  X,
  FileText,
  User,
  Activity,
  Edit,
  Save,
} from "lucide-react";

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ServiceData {
  id: string;
  name: string;
  duration: number;
  price: any;
}

interface AppointmentRow {
  id: string;
  customerId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED" | "RESCHEDULE_REQUESTED";
  notes: string | null;
  customer: CustomerData;
  service: ServiceData;
}

interface AuditLogRow {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityId: string;
  changes: any;
  createdAt: Date;
}

interface AppointmentsTableProps {
  pharmacyId: string;
  appointments: AppointmentRow[];
  auditLogs: AuditLogRow[];
}

const columnHelper = createColumnHelper<AppointmentRow>();

export function AppointmentsTable({ pharmacyId, appointments, auditLogs }: AppointmentsTableProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    | "ALL"
    | "PENDING"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "REJECTED"
    | "RESCHEDULE_REQUESTED"
  >("ALL");
  const [isPending, startTransition] = React.useTransition();

  // Multi-select bulk state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Modals / dialogues state
  const [rescheduleAppointment, setRescheduleAppointment] = React.useState<AppointmentRow | null>(
    null
  );
  const [rescheduleData, setRescheduleData] = React.useState({ start: "", end: "" });

  const [notesAppointment, setNotesAppointment] = React.useState<AppointmentRow | null>(null);
  const [notesValue, setNotesValue] = React.useState("");

  const [activeTimelineId, setActiveTimelineId] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Status handler
  const handleStatusChange = (
    id: string,
    status:
      "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED" | "RESCHEDULE_REQUESTED"
  ) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateAppointmentStatusAction(id, status);
      if (res.success) {
        setSuccessMsg(`Appointment status updated to ${status}.`);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to update appointment status");
      }
    });
  };

  // Reschedule handler
  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAppointment) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await rescheduleAppointmentAction(
        rescheduleAppointment.id,
        rescheduleData.start,
        rescheduleData.end
      );
      if (res.success) {
        setSuccessMsg("Appointment rescheduled successfully.");
        setRescheduleAppointment(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to reschedule appointment");
      }
    });
  };

  // Notes handler
  const handleNotesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesAppointment) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await updateAppointmentNotesAction(notesAppointment.id, notesValue);
      if (res.success) {
        setSuccessMsg("Appointment notes updated successfully.");
        setNotesAppointment(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to save notes");
      }
    });
  };

  // Bulk Actions
  const handleBulkStatusChange = (
    status:
      "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED" | "RESCHEDULE_REQUESTED"
  ) => {
    if (selectedIds.length === 0) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await bulkUpdateAppointmentStatusAction(selectedIds, status, pharmacyId);
      if (res.success) {
        setSuccessMsg(`Successfully updated ${selectedIds.length} appointments to ${status}.`);
        setSelectedIds([]);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to perform bulk update");
      }
    });
  };

  // CSV Exporters
  const exportToCSV = (formatType: "csv" | "excel") => {
    const headers = [
      "Appointment ID",
      "Patient Name",
      "Email",
      "Phone",
      "Service Type",
      "Billing Cost",
      "Duration",
      "Scheduled Date",
      "Time Slot",
      "Status",
    ];
    const rows = filteredData.map((app) => [
      app.id,
      `${app.customer.firstName} ${app.customer.lastName}`,
      app.customer.email,
      app.customer.phone,
      app.service.name,
      `£${Number(app.service.price).toFixed(2)}`,
      `${app.service.duration} mins`,
      format(new Date(app.startTime), "yyyy-MM-dd"),
      `${format(new Date(app.startTime), "h:mm a")} - ${format(new Date(app.endTime), "h:mm a")}`,
      app.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    // Add UTF-8 BOM encoding for proper Excel formatting support
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `appointment_export_${new Date().toISOString().slice(0, 10)}.${formatType === "excel" ? "csv" : "csv"}`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Local table filters
  const filteredData = React.useMemo(() => {
    return appointments.filter((app) => {
      if (statusFilter === "ALL") return true;
      return app.status === statusFilter;
    });
  }, [appointments, statusFilter]);

  const handleToggleRowSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleAllSelection = (rows: AppointmentRow[]) => {
    const activeIdsOnPage = rows.map((r) => r.id);
    const allSelected = activeIdsOnPage.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !activeIdsOnPage.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const uniqueNew = activeIdsOnPage.filter((id) => !prev.includes(id));
        return [...prev, ...uniqueNew];
      });
    }
  };

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => (
          <button
            onClick={() => handleToggleAllSelection(filteredData)}
            className="text-slate-455 transition-colors hover:text-slate-900"
          >
            <CheckSquare className="h-4 w-4" />
          </button>
        ),
        cell: (info) => {
          const row = info.row.original;
          const isSelected = selectedIds.includes(row.id);
          return (
            <button
              onClick={() => handleToggleRowSelection(row.id)}
              className="text-slate-455 transition-colors hover:text-slate-900"
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          );
        },
      }),
      columnHelper.accessor("customer", {
        header: "Patient details",
        cell: (info) => {
          const customer = info.getValue();
          return (
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                {customer.firstName[0]}
                {customer.lastName[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {customer.firstName} {customer.lastName}
                </p>
                <span className="block text-[10px] font-semibold text-slate-400">
                  {customer.email}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("service", {
        header: "Clinical service",
        cell: (info) => {
          const service = info.getValue();
          return (
            <div>
              <span className="block font-bold text-slate-900 dark:text-slate-100">
                {service.name}
              </span>
              <span className="text-slate-455 block text-[10px] font-semibold">
                {service.duration} mins • £{Number(service.price).toFixed(2)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("startTime", {
        header: "Scheduled slot",
        cell: (info) => {
          const start = new Date(info.getValue());
          const row = info.row.original;
          return (
            <div className="text-slate-550 space-y-0.5 text-[10px] font-semibold">
              <p className="flex items-center">
                <Calendar className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                {format(start, "EEE, MMM d, yyyy")}
              </p>
              <p className="flex items-center">
                <Clock className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                {format(start, "h:mm a")} - {format(new Date(row.endTime), "h:mm a")}
              </p>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Booking status",
        cell: (info) => {
          const status = info.getValue();
          return (
            <span
              className={cn(
                "select-none rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase leading-none tracking-wide",
                status === "CONFIRMED" && "border-emerald-250 bg-emerald-50 text-emerald-700",
                status === "PENDING" && "border-amber-250 bg-amber-50 text-amber-700",
                status === "COMPLETED" && "text-blue-750 border-blue-200 bg-blue-50",
                status === "CANCELLED" && "border-rose-250 bg-rose-50 text-rose-700",
                status === "REJECTED" && "text-slate-550 border-slate-300 bg-slate-100"
              )}
            >
              {status}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "operations",
        header: "Roster controls",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center space-x-2">
              {/* Direct status transitions */}
              {row.status === "PENDING" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(row.id, "CONFIRMED")}
                    disabled={isPending}
                    className="h-8 border-emerald-100 px-2 text-emerald-600 hover:bg-emerald-50"
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(row.id, "REJECTED")}
                    disabled={isPending}
                    className="h-8 border-rose-100 px-2 text-rose-600 hover:bg-rose-50"
                  >
                    Reject
                  </Button>
                </>
              )}

              {row.status === "CONFIRMED" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(row.id, "COMPLETED")}
                    disabled={isPending}
                    className="h-8 border-blue-100 px-2 text-blue-600 hover:bg-blue-50"
                  >
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(row.id, "CANCELLED")}
                    disabled={isPending}
                    className="h-8 border-rose-100 px-2 text-rose-600 hover:bg-rose-50"
                  >
                    Cancel
                  </Button>
                </>
              )}

              {/* Reschedule */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRescheduleAppointment(row);
                  setRescheduleData({
                    start: format(new Date(row.startTime), "yyyy-MM-dd'T'HH:mm"),
                    end: format(new Date(row.endTime), "yyyy-MM-dd'T'HH:mm"),
                  });
                }}
                className="h-8 px-2"
                title="Reschedule slot"
              >
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
              </Button>

              {/* Edit notes */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNotesAppointment(row);
                  setNotesValue(row.notes || "");
                }}
                className="h-8 px-2"
                title="Edit booking notes"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
              </Button>

              {/* Timeline */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTimelineId(row.id)}
                className="h-8 px-2"
                title="View timeline history"
              >
                <History className="h-3.5 w-3.5 text-slate-500" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [selectedIds, isPending, filteredData]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Timeline events for the active modal
  const activeTimelineLogs = React.useMemo(() => {
    if (!activeTimelineId) return [];
    return auditLogs.filter((log) => log.entityId === activeTimelineId);
  }, [activeTimelineId, auditLogs]);

  return (
    <div className="space-y-4">
      {/* Alert states */}
      {successMsg && (
        <div className="border-emerald-250 flex items-center space-x-2 rounded-xl border bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 duration-150 animate-in fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 duration-150 animate-in fade-in">
          <XCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters and search headers */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Status queue select tabs */}
        <div className="text-slate-550 flex select-none rounded-xl border border-slate-200/80 bg-slate-50 p-1 text-[10px] font-extrabold">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
            )}
          >
            All Bookings ({appointments.length})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "PENDING"
                ? "animate-pulse bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("CONFIRMED")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "CONFIRMED"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "COMPLETED"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter("CANCELLED")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "CANCELLED"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Cancelled
          </button>
          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "REJECTED"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Rejected
          </button>
        </div>

        <div className="flex w-full items-center space-x-2 sm:w-auto">
          <div className="relative w-full max-w-sm sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients or treatments..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="focus:ring-blue-550 h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 text-xs font-semibold focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex select-none items-center space-x-1">
            <button
              onClick={() => exportToCSV("csv")}
              className="text-slate-655 inline-flex h-10 cursor-pointer items-center justify-center space-x-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold transition-all hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => exportToCSV("excel")}
              className="text-slate-655 inline-flex h-10 cursor-pointer items-center justify-center space-x-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold transition-all hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk operation banner */}
      {selectedIds.length > 0 && (
        <div className="flex select-none items-center justify-between rounded-2xl border bg-slate-50 p-3.5 text-xs font-bold text-slate-700 duration-150 animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckSquare className="h-4.5 w-4.5 text-blue-650" />
            <span>{selectedIds.length} bookings selected</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("CONFIRMED")}
              disabled={isPending}
              className="h-8 border-emerald-100 text-emerald-600 hover:bg-emerald-50"
            >
              Bulk Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("REJECTED")}
              disabled={isPending}
              className="h-8 border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Bulk Reject
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusChange("CANCELLED")}
              disabled={isPending}
              className="text-rose-650 h-8 border-rose-100 hover:bg-rose-50"
            >
              Bulk Cancel
            </Button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-455 h-8 rounded-lg px-2.5 text-xs font-bold hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* TanStack Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[10px] font-extrabold uppercase text-slate-400"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-xs font-medium text-slate-400"
                >
                  No bookings found matching current query.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-xs font-semibold text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="text-slate-550 flex select-none items-center justify-between border-t border-slate-100 p-4 text-xs font-semibold">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8"
              >
                Next
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Dialogue Modal */}
      {rescheduleAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex select-none items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Reschedule appointment
              </h3>
              <button
                onClick={() => setRescheduleAppointment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <p className="text-slate-550 text-xs font-semibold leading-relaxed">
                Select new scheduled slot times for{" "}
                <span className="font-bold text-slate-900">
                  {rescheduleAppointment.customer.firstName}{" "}
                  {rescheduleAppointment.customer.lastName}
                </span>
                .
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={rescheduleData.start}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, start: e.target.value })
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={rescheduleData.end}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, end: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex select-none justify-end space-x-2 border-t border-slate-100 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRescheduleAppointment(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Save reschedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Notes Dialogue Modal */}
      {notesAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex select-none items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Edit Booking Notes
              </h3>
              <button
                onClick={() => setNotesAppointment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleNotesSubmit} className="space-y-4">
              <textarea
                rows={3}
                placeholder="Add special instructions, patient clinical guidelines..."
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />

              <div className="flex select-none justify-end space-x-2 border-t border-slate-100 pt-2">
                <Button type="button" variant="outline" onClick={() => setNotesAppointment(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Save Notes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity Timeline Dialogue Modal */}
      {activeTimelineId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex select-none items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-800">
                <Activity className="h-4.5 w-4.5 text-blue-650" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Appointment Audit Trail
                </h3>
              </div>
              <button
                onClick={() => setActiveTimelineId(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[300px] space-y-4 overflow-y-auto pr-1">
              {activeTimelineLogs.length === 0 ? (
                <p className="select-none py-6 text-center text-xs font-medium italic text-slate-400">
                  No audit logs recorded for this appointment.
                </p>
              ) : (
                <div className="relative ml-3 space-y-4 border-l border-slate-200 pl-4">
                  {activeTimelineLogs.map((log) => (
                    <div key={log.id} className="relative text-xs leading-normal">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-white bg-blue-600" />

                      <div className="flex select-none items-baseline justify-between">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {format(new Date(log.createdAt), "MMM d, yyyy @ h:mm a")}
                        </span>
                      </div>

                      <p className="mt-1 text-[10px] font-semibold leading-normal text-slate-700">
                        Action:{" "}
                        <span className="text-blue-750 font-extrabold uppercase">{log.action}</span>{" "}
                        by {log.userEmail || "System"}
                      </p>

                      <div className="mt-0.5 space-y-0.5 text-[10px] font-medium text-slate-500">
                        {log.changes.status && (
                          <p>
                            Status changed from{" "}
                            <span className="font-bold">{log.changes.status.from}</span> to{" "}
                            <span className="font-bold">{log.changes.status.to}</span>
                          </p>
                        )}
                        {log.changes.reschedule && <p>Rescheduled appointment slot</p>}
                        {log.changes.notes && <p>Modified clinical notes description</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex select-none justify-end border-t border-slate-100 pt-2">
              <Button onClick={() => setActiveTimelineId(null)}>Close Trail</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
