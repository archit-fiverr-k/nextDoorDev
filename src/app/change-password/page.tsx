"use client";

import { useState, useTransition } from "react";
import { changeFirstPasswordAction } from "@/actions/auth";
import { Activity, Lock, CheckCircle, Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    startTransition(async () => {
      const res = await changeFirstPasswordAction(currentPassword, newPassword);
      if (!res.success) {
        setError(res.error || "Failed to update password");
      } else {
        setSuccess(true);
        // Refresh session or redirect home
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Security Update Required
          </h2>
          <p className="text-center text-sm text-slate-500">
            For security, please change your temporary password before accessing the system.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
            <CheckCircle className="h-8 w-8 animate-bounce text-emerald-600" />
            <h3 className="text-lg font-bold">Password Changed!</h3>
            <p className="text-xs leading-normal text-emerald-600">
              Your security configuration has been updated. Redirecting you to the portal home...
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Current Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  New Secure Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
