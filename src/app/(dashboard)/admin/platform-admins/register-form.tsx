"use client";

import React, { useState, useTransition } from "react";
import { createPlatformAdminAction } from "@/actions/admin";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

export function RegisterPlatformAdminForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDeveloper, setIsDeveloper] = useState(false);

  // Granular access checklist states
  const [canManagePharmacies, setCanManagePharmacies] = useState(true);
  const [canManageBookings, setCanManageBookings] = useState(false);
  const [canViewAuditLogs, setCanViewAuditLogs] = useState(false);
  const [canViewCommsLog, setCanViewCommsLog] = useState(false);
  const [canManageIntegrations, setCanManageIntegrations] = useState(false);
  const [canManageSettings, setCanManageSettings] = useState(false);
  const [canManageAdmins, setCanManageAdmins] = useState(false);

  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (role: string) => {
    const isDev = role === "DEVELOPER";
    setIsDeveloper(isDev);
    if (isDev) {
      // Developers default to integrations and logs access
      setCanManagePharmacies(false);
      setCanManageBookings(false);
      setCanViewAuditLogs(true);
      setCanViewCommsLog(true);
      setCanManageIntegrations(true);
      setCanManageSettings(false);
      setCanManageAdmins(false);
    } else {
      // Standard platform admins default to pharmacy management
      setCanManagePharmacies(true);
      setCanManageBookings(false);
      setCanViewAuditLogs(false);
      setCanViewCommsLog(false);
      setCanManageIntegrations(false);
      setCanManageSettings(false);
      setCanManageAdmins(false);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    startTransition(async () => {
      const res = await createPlatformAdminAction({
        name,
        email,
        password,
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
        setName("");
        setEmail("");
        setPassword("");
        setIsDeveloper(false);
        setCanManagePharmacies(true);
        setCanManageBookings(false);
        setCanViewAuditLogs(false);
        setCanViewCommsLog(false);
        setCanManageIntegrations(false);
        setCanManageSettings(false);
        setCanManageAdmins(false);
        setIsOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to create account");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex cursor-pointer items-center space-x-2 rounded bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-slate-800"
      >
        <UserPlus className="h-4 w-4" />
        <span>Add Admin / Developer</span>
      </button>

      {isOpen && (
        <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <DialogHeader>
            <DialogTitle>Create Workspace Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRegister} className="space-y-4 pt-2 text-xs">
            {error && (
              <div className="rounded border border-rose-200 bg-rose-50 p-3 font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-zinc-300">Name</label>
              <input
                type="text"
                placeholder="Full Name"
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
                placeholder="admin@nextdoorclinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 p-2 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus:bg-zinc-950"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700 dark:text-zinc-300">
                Temporary Password
              </label>
              <input
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                onChange={(e) => handleRoleChange(e.target.value)}
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
                  id="canManagePharmacies"
                  checked={canManagePharmacies}
                  onChange={(e) => setCanManagePharmacies(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="canManagePharmacies"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Pharmacy Branches (create, verify, reject, edit)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="canManageBookings"
                  checked={canManageBookings}
                  onChange={(e) => setCanManageBookings(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="canManageBookings"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Bookings (view and cancel system appointments)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="canViewAuditLogs"
                  checked={canViewAuditLogs}
                  onChange={(e) => setCanViewAuditLogs(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="canViewAuditLogs"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  View Security Audit Logs (actions tracking)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="canViewCommsLog"
                  checked={canViewCommsLog}
                  onChange={(e) => setCanViewCommsLog(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="canViewCommsLog"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  View Communications Logs (emails/sms records)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="canManageIntegrations"
                  checked={canManageIntegrations}
                  onChange={(e) => setCanManageIntegrations(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="canManageIntegrations"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Platform Integrations (Stripe, Twilio, Google credentials)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="canManageSettings"
                  checked={canManageSettings}
                  onChange={(e) => setCanManageSettings(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="canManageSettings"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Global Settings (toggle maintenance, announcement banner)
                </label>
              </div>

              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="canManageAdmins"
                  checked={canManageAdmins}
                  onChange={(e) => setCanManageAdmins(e.target.checked)}
                  className="border-slate-350 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <label
                  htmlFor="canManageAdmins"
                  className="cursor-pointer font-semibold text-slate-700 dark:text-zinc-300"
                >
                  Manage Administrators & Developers
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-650 cursor-pointer rounded border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="cursor-pointer rounded bg-slate-900 px-4 py-2 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
export default RegisterPlatformAdminForm;
