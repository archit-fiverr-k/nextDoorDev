"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useTransition } from "react";
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
  Eye,
  EyeOff,
  Building2,
  UserCheck,
  ArrowRight,
} from "lucide-react";

function LoginFormContent() {
  const searchParams = useSearchParams();
  const queryError = searchParams?.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (queryError) {
      if (
        queryError.includes("CallbackRouteError") ||
        queryError.includes("CredentialsSignin") ||
        queryError.includes("Callback")
      ) {
        setError("Invalid email address or password. Please check your credentials and try again.");
      } else if (queryError.includes("AccessDenied")) {
        setError("Access denied. Your account may be pending approval or suspended.");
      } else if (queryError.includes("SessionRequired")) {
        setError("Please sign in to access your workspace.");
      } else {
        setError("Invalid credentials. Please check your details and try again.");
      }
    }
  }, [queryError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await loginAction({ email, password });
      if (!res.success) {
        setError(res.error || "Login failed. Please check your credentials.");
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

              if (role === "super_admin" || role === "platform_admin") {
                window.location.href = "/admin";
                return;
              }

              if (role === "pharmacy") {
                window.location.href = "/pharmacy";
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
    <div className="grid min-h-screen bg-slate-50 font-sans dark:bg-zinc-950 lg:grid-cols-[1.1fr_1fr]">
      {/* ========================================================================= */}
      {/* LEFT SIDE: EDITORIAL BRAND & TRUST SHOWCASE */}
      {/* ========================================================================= */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#000e35] via-[#0F172A] to-slate-900 p-12 text-white lg:flex">
        {/* Soft Background Mesh */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.15),transparent_55%)]" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#10B981] text-base font-black text-white shadow-lg ring-4 ring-emerald-500/20">
              NC
            </div>
            <div>
              <span className="block text-base font-black tracking-tight text-white">
                NextDoorClinic
              </span>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-emerald-400">
                UK Healthcare Network
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Content Hero */}
        <div className="relative z-10 my-auto max-w-lg space-y-8">
          <div className="space-y-3">
            <span className="inline-flex select-none items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#10B981]" /> Verified Clinical Gateway
            </span>

            <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              Access your clinical portal.
            </h1>

            <p className="text-xs font-medium leading-relaxed text-slate-300 sm:text-sm">
              Log in to manage appointments, sync GPhC pharmacy schedules, review patient intakes,
              or track your healthcare records seamlessly.
            </p>
          </div>

          {/* Key Value Points */}
          <div className="space-y-4 pt-2">
            {[
              {
                title: "Unified Patient & Provider Portal",
                desc: "One secure gateway for patients, clinical prescribers, and pharmacy owners.",
              },
              {
                title: "GPhC & CQC Compliant Audit Trail",
                desc: "Automated consultation logs, prescription tracking, and NHS integrations.",
              },
              {
                title: "Real-time Slot Synchronizer",
                desc: "Instant booking confirmation with zero waiting or double bookings.",
              },
            ].map((pt, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-[#10B981]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
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

        {/* Footer Review Quote */}
        <div className="relative z-10 border-t border-slate-800 pt-6">
          <div className="space-y-3">
            <div className="flex gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="relative text-xs font-medium italic leading-relaxed text-slate-300">
              <Quote className="pointer-events-none absolute -left-2 -top-3 h-8 w-8 text-white/5" />
              &quot;NextDoorClinic eliminated all scheduling overhead for our pharmacy group.
              Patients book microsuction and travel vaccinations effortlessly.&quot;
            </p>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#10B981]">
              Director • Newman&apos;s Pharmacy Group • Leeds
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE: AUTHENTICATION FORM */}
      {/* ========================================================================= */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-white px-6 py-12 dark:bg-zinc-950 sm:px-12 lg:px-16">
        {/* Soft Background Accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#10B981]/10 blur-3xl lg:hidden" />

        <div className="w-full max-w-md space-y-8">
          {/* Header & Logo */}
          <div className="flex flex-col items-center space-y-4 text-center lg:items-start lg:text-left">
            <Link href="/" className="flex items-center space-x-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981] text-xs font-black text-white shadow-md">
                NC
              </div>
              <span className="text-base font-black text-slate-900 dark:text-white">
                NextDoorClinic
              </span>
            </Link>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                Welcome Back
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Sign in to your account
              </h2>
              <p className="mx-auto max-w-xs text-xs text-slate-500 dark:text-zinc-400 lg:mx-0">
                Enter your credentials to access your patient portal or pharmacy workspace.
              </p>
            </div>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-600 animate-in fade-in dark:text-rose-400">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300"
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 pl-11 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-[#10B981]"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-[11px] font-bold text-[#10B981] hover:underline"
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
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 pl-11 pr-11 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-[#10B981]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex select-none items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center space-x-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#10B981] focus:ring-[#10B981]"
                />
                <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  Keep me signed in
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-[#10B981] px-4 py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Options Footer */}
          <div className="dark:border-zinc-850 space-y-4 border-t border-slate-100 pt-6 text-center lg:text-left">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                New to NextDoorClinic?
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Create your patient profile or register your pharmacy clinic.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Link
                href="/register"
                className="shadow-xs flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-800 transition-all hover:border-[#10B981] hover:bg-emerald-50 hover:text-[#10B981] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <UserCheck className="h-3.5 w-3.5 text-[#10B981]" />
                <span>Patient Sign Up</span>
              </Link>
              <Link
                href="/register-clinic"
                className="shadow-xs flex items-center justify-center space-x-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 px-3 py-2.5 text-xs font-black text-[#10B981] transition-all hover:bg-[#10B981] hover:text-white dark:border-emerald-900/60 dark:bg-emerald-950/40"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Register Clinic</span>
              </Link>
            </div>

            <div className="flex justify-center pt-2 lg:justify-start">
              <div className="inline-flex select-none items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  NHS & GPhC Verified Security Standard
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-zinc-950">
          <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
