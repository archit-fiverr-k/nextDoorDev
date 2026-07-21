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
  inviteStaffAction,
  toggleStaffStatusAction,
  deleteStaffAction,
  resetStaffPasswordAction,
} from "@/actions/staff";
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
  UserPlus,
  Search,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
  Mail,
  User,
  KeyRound,
  Trash2,
  AlertCircle,
  FileCheck2,
  Plus,
  CheckCircle,
  Clock,
} from "lucide-react";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

interface AuditLogRow {
  id: string;
  userEmail: string | null;
  action: string;
  changes: any;
  createdAt: Date;
}

interface StaffTableProps {
  pharmacyId: string;
  staff: StaffRow[];
  auditLogs: AuditLogRow[];
  role: "super_admin" | "platform_admin" | "pharmacy";
}

const columnHelper = createColumnHelper<StaffRow>();

export function StaffTable({ pharmacyId, staff, auditLogs, role }: StaffTableProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  // Modal States
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [activeResetStaff, setActiveResetStaff] = React.useState<StaffRow | null>(null);

  // Invitation Form State
  const [inviteForm, setInviteForm] = React.useState({
    name: "",
    email: "",
    password: "",
    roleType: "pharmacist", // manager, pharmacist, reception, custom
    permissions: {
      bookings: true,
      services: true,
      crm: true,
      staff: false,
    },
    customRoleTitle: "",
  });

  // Reset Password State
  const [resetPasswordValue, setResetPasswordValue] = React.useState("");
  const [resetError, setResetError] = React.useState("");

  // Error/Success alerts
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  // Auto-fill default permissions on role changes
  React.useEffect(() => {
    if (inviteForm.roleType === "manager") {
      setInviteForm((prev) => ({
        ...prev,
        permissions: { bookings: true, services: true, crm: true, staff: true },
      }));
    } else if (inviteForm.roleType === "pharmacist") {
      setInviteForm((prev) => ({
        ...prev,
        permissions: { bookings: true, services: true, crm: true, staff: false },
      }));
    } else if (inviteForm.roleType === "reception") {
      setInviteForm((prev) => ({
        ...prev,
        permissions: { bookings: true, services: false, crm: false, staff: false },
      }));
    }
  }, [inviteForm.roleType]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const roleName =
      inviteForm.roleType === "custom"
        ? inviteForm.customRoleTitle || "Custom Clinician"
        : inviteForm.roleType;

    startTransition(async () => {
      const res = await inviteStaffAction({
        pharmacyId,
        name: inviteForm.name,
        email: inviteForm.email,
        role: roleName,
        password: inviteForm.password,
      });

      if (res.success) {
        setSuccessMsg(`Welcome email invitation sent to ${inviteForm.email}.`);
        setIsInviteOpen(false);
        // Clear form
        setInviteForm({
          name: "",
          email: "",
          password: "",
          roleType: "pharmacist",
          permissions: { bookings: true, services: true, crm: true, staff: false },
          customRoleTitle: "",
        });
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to invite staff member");
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleStaffStatusAction(id, !currentStatus);
      if (res.success) {
        setSuccessMsg("Staff account status updated successfully.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to toggle status");
      }
    });
  };

  const handleDeleteStaff = (id: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this staff member account? This action cannot be undone."
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteStaffAction(id);
      if (res.success) {
        setSuccessMsg("Staff member deleted successfully.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to delete staff member");
      }
    });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResetStaff) return;
    setResetError("");

    startTransition(async () => {
      const res = await resetStaffPasswordAction(activeResetStaff.id, resetPasswordValue);
      if (res.success) {
        setSuccessMsg(`Password reset for ${activeResetStaff.name} completed.`);
        setActiveResetStaff(null);
        setResetPasswordValue("");
        router.refresh();
      } else {
        setResetError(res.error || "Failed to reset password");
      }
    });
  };

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Staff Member",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center space-x-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500">
                {info
                  .getValue()
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</p>
                <span className="text-[10px] font-medium text-slate-400">
                  Joined {new Date(row.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("email", {
        header: "Account Email",
        cell: (info) => <span className="font-medium text-slate-500">{info.getValue()}</span>,
      }),
      columnHelper.accessor("role", {
        header: "Roster Role",
        cell: (info) => (
          <span className="text-slate-655 rounded border bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold uppercase leading-none">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("isActive", {
        header: "Access Status",
        cell: (info) => {
          const active = info.getValue();
          return (
            <span
              className={cn(
                "select-none rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase leading-none",
                active
                  ? "border-emerald-250 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              )}
            >
              {active ? "Active" : "Disabled"}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Roster Controls",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center space-x-2">
              {/* Deactivate/Reactivate */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(row.id, row.isActive)}
                disabled={isPending}
                className={cn(
                  "h-8 px-2.5 text-xs font-semibold",
                  row.isActive
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-emerald-600 hover:bg-emerald-50"
                )}
                title={row.isActive ? "Disable staff member" : "Enable staff member"}
              >
                {row.isActive ? "Disable" : "Enable"}
              </Button>

              {/* Reset Password */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveResetStaff(row);
                  setResetPasswordValue("");
                  setResetError("");
                }}
                className="h-8 px-2"
                title="Reset password credential"
              >
                <KeyRound className="h-3.5 w-3.5 text-slate-500" />
              </Button>

              {/* Delete */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteStaff(row.id)}
                disabled={isPending}
                className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                title="Delete staff account"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [isPending]
  );

  const table = useReactTable({
    data: staff,
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
        pageSize: 5,
      },
    },
  });

  return (
    <div className="grid gap-8 text-slate-800 lg:grid-cols-5">
      {/* Table section (3 cols) */}
      <div className="space-y-4 lg:col-span-3">
        {/* Alerts */}
        {successMsg && (
          <div className="border-emerald-250 flex items-center space-x-2 rounded-xl border bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 duration-150 animate-in fade-in">
            <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="border-rose-250 flex items-center space-x-2 rounded-xl border bg-rose-50 p-3 text-xs font-semibold text-rose-800 duration-150 animate-in fade-in">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Search header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff members..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="focus:ring-blue-550 h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 text-xs font-semibold focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="hover:bg-slate-850 inline-flex h-10 cursor-pointer select-none items-center justify-center space-x-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-sm transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Staff Member</span>
          </button>
        </div>

        {/* TanStack Table Grid */}
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
                    No staff members registered in roster.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3.5 text-xs font-semibold text-slate-700"
                      >
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
      </div>

      {/* Audit Logs Sidebar (2 cols) */}
      <div className="space-y-4 lg:col-span-2">
        <h4 className="select-none text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Roster Access Audit Trail
        </h4>

        <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex select-none items-center space-x-2 border-b border-slate-50 pb-2.5">
            <FileCheck2 className="h-4.5 w-4.5 text-slate-455" />
            <span className="text-xs font-bold text-slate-900">Roster Events (Latest 10)</span>
          </div>

          <div className="max-h-[350px] space-y-3 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="py-6 text-center text-[10px] font-semibold italic text-slate-400">
                No staff events logged yet.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="border-b border-slate-50 pb-3 text-xs leading-normal last:border-b-0 last:pb-0"
                >
                  <div className="flex select-none items-baseline justify-between">
                    <span className="rounded border border-slate-100 bg-slate-50 px-1 py-0.5 text-[9px] font-extrabold uppercase text-slate-800">
                      {log.action}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-655 mt-1 text-[10px] font-medium">
                    Event triggered by {log.userEmail || "System"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-normal leading-normal text-slate-500">
                    {log.action === "CREATE" &&
                      `Invited ${log.changes.name} (${log.changes.email}) as ${log.changes.role}`}
                    {log.action === "UPDATE" &&
                      log.changes.isActive &&
                      `Status active set to ${log.changes.isActive.to}`}
                    {log.action === "UPDATE" &&
                      log.changes.passwordReset &&
                      `Password reset executed`}
                    {log.action === "DELETE" && `Removed staff member ${log.changes.deleted?.name}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Invite Staff Dialog Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex select-none items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Invite Roster Member</h3>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Full Staff Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                    placeholder="e.g. Dr. Alex Mercer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Invite Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                    placeholder="alex@northsidehealth.co.uk"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Invitation Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={inviteForm.password}
                    onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Select Roster Role *
                  </label>
                  <select
                    value={inviteForm.roleType}
                    onChange={(e) => setInviteForm({ ...inviteForm, roleType: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="pharmacist">Pharmacist</option>
                    <option value="reception">Reception</option>
                    <option value="manager">Manager</option>
                    <option value="custom">Custom Permissions...</option>
                  </select>
                </div>
              </div>

              {inviteForm.roleType === "custom" && (
                <div className="space-y-1 duration-150 animate-in slide-in-from-top-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Custom Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.customRoleTitle}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, customRoleTitle: e.target.value })
                    }
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                    placeholder="e.g. Locum Nurse"
                  />
                </div>
              )}

              {/* Permissions Preview Grid */}
              <div className="space-y-3 rounded-2xl border bg-slate-50 p-4">
                <span className="block select-none text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  Authorized Operations Preview
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                  <label
                    className={cn(
                      "flex select-none items-center space-x-2",
                      inviteForm.roleType !== "custom" && "pointer-events-none opacity-65"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.bookings}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          permissions: { ...inviteForm.permissions, bookings: e.target.checked },
                        })
                      }
                      className="border-slate-350 rounded text-blue-600"
                    />
                    <span className="text-slate-700">Read/Write Bookings</span>
                  </label>

                  <label
                    className={cn(
                      "flex select-none items-center space-x-2",
                      inviteForm.roleType !== "custom" && "pointer-events-none opacity-65"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.services}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          permissions: { ...inviteForm.permissions, services: e.target.checked },
                        })
                      }
                      className="border-slate-350 rounded text-blue-600"
                    />
                    <span className="text-slate-700">Manage Services</span>
                  </label>

                  <label
                    className={cn(
                      "flex select-none items-center space-x-2",
                      inviteForm.roleType !== "custom" && "pointer-events-none opacity-65"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.crm}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          permissions: { ...inviteForm.permissions, crm: e.target.checked },
                        })
                      }
                      className="border-slate-350 rounded text-blue-600"
                    />
                    <span className="text-slate-700">Access CRM notes</span>
                  </label>

                  <label
                    className={cn(
                      "flex select-none items-center space-x-2",
                      inviteForm.roleType !== "custom" && "pointer-events-none opacity-65"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={inviteForm.permissions.staff}
                      onChange={(e) =>
                        setInviteForm({
                          ...inviteForm,
                          permissions: { ...inviteForm.permissions, staff: e.target.checked },
                        })
                      }
                      className="border-slate-350 rounded text-blue-600"
                    />
                    <span className="text-slate-700">Edit Roster & Staff</span>
                  </label>
                </div>
              </div>

              <div className="flex select-none justify-end space-x-2 border-t border-slate-100 pt-3">
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Inviting..." : "Send Invitation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Dialog Modal */}
      {activeResetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
          <div className="w-full max-w-sm space-y-4 rounded-3xl border bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95">
            <div className="flex select-none items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Reset Staff Password
              </h3>
              <button
                onClick={() => setActiveResetStaff(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetError && (
              <p className="rounded-xl border border-rose-200/60 bg-rose-50 p-2.5 text-[10px] font-bold text-rose-600">
                {resetError}
              </p>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <p className="text-xs font-normal leading-normal text-slate-500">
                Resetting the password for{" "}
                <span className="font-bold text-slate-900">{activeResetStaff.name}</span>. Provide
                their new account credentials.
              </p>

              <div className="space-y-1">
                <label className="text-slate-444 block text-[10px] font-extrabold uppercase tracking-wider">
                  New Login Password
                </label>
                <input
                  type="password"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex select-none justify-end space-x-2 border-t border-slate-100 pt-2">
                <Button type="button" variant="outline" onClick={() => setActiveResetStaff(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Reset Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
