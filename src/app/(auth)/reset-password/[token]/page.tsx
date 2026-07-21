"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/actions/auth";
import { Lock, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ResetPasswordTokenPageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordTokenPage({ params }: ResetPasswordTokenPageProps) {
  const { token } = params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    startTransition(async () => {
      const res = await resetPasswordAction(token, newPassword);
      if (!res.success) {
        setError(res.error || "Reset password failed");
      } else {
        setSuccess(true);
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
            Choose New Password
          </h2>
          <p className="text-center text-sm text-slate-500">
            Set your new credentials to log back in.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
            <CheckCircle className="h-8 w-8 animate-bounce text-emerald-600" />
            <h3 className="text-lg font-bold">Password Reset!</h3>
            <p className="text-xs leading-normal text-emerald-600">
              Your password has been reset successfully. You can now log back in with your new
              credentials.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to Login
            </Link>
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
                  New Password
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
                  Confirm Password
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
                  "Reset Password"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
