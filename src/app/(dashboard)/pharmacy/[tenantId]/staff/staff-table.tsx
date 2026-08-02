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
  ShieldCheck,
  X,
  KeyRound,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Activity,
  Users,
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

// Deterministic multi-tone avatar palette generator for staff members
function getStaffAvatarStyles(name: string) {
  const styles = [
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800",
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800",
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800",
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800",
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800",
    "bg-[#10B981]/10 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return styles[Math.abs(hash) % styles.length];
}

const columnHelper = createColumnHelper<StaffRow>();

export function StaffTable({ pharmacyId, staff, auditLogs, role }: StaffTableProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  // Modal States
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [activeResetStaff, setActiveResetStaff] = React.useState<StaffRow | null>(null);
  const [activeDeleteStaff, setActiveDeleteStaff] = React.useState<StaffRow | null>(null);

  // Form State
  const [inviteForm, setInviteForm] = React.useState({
    name: "",
    email: "",
    password: "",
    roleType: "pharmacist",
    customRoleTitle: "",
  });

  const [resetPasswordValue, setResetPasswordValue] = React.useState("");
  const [resetError, setResetError] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

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
        setInviteForm({
          name: "",
          email: "",
          password: "",
          roleType: "pharmacist",
          customRoleTitle: "",
        });
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to invite staff member.");
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    setErrorMsg("");
    setSuccessMsg("");
    startTransition(async () => {
      const res = await toggleStaffStatusAction(id, !currentStatus);
      if (res.success) {
        setSuccessMsg("Practitioner roster access updated successfully.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to update staff status.");
      }
    });
  };

  const confirmDeleteStaff = () => {
    if (!activeDeleteStaff) return;
    setErrorMsg("");
    setSuccessMsg("");
    startTransition(async () => {
      const res = await deleteStaffAction(activeDeleteStaff.id);
      if (res.success) {
        setSuccessMsg(`Staff practitioner ${activeDeleteStaff.name} removed from roster.`);
        setActiveDeleteStaff(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to remove staff practitioner.");
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
        setSuccessMsg(`Password credentials reset for ${activeResetStaff.name}.`);
        setActiveResetStaff(null);
        setResetPasswordValue("");
        router.refresh();
      } else {
        setResetError(res.error || "Failed to reset password.");
      }
    });
  };

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Staff Member",
        cell: (info) => {
          const row = info.row.original;
          const initials = info
            .getValue()
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const avatarStyle = getStaffAvatarStyles(row.name);

          return (
            <div className="flex items-center space-x-3">
              <div
                className={cn(
                  "shadow-2xs flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black",
                  avatarStyle
                )}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-extrabold text-slate-900 dark:text-white">
                  {info.getValue()}
                </p>
                <span className="block text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                  Registered{" "}
                  {new Date(row.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("email", {
        header: "Account Email",
        cell: (info) => (
          <span className="font-medium text-slate-600 dark:text-zinc-300">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("role", {
        header: "Roster Role",
        cell: (info) => {
          const roleVal = info.getValue();
          return (
            <span className="inline-flex items-center rounded-md border-l-2 border-slate-400 bg-slate-100/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200">
              {roleVal}
            </span>
          );
        },
      }),
      columnHelper.accessor("isActive", {
        header: "Access Status",
        cell: (info) => {
          const active = info.getValue();
          return (
            <span
              className={cn(
                "inline-flex items-center space-x-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                active
                  ? "border-emerald-250 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "border-slate-200 bg-slate-100 text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  active ? "animate-pulse bg-[#10B981]" : "bg-slate-400 dark:bg-zinc-600"
                )}
              />
              <span>{active ? "Active" : "Disabled"}</span>
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
              <button
                type="button"
                onClick={() => handleToggleStatus(row.id, row.isActive)}
                disabled={isPending}
                aria-label={row.isActive ? "Disable staff member" : "Enable staff member"}
                title={
                  row.isActive ? "Disable practitioner access" : "Re-enable practitioner access"
                }
                className={cn(
                  "focus-visible:outline-hidden inline-flex min-h-[32px] items-center space-x-1 rounded-lg border px-2.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-[#10B981]",
                  row.isActive
                    ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300"
                )}
              >
                <span>{row.isActive ? "Disable" : "Enable"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveResetStaff(row);
                  setResetPasswordValue("");
                  setResetError("");
                }}
                aria-label="Reset password credential"
                title="Reset practitioner login credentials"
                className="shadow-2xs focus-visible:outline-hidden flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <KeyRound className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveDeleteStaff(row)}
                disabled={isPending}
                aria-label="Remove staff account"
                title="Permanently remove staff member"
                className="shadow-2xs focus-visible:outline-hidden flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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
        pageSize: 6,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Search Bar & Primary Action CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search practitioner by name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex min-h-[40px] items-center justify-center space-x-2 rounded-xl bg-slate-900 px-5 text-xs font-black text-white shadow-md hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <UserPlus className="h-4 w-4 text-[#10B981]" />
          <span>+ Invite Staff Member</span>
        </button>
      </div>

      {/* Feedback Banners */}
      {successMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle className="h-4 w-4 shrink-0 text-[#10B981]" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Full Width Layout: Staff Roster Table Top, Audit Trail Stream Bottom */}
      <div className="space-y-8">
        {/* Main Table Section */}
        <div className="w-full space-y-4">
          {/* DESKTOP TABLE VIEW (≥ 600px) */}
          <div className="shadow-xs hidden w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:block">
            <Table className="w-full">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b border-slate-200 dark:border-zinc-800"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500"
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
                {isPending ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={5} className="py-4">
                        <div className="h-4 w-full rounded-md bg-slate-100 dark:bg-zinc-800" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-12 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#10B981] dark:bg-emerald-950/60">
                          <Users className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            No Staff Practitioners Found
                          </h4>
                          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                            Invite clinicians or receptionists to manage clinical appointments and
                            roster shifts.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsInviteOpen(true)}
                          className="shadow-xs inline-flex items-center space-x-1.5 rounded-xl bg-[#10B981] px-4 py-2 text-xs font-black text-white hover:bg-emerald-600"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>+ Invite Staff Member</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="dark:hover:bg-zinc-850 border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-zinc-800/80"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3.5 text-xs font-semibold">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {table.getPageCount() > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs font-bold text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
                <span>
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="h-8 text-xs font-bold"
                  >
                    <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="h-8 text-xs font-bold"
                  >
                    Next
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* MOBILE CARD LIST (< 600px) */}
          <div className="space-y-3 sm:hidden">
            {staff.length === 0 ? (
              <div className="shadow-xs rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <Users className="mx-auto h-8 w-8 text-[#10B981]" />
                <p className="mt-2 text-xs font-bold text-slate-900 dark:text-white">
                  No staff practitioners registered.
                </p>
              </div>
            ) : (
              staff.map((s) => {
                const initials = s.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const avatarStyle = getStaffAvatarStyles(s.name);
                return (
                  <div
                    key={s.id}
                    className="shadow-xs space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
                      <div className="flex items-center space-x-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-black",
                            avatarStyle
                          )}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{s.name}</p>
                          <p className="text-[11px] text-slate-400">{s.email}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[9px] font-black uppercase",
                          s.isActive
                            ? "border-emerald-250 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        )}
                      >
                        {s.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-md border-l-2 border-slate-400 bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {s.role}
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s.id, s.isActive)}
                          className="min-h-[44px] px-3 text-xs font-bold text-slate-700 dark:text-zinc-300"
                        >
                          {s.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDeleteStaff(s)}
                          className="min-h-[44px] px-2 text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AUDIT TRAIL SECTION (FULL WIDTH BELOW TABLE) */}
        <div className="w-full space-y-4">
          <div className="shadow-xs space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4.5 w-4.5 text-[#10B981]" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Access Audit Trail
                </h3>
              </div>
              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#10B981] dark:bg-emerald-950">
                Latest 10 Events
              </span>
            </div>

            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1 text-xs">
              {auditLogs.length === 0 ? (
                <div className="space-y-2 py-10 text-center">
                  <Activity className="mx-auto h-6 w-6 text-slate-300 dark:text-zinc-600" />
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                    No access changes logged yet.
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Staff roster access updates and credential resets will appear here for
                    compliance auditing.
                  </p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border-b border-slate-100 pb-3 text-xs leading-normal last:border-b-0 last:pb-0 dark:border-zinc-800/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-black uppercase text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {log.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] font-extrabold text-slate-800 dark:text-zinc-200">
                      {log.userEmail || "System Admin"}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
                      {log.action === "CREATE" &&
                        `Invited ${log.changes?.name || "practitioner"} (${log.changes?.email || ""}) as ${log.changes?.role || "staff"}`}
                      {log.action === "UPDATE" &&
                        log.changes?.isActive &&
                        `Access status set to ${log.changes.isActive.to ? "Active" : "Disabled"}`}
                      {log.action === "UPDATE" &&
                        log.changes?.passwordReset &&
                        `Credentials reset for staff account`}
                      {log.action === "DELETE" &&
                        `Removed practitioner ${log.changes?.deleted?.name || ""}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: INVITE STAFF PRACTITIONER MODAL */}
      {isInviteOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 duration-200 animate-in fade-in">
          <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-[#10B981]" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Invite Staff Practitioner
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="e.g. Dr. Sarah Jenkins"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="sarah@pharmacy.co.uk"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Roster Role
                </label>
                <select
                  value={inviteForm.roleType}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleType: e.target.value })}
                  className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="pharmacist">Pharmacist Practitioner</option>
                  <option value="manager">Branch Manager</option>
                  <option value="reception">Reception / Counter Staff</option>
                  <option value="custom">Custom Title...</option>
                </select>
              </div>

              {inviteForm.roleType === "custom" && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Custom Role Title
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteForm.customRoleTitle}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, customRoleTitle: e.target.value })
                    }
                    className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="e.g. Travel Health Lead"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Temporary Password (Optional)
                </label>
                <input
                  type="text"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                  className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Leave blank for auto-generated password"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-[#10B981] py-3 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-emerald-600 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Send Practitioner Invitation →"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD CREDENTIAL MODAL */}
      {activeResetStaff && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 duration-200 animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Reset Practitioner Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveResetStaff(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
              Updating credentials for{" "}
              <strong className="text-slate-900 dark:text-white">{activeResetStaff.name}</strong> (
              {activeResetStaff.email}).
            </p>

            {resetError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  New Temporary Password
                </label>
                <input
                  type="text"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="focus:outline-hidden h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-[#10B981] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="e.g. ResetPass123!"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveResetStaff(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE STAFF MEMBER MODAL */}
      {activeDeleteStaff && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 duration-200 animate-in fade-in">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-150 animate-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Remove Staff Practitioner?
              </h3>
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 dark:text-white">{activeDeleteStaff.name}</strong>{" "}
              from your pharmacy roster? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDeleteStaff(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmDeleteStaff}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete Practitioner Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
