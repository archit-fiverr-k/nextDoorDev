"use client";

import React, { useState, useTransition } from "react";
import {
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { updatePatientPasswordAction, deletePatientAccountAction } from "@/actions/patient";
import { logoutAction } from "@/actions/auth";

export default function PatientSettingsPage() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwPending, startPwTransition] = useTransition();
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters long.");
      return;
    }

    startPwTransition(async () => {
      const res = await updatePatientPasswordAction(passwordForm);
      if (!res.success) {
        setPwError(res.error || "Failed to change password.");
      } else {
        setPwSuccess(true);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPwSuccess(false), 4000);
      }
    });
  };

  const handleDeleteAccount = () => {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const res = await deletePatientAccountAction();
      if (res.success) {
        await logoutAction();
      } else {
        setDeleteError(res.error || "Failed to delete account. Please try again.");
      }
    });
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account Settings</h1>
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
          Manage your account security and authentication options.
        </p>
      </div>

      {/* 1. CHANGE PASSWORD CARD */}
      <div className="shadow-xs dark:border-zinc-850 space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900 sm:p-8">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Change Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Update your account login password.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            {
              label: "Current Password",
              field: "currentPassword" as const,
              placeholder: "Enter current password",
            },
            {
              label: "New Password",
              field: "newPassword" as const,
              placeholder: "Min 8 characters",
            },
            {
              label: "Confirm New Password",
              field: "confirmPassword" as const,
              placeholder: "Re-enter new password",
            },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="mb-1.5 block flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-zinc-300">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> {label}
              </label>
              <input
                type="password"
                required
                className={inputCls}
                placeholder={placeholder}
                value={passwordForm[field]}
                onChange={(e) => setPasswordForm((f) => ({ ...f, [field]: e.target.value }))}
              />
            </div>
          ))}

          {pwError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" /> {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Password updated successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={pwPending}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-black text-white transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {pwPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pwPending ? "Updating Password..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* 2. DANGER ZONE - DELETE ACCOUNT CARD */}
      <div className="shadow-xs space-y-4 rounded-3xl border border-rose-200 bg-rose-50/40 p-6 dark:border-rose-900/40 dark:bg-rose-950/10 sm:p-8">
        <div className="flex items-center gap-2.5 border-b border-rose-200/60 pb-4 dark:border-rose-900/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 font-bold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-rose-900 dark:text-rose-300">
              Delete Account
            </h2>
            <p className="text-xs text-rose-700/80 dark:text-rose-400">
              Permanently remove your account and data.
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
          Deleting your account will remove your access to the patient portal. Your past
          appointments and medical history will be anonymized in accordance with UK healthcare
          regulations.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-500 active:scale-95"
        >
          Delete My Account
        </button>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Confirm Account Deletion
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {deleteError}
              </p>
            )}

            <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
              Are you sure you want to delete your account? You will be immediately logged out.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletePending}
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletePending}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-rose-500"
              >
                {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deletePending ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
