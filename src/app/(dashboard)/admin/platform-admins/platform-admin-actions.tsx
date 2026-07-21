"use client";

import React, { useState, useTransition } from "react";
import { togglePlatformAdminStatusAction, updatePlatformAdminAction } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { ShieldOff, ShieldCheck, Edit3 } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AdminData {
  id: string;
  name: string | null;
  email: string;
  isDeveloper: boolean;
  isActive: boolean;
  canManagePharmacies: boolean;
  canManageBookings: boolean;
  canViewAuditLogs: boolean;
  canViewCommsLog: boolean;
  canManageIntegrations: boolean;
  canManageSettings: boolean;
  canManageAdmins: boolean;
}

interface PlatformAdminActionsProps {
  admin: AdminData;
}

export function PlatformAdminActions({ admin }: PlatformAdminActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  // Edit Form Fields States
  const [name, setName] = useState(admin.name || "");
  const [email, setEmail] = useState(admin.email);
  const [isDeveloper, setIsDeveloper] = useState(admin.isDeveloper);
  const [canManagePharmacies, setCanManagePharmacies] = useState(admin.canManagePharmacies);
  const [canManageBookings, setCanManageBookings] = useState(admin.canManageBookings);
  const [canViewAuditLogs, setCanViewAuditLogs] = useState(admin.canViewAuditLogs);
  const [canViewCommsLog, setCanViewCommsLog] = useState(admin.canViewCommsLog);
  const [canManageIntegrations, setCanManageIntegrations] = useState(admin.canManageIntegrations);
  const [canManageSettings, setCanManageSettings] = useState(admin.canManageSettings);
  const [canManageAdmins, setCanManageAdmins] = useState(admin.canManageAdmins);

  const handleToggle = () => {
    const newStatus = !admin.isActive;
    const confirmMsg = newStatus
      ? `Reactivate "${admin.name || admin.email}"? They will regain platform access.`
      : `Suspend "${admin.name || admin.email}"? They will lose platform access immediately.`;

    if (!confirm(confirmMsg)) return;

    setError("");
    startTransition(async () => {
      const res = await togglePlatformAdminStatusAction(admin.id, newStatus);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Failed to update status");
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email) {
      setError("Name and Email are required.");
      return;
    }

    startTransition(async () => {
      const res = await updatePlatformAdminAction({
        id: admin.id,
        name,
        email,
        isDeveloper,
        canManagePharmacies,
        canManageBookings,
        canViewAuditLogs,
        canViewCommsLog,
        canManageIntegrations,
        canManageSettings,
        canManageAdmins,
      });

      if (res.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update account permissions");
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Edit Trigger */}
      <button
        onClick={() => setIsEditing(true)}
        disabled={isPending}
        className="dark:text-slate-350 inline-flex cursor-pointer items-center space-x-1.5 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
        title="Edit Account Permissions"
      >
        <Edit3 className="h-3 w-3" />
        <span>Edit Access</span>
      </button>

      {/* Suspend / Reactivate Trigger */}
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex cursor-pointer items-center space-x-1.5 rounded border px-2 py-1 text-[10px] font-bold transition-all disabled:opacity-50 ${
          admin.isActive
            ? "border-slate-200 bg-slate-50 text-rose-600 hover:bg-rose-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-rose-400"
            : "border-slate-200 bg-slate-50 text-emerald-600 hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400"
        }`}
      >
        {admin.isActive ? (
          <>
            <ShieldOff className="h-3 w-3" />
            <span>Suspend</span>
          </>
        ) : (
          <>
            <ShieldCheck className="h-3 w-3" />
            <span>Reactivate</span>
          </>
        )}
      </button>

      {error && <p className="text-[9px] font-semibold text-rose-600">{error}</p>}

      {/* Edit Dialog Modal */}
      {isEditing && (
        <Dialog isOpen={isEditing} onClose={() => setIsEditing(false)}>
          <DialogHeader>
            <DialogTitle>Edit Account Access & Permissions</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 pt-2 text-left text-xs">
            {error && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-zinc-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 p-2 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus:bg-zinc-950"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 p-2 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus:bg-zinc-950"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-zinc-300">
                Account Role
              </label>
              <select
                value={isDeveloper ? "DEVELOPER" : "PLATFORM_ADMIN"}
                onChange={(e) => setIsDeveloper(e.target.value === "DEVELOPER")}
                className="w-full rounded border border-slate-200 bg-slate-50 p-2 font-bold focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus:bg-zinc-950"
              >
                <option value="PLATFORM_ADMIN">Platform Admin (Operations)</option>
                <option value="DEVELOPER">Developer (Integrations & Logs)</option>
              </select>
            </div>

            {/* Checkbox Permission Toggles */}
            <div className="border-slate-150 space-y-2 border-t pt-3 dark:border-zinc-800">
              <label className="mb-1.5 block font-bold text-slate-800 dark:text-zinc-200">
                Account Capabilities Checklist
              </label>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="edit_canManagePharmacies"
                  checked={canManagePharmacies}
                  onChange={(e) => setCanManagePharmacies(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="edit_canManagePharmacies"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Pharmacy Branches (create, verify, reject, edit)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="edit_canManageBookings"
                  checked={canManageBookings}
                  onChange={(e) => setCanManageBookings(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="edit_canManageBookings"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Bookings (view and cancel system appointments)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="edit_canViewAuditLogs"
                  checked={canViewAuditLogs}
                  onChange={(e) => setCanViewAuditLogs(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="edit_canViewAuditLogs"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  View Security Audit Logs (actions tracking)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="edit_canViewCommsLog"
                  checked={canViewCommsLog}
                  onChange={(e) => setCanViewCommsLog(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="edit_canViewCommsLog"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  View Communications Logs (emails/sms records)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="edit_canManageIntegrations"
                  checked={canManageIntegrations}
                  onChange={(e) => setCanManageIntegrations(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="edit_canManageIntegrations"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Platform Integrations (Stripe, Twilio, Google credentials)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="edit_canManageSettings"
                  checked={canManageSettings}
                  onChange={(e) => setCanManageSettings(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="edit_canManageSettings"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Global Settings (toggle maintenance, announcement banner)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="edit_canManageAdmins"
                  checked={canManageAdmins}
                  onChange={(e) => setCanManageAdmins(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="edit_canManageAdmins"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Administrators & Developers
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-655 cursor-pointer rounded border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="cursor-pointer rounded bg-slate-900 px-4 py-2 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
