"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import {
  Lock,
  Mail,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Quote,
  Sparkles,
  Star,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await loginAction({ email, password });
      if (!res.success) {
        setError(res.error || "Login failed");
      } else {
        try {
          // Fetch current session to determine user role and redirect target
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const session = await sessionRes.json();
            if (session?.user) {
              const role = session.user.role;
              const mustChangePassword = session.user.mustChangePassword;

              if (mustChangePassword) {
                window.location.href = "/change-password";
                return;
              }

              if (role === "super_admin") {
                window.location.href = "/admin";
                return;
              }

              if (role === "platform_admin") {
                window.location.href = "/admin";
                return;
              }

              if (role === "pharmacy") {
                window.location.href = "/provider";
                return;
              }

              if (role === "staff") {
                window.location.href = "/staff";
                return;
              }

              if (role === "patient") {
                window.location.href = "/patient";
                return;
              }
            }
          }
          window.location.href = "/";
        } catch (err) {
          console.error("Session redirect check failed:", err);
          window.location.href = "/";
        }
      }
    });
  };

  return (
    <div className="grid min-h-screen bg-slate-50 font-sans dark:bg-zinc-950 lg:grid-cols-[1fr_1.1fr]">
      {/* ================= LEFT SIDE: PREMIUM BRAND SHOWCASE (lg+ only) ================= */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-navy p-12 text-white lg:flex">
        {/* Glowing Background Radial Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.15),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_50%)]" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <img
              src="/assets/header-logo.png"
              alt="NextDoorClinic"
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          </Link>
        </div>

        {/* Content Block */}
        <div className="relative z-10 my-auto max-w-lg space-y-10">
          <div className="space-y-4">
            <span className="inline-flex select-none items-center gap-1.5 rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-teal">
              <Sparkles className="size-3" /> Partner Clinical Portal
            </span>
            <h1 className="font-display text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl">
              Streamline your clinic operations.
            </h1>
            <p className="text-slate-350 text-sm font-normal leading-relaxed">
              Log in to access your NextDoorClinic branch dashboard. Manage same-day clinical slot
              availability, review patient intakes, track payouts, and coordinate compliance
              documentation.
            </p>
          </div>

          {/* Key Value Points */}
          <div className="space-y-4 pt-2">
            {[
              {
                title: "Real-time Slot Synchronizer",
                desc: "Instantly update availability across the NHS-verified patient marketplace.",
              },
              {
                title: "CQC Audit compliance",
                desc: "Automated audit trails, clinical logging, and secure GDPR communications.",
              },
              {
                title: "Automated B2B Payouts",
                desc: "Next-day Stripe clearances for private GP and specialist clinical services.",
              },
            ].map((pt, idx) => (
              <div key={idx} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-teal" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    {pt.title}
                  </h4>
                  <p className="text-xs font-normal leading-relaxed text-slate-400">{pt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Footer & Testimonial Quote */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <div className="space-y-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-brand-teal text-brand-teal" />
              ))}
            </div>
            <p className="relative text-[12px] font-medium italic leading-relaxed text-slate-300">
              <Quote className="pointer-events-none absolute -left-2 -top-3 size-8 text-white/5" />
              &quot;The NextDoorClinic portal has completely eliminated clinical slot management
              overheads. Our flu vaccine appointment volume rose by 140% in two months.&quot;
            </p>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Director • Newman&apos;s Pharmacy Group
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: AUTHENTICATION FORM ================= */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-white px-6 py-12 dark:bg-zinc-950 sm:px-12 lg:px-16">
        {/* Soft Decorative Ambient Background for Mobile/Tablet */}
        <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[300px] w-[300px] rounded-full bg-brand-teal/5 blur-3xl lg:hidden" />

        <div className="w-full max-w-md space-y-8">
          {/* Header (Desktop & Mobile) */}
          <div className="flex flex-col items-center space-y-4 lg:items-start lg:text-left">
            <Link href="/" className="block">
              <img
                src="/assets/header-logo.png"
                alt="NextDoorClinic Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <div className="space-y-1.5 text-center lg:text-left">
              <h2 className="text-2xl font-black tracking-tight text-brand-navy dark:text-white sm:text-3xl">
                Sign in to your account
              </h2>
              <p className="max-w-xs text-xs font-normal leading-relaxed text-slate-500 dark:text-zinc-400">
                Access your clinical workspace, sync calendars, and review incoming patient
                requests.
              </p>
            </div>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="dark:text-rose-455 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold leading-relaxed text-rose-600">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-zinc-300"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 pl-11 text-xs font-semibold placeholder-slate-400 outline-none transition-all focus:border-brand-teal focus:ring-brand-teal dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                    placeholder="name@pharmacy.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-zinc-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-[10px] font-bold text-brand-teal hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 pl-11 text-xs font-semibold placeholder-slate-400 outline-none transition-all focus:border-brand-teal focus:ring-brand-teal dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex select-none items-center justify-between pt-1 text-xs">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="border-slate-350 size-4 shrink-0 rounded text-brand-teal focus:ring-brand-teal dark:border-zinc-700"
                />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  Remember Me
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="group relative flex w-full select-none justify-center rounded-xl border border-transparent bg-brand-navy px-4 py-3.5 text-xs font-bold text-white shadow-md shadow-brand-navy/10 transition-all hover:bg-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  "Sign In to Workspace"
                )}
              </button>
            </div>
          </form>

          {/* Onboarding Callout Footer */}
          <div className="space-y-4 border-t border-slate-100 pt-6 text-center dark:border-zinc-800/60 lg:text-left">
            <div className="space-y-1 text-center lg:text-left">
              <h4 className="text-slate-850 dark:text-zinc-350 text-[11px] font-black uppercase tracking-wider">
                New to NextDoorClinic?
              </h4>
              <p className="text-slate-450 dark:text-zinc-450 text-[10px] font-normal leading-relaxed">
                Create your profile to start booking appointments or managing your clinical
                workspace.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2">
              <Link
                href="/register"
                className="dark:text-emerald-450 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/50 px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-wider text-emerald-600 transition-colors hover:bg-emerald-500/10"
              >
                Register as Patient
              </Link>
              <Link
                href="/register-clinic"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-teal/50 px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-wider text-brand-teal transition-colors hover:bg-brand-teal/10"
              >
                Register Clinic
              </Link>
            </div>

            <div className="flex justify-center lg:justify-start">
              <div className="inline-flex select-none items-center space-x-1.5 rounded-lg border border-slate-200/50 bg-slate-50 px-3 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-teal" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  NHS Verified Clinical Gateway
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
