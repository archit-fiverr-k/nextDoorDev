"use client";

import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/actions/auth";
import { Mail, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RequestResetPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await requestPasswordResetAction(email);
      if (!res.success) {
        setError(res.error || "Something went wrong");
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
            <Mail className="h-6 w-6" />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Reset Password
          </h2>
          <p className="text-center text-sm text-slate-500">
            Enter your email to receive a password reset link.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-emerald-800">
            <CheckCircle className="h-8 w-8 animate-bounce text-emerald-600" />
            <h3 className="text-lg font-bold">Check your email</h3>
            <p className="text-xs leading-normal text-emerald-600">
              We have sent a secure password reset link to your email address if it is registered in
              our system.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="name@pharmacy.com"
              />
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
                  "Send Reset Link"
                )}
              </button>
            </div>

            <div className="text-center text-sm">
              <Link
                href="/login"
                className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
