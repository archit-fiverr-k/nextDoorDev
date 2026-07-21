"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  updatePharmacyStatusAction,
  rejectPharmacyAction,
  updatePharmacySlugAction,
} from "@/actions/admin";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Copy,
  Check,
  Search,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Plus,
  Eye,
  QrCode,
  ShieldCheck,
  Building,
  AlertCircle,
  FileCheck2,
  X,
  RefreshCw,
  ExternalLink,
  Ban,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";

interface PharmacyRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED";
  createdAt: Date;
  auditLogs?: Array<{
    id: string;
    changes: any; // Contains documentName, documentRef, subscriptionPlan
  }>;
}

interface PharmacyTableProps {
  data: PharmacyRow[];
  role: "super_admin" | "platform_admin" | "pharmacy";
}

const columnHelper = createColumnHelper<PharmacyRow>();

export function PharmacyTable({ data, role }: PharmacyTableProps) {
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | "PENDING" | "APPROVED" | "SUSPENDED"
  >("all");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Dialog State
  const [activeDocPharmacy, setActiveDocPharmacy] = React.useState<PharmacyRow | null>(null);
  const [activeQrPharmacy, setActiveQrPharmacy] = React.useState<PharmacyRow | null>(null);
  const [editingSlugPharmacy, setEditingSlugPharmacy] = React.useState<PharmacyRow | null>(null);
  const [newSlugValue, setNewSlugValue] = React.useState("");
  const [slugError, setSlugError] = React.useState("");

  const handleCopyLink = (slug: string, id: string) => {
    // Determine target URL matching subdomain schema
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    let url = `${origin}/book/${slug}`;
    if (origin.includes("localhost")) {
      url = origin.replace("localhost", `${slug}.localhost`);
    } else {
      url = `https://${slug}.nextdoorclinic.co.uk/book`;
    }
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const handleStatusUpdate = (id: string, status: "APPROVED" | "SUSPENDED") => {
    if (
      status === "SUSPENDED" &&
      !confirm("Are you sure you want to suspend this clinic? This blocks their booking flow.")
    )
      return;
    startTransition(async () => {
      const res = await updatePharmacyStatusAction(id, status);
      if (!res.success) {
        alert(res.error || "Status update failed");
      }
    });
  };

  const handleReject = (id: string) => {
    if (
      !confirm(
        "Are you sure you want to reject and delete this clinic registration request? This action cannot be undone."
      )
    )
      return;
    startTransition(async () => {
      const res = await rejectPharmacyAction(id);
      if (!res.success) {
        alert(res.error || "Rejection failed");
      }
    });
  };

  const handleSlugUpdate = () => {
    if (!editingSlugPharmacy || !newSlugValue) return;
    setSlugError("");
    startTransition(async () => {
      const res = await updatePharmacySlugAction(editingSlugPharmacy.id, newSlugValue);
      if (res.success) {
        setEditingSlugPharmacy(null);
      } else {
        setSlugError(res.error || "Slug update failed");
      }
    });
  };

  // Filter the rows before passing to TanStack Table
  const filteredData = React.useMemo(() => {
    return data.filter((row) => {
      if (statusFilter === "all") return true;
      return row.status === statusFilter;
    });
  }, [data, statusFilter]);

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Clinic / Provider Name",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</div>
              <div className="text-slate-455 text-[10px]">Phone: {row.phone}</div>
            </div>
          );
        },
      }),
      columnHelper.accessor("slug", {
        header: "Slug / Subdomain",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-655 rounded border bg-slate-50 px-2 py-0.5 font-mono text-xs dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-400">
                {info.getValue()}
              </span>
              {role === "super_admin" && (
                <button
                  onClick={() => {
                    setEditingSlugPharmacy(row);
                    setNewSlugValue(row.slug);
                    setSlugError("");
                  }}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800"
                  title="Generate or edit slug"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("email", {
        header: "Account Email",
        cell: (info) => (
          <span className="text-xs font-medium text-slate-500">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          return (
            <span
              className={cn(
                "select-none rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                status === "APPROVED" &&
                  "border-emerald-250 dark:text-emerald-450 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20",
                status === "PENDING" &&
                  "border-amber-250 dark:text-amber-450 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20",
                status === "SUSPENDED" &&
                  "border-rose-250 dark:text-rose-450 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20"
              )}
            >
              {status === "APPROVED" ? "Active" : status}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Approval Controls",
        cell: (info) => {
          const row = info.row.original;
          const hasDocs = Boolean(row.auditLogs && row.auditLogs.length > 0);
          return (
            <div className="flex items-center space-x-2">
              {/* View Documents Button */}
              {hasDocs && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveDocPharmacy(row)}
                  className="dark:border-zinc-850 h-8 px-2"
                  title="View Verification Documents"
                >
                  <Eye className="text-slate-550 h-3.5 w-3.5" />
                </Button>
              )}

              {/* QR Code Action */}
              {row.status === "APPROVED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveQrPharmacy(row)}
                  className="dark:border-zinc-850 h-8 px-2"
                  title="Generate booking QR Code"
                >
                  <QrCode className="text-slate-550 h-3.5 w-3.5" />
                </Button>
              )}

              {/* Copy URL */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(row.slug, row.id)}
                className="dark:border-zinc-850 h-8 px-2"
                title="Copy booking URL"
              >
                {copiedId === row.id ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                )}
              </Button>

              {role === "super_admin" && (
                <>
                  {row.status === "PENDING" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(row.id, "APPROVED")}
                        disabled={isPending}
                        className="dark:border-zinc-850 h-8 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-950/10"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(row.id)}
                        disabled={isPending}
                        className="dark:border-zinc-850 h-8 text-rose-600 hover:bg-rose-50 dark:text-rose-500 dark:hover:bg-rose-950/10"
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {row.status === "APPROVED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(row.id, "SUSPENDED")}
                      disabled={isPending}
                      className="dark:text-rose-550 dark:border-zinc-850 h-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/10"
                    >
                      <Ban className="mr-1 h-3.5 w-3.5" />
                      Suspend
                    </Button>
                  )}

                  {row.status === "SUSPENDED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(row.id, "APPROVED")}
                      disabled={isPending}
                      className="dark:border-zinc-850 h-8 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-950/10"
                    >
                      <CheckSquare className="mr-1 h-3.5 w-3.5" />
                      Activate
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        },
      }),
    ],
    [copiedId, isPending, role]
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

  return (
    <div className="space-y-4">
      {/* Search Header and Tab Filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Status filters */}
        <div className="text-slate-550 flex select-none rounded-xl border border-slate-200/80 bg-slate-50 p-1 text-xs font-bold dark:bg-zinc-900">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
            )}
          >
            All Providers
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={cn(
              "flex items-center space-x-1.5 rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "PENDING"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            <span>Pending Queue</span>
            {data.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            )}
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "APPROVED"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("SUSPENDED")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-all",
              statusFilter === "SUSPENDED"
                ? "bg-white text-slate-900 shadow-sm"
                : "hover:text-slate-900"
            )}
          >
            Suspended
          </button>
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search provider details..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="focus:ring-blue-550 h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 text-xs font-semibold focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
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
                  className="py-10 text-center text-xs font-medium text-slate-400"
                >
                  No clinic registration requests found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 text-xs font-semibold text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination bar */}
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
                className="dark:border-zinc-850 h-8"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="dark:border-zinc-850 h-8"
              >
                Next
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 1. View Verification Documents Dialog */}
      {activeDocPharmacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="w-full max-w-md space-y-5 rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="h-5 w-5 text-blue-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Verification Credentials
                </h4>
              </div>
              <button
                onClick={() => setActiveDocPharmacy(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const audit = activeDocPharmacy.auditLogs?.[0];
              const changes = audit?.changes;
              if (!changes) {
                return (
                  <p className="text-xs font-medium text-slate-500">
                    No credentials documents found for this provider draft.
                  </p>
                );
              }
              return (
                <div className="text-slate-655 space-y-4 text-xs font-semibold leading-normal">
                  <div className="space-y-1">
                    <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                      Pharmacy Name
                    </span>
                    <p className="font-bold text-slate-900">{activeDocPharmacy.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                        NHS License / Ref Code
                      </span>
                      <p className="font-mono font-bold text-slate-900">{changes.documentRef}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                        Subscription plan
                      </span>
                      <p className="font-bold capitalize text-slate-900">
                        {changes.subscriptionPlan} Plan
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="block text-[9px] font-extrabold uppercase text-slate-400">
                      Uploaded File Attachment (R2 Storage)
                    </span>
                    <div className="flex select-none items-center space-x-3 rounded-xl border bg-slate-50 p-3">
                      <Eye className="h-6 w-6 text-blue-600" />
                      <div className="min-w-0 leading-none">
                        <p className="max-w-[200px] truncate font-bold text-slate-900">
                          {changes.documentName}
                        </p>
                        <span className="mt-1 block text-[9px] font-bold uppercase text-slate-400">
                          CF R2 Secure Path
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end border-t border-slate-100 pt-2">
              <Button onClick={() => setActiveDocPharmacy(null)} size="sm">
                Close View
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Generate Booking QR Code Dialog */}
      {activeQrPharmacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="w-full max-w-sm space-y-5 rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-blue-600" />
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Generate Booking QR Code
                </h4>
              </div>
              <button
                onClick={() => setActiveQrPharmacy(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-center">
              <p className="mx-auto max-w-xs text-xs font-normal leading-normal text-slate-500">
                Patients can scan this QR code to access the whitelabel booking wizard for{" "}
                <span className="font-bold text-slate-900">{activeQrPharmacy.name}</span>.
              </p>

              {/* Dynamic Simulated SVG QR Code representation */}
              <div className="relative mx-auto flex h-40 w-40 select-none items-center justify-center rounded-2xl border bg-slate-50 p-3 shadow-sm">
                <svg
                  viewBox="0 0 100 100"
                  className="h-full w-full fill-none stroke-current stroke-[2] text-slate-900"
                >
                  <path d="M5 5h30v30H5zM10 10h20v20H10zM5 65h30v30H5zM10 70h20v20H10zM65 5h30v30H65zM70 10h20v20H70z" />
                  <path d="M45 5h10v20H45zM45 45h35v10H45zM45 85h25v10H45zM85 45h10v35H85z" />
                  <path d="M55 55h5v5h-5zM75 75h5v5h-5zM35 45h5v5h-5zM65 65h5v5h-5z" />
                  <circle cx="50" cy="50" r="4" fill="currentColor" />
                </svg>
              </div>

              <div className="text-slate-550 select-all break-all rounded-xl border bg-slate-50 p-3 text-left font-mono text-[10px] font-semibold leading-normal">
                {typeof window !== "undefined"
                  ? `${window.location.origin.replace("localhost", `${activeQrPharmacy.slug}.localhost`)}/book`
                  : `https://${activeQrPharmacy.slug}.nextdoorclinic.co.uk/book`}
              </div>
            </div>

            <div className="flex justify-end space-x-2 border-t border-slate-100 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyLink(activeQrPharmacy.slug, activeQrPharmacy.id)}
              >
                Copy Link
              </Button>
              <Button onClick={() => setActiveQrPharmacy(null)} size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Inline Generate/Edit Slug Dialog */}
      {editingSlugPharmacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Edit Subdomain Slug
              </h4>
              <button
                onClick={() => setEditingSlugPharmacy(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {slugError && (
              <p className="rounded-xl border border-rose-200/60 bg-rose-50 p-2.5 text-[10px] font-bold text-rose-600">
                {slugError}
              </p>
            )}

            <div className="space-y-4 leading-normal">
              <p className="text-xs font-normal text-slate-500">
                Modifying the slug updates the subdomain used by this pharmacy for patient bookings.
              </p>

              <div className="space-y-1 text-xs font-semibold">
                <label className="text-slate-455 block text-[10px] font-extrabold uppercase">
                  Subdomain URL Slug
                </label>
                <input
                  type="text"
                  value={newSlugValue}
                  onChange={(e) =>
                    setNewSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  placeholder="e.g. northside-health"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 border-t border-slate-100 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingSlugPharmacy(null)}>
                Cancel
              </Button>
              <Button onClick={handleSlugUpdate} disabled={isPending} size="sm">
                Save Slug
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
