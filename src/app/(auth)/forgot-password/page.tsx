"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { requestPasswordResetAction } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError("Please supply a valid email address.");
      return;
    }

    startTransition(async () => {
      const res = await requestPasswordResetAction(email);
      if (!res.success) {
        setError(res.error || "An error occurred.");
      } else {
        setSuccess(true);
      }
    });
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 pl-11 text-xs border focus:border-brand-teal focus:ring-brand-teal font-semibold placeholder-slate-400 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-white transition-all outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
            Forgot Password
          </h1>
          <p className="text-xs font-semibold leading-relaxed text-slate-500 dark:text-zinc-400">
            Enter your email address and we&apos;ll send you a password reset link.
          </p>
        </div>

        {success ? (
          <div className="dark:text-emerald-450 flex flex-col items-center space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center text-emerald-700">
            <CheckCircle2 className="size-8 animate-bounce text-emerald-500" />
            <h3 className="text-sm font-bold">Reset Link Sent!</h3>
            <p className="text-xs font-semibold leading-relaxed">
              If an account matches that email, we have dispatched a password reset message with
              instructions.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="dark:text-rose-455 flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-semibold leading-relaxed text-rose-600">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full select-none justify-center rounded-xl bg-slate-900 px-4 py-3.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="border-t border-slate-100 pt-2 text-center dark:border-zinc-800">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
