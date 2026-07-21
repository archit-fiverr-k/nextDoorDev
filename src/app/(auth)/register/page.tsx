"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerPatientAction } from "@/actions/auth";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  Heart,
  CheckCircle2,
  Quote,
  Star,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

export default function RegisterPatientPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Mobile Number OTP Verification Simulation
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtp, setUserOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState(false);

  const handleSendOtp = () => {
    if (!phone || phone.trim().length < 5) {
      setError("Please supply a valid mobile number to send OTP.");
      return;
    }
    setError(null);
    setSendingOtp(true);
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setSendingOtp(false);
    }, 1200);
  };

  const handleVerifyOtp = () => {
    if (userOtp === generatedOtp) {
      setOtpVerified(true);
      setOtpError(false);
      setError(null);
    } else {
      setOtpError(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!otpVerified) {
      setError("Please verify your mobile number using the OTP code sent to your phone.");
      return;
    }

    if (!acceptTerms || !acceptPrivacy) {
      setError("You must accept the terms of service and privacy policy.");
      return;
    }

    startTransition(async () => {
      const res = await registerPatientAction({
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword,
        acceptTerms,
        acceptPrivacyPolicy: acceptPrivacy,
      });

      if (!res.success) {
        setError(res.error || "Registration failed.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    });
  };

  return (
    <div className="grid min-h-screen bg-slate-50 font-sans dark:bg-zinc-950 lg:grid-cols-[1fr_1.1fr]">
      {/* ================= LEFT SIDE: PREMIUM BRAND SHOWCASE ================= */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-navy p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_50%)]" />

        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <img
              src="/assets/header-logo.png"
              alt="NextDoorClinic"
              style={{ filter: "brightness(0) invert(1)" }}
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-10">
          <div className="space-y-4">
            <span className="text-emerald-450 inline-flex select-none items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              <Heart className="size-3" /> Dedicated Patient Portal
            </span>
            <h1 className="font-display text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl">
              Your family&apos;s health, in one place.
            </h1>
            <p className="text-slate-350 text-sm font-normal leading-relaxed">
              Create an account to manage appointments, keep track of clinical reports, rebook
              treatments, and coordinate health schedules.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              {
                title: "One-Tap Rebooking",
                desc: "Instantly rebook repeating services such as flu vaccines and ear microsuction.",
              },
              {
                title: "Secure Health Records",
                desc: "Access clinical notes, prescription statuses, and CQC registration details.",
              },
              {
                title: "Unified Family Profiles",
                desc: "Manage bookings for children and dependents from a single account.",
              },
            ].map((pt, idx) => (
              <div key={idx} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
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

        <div className="relative z-10 border-t border-white/10 pt-6">
          <div className="space-y-3">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-emerald-500 text-emerald-500" />
              ))}
            </div>
            <p className="text-slate-355 relative text-[12px] font-medium italic leading-relaxed">
              <Quote className="pointer-events-none absolute -left-2 -top-3 size-8 text-white/5" />
              &quot;NextDoorClinic makes managing my parents&apos; clinical checkups so
              straightforward. Excellent interface and NHS partner integrations.&quot;
            </p>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Sarah Jenkins • Patient Portal User
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE: PATIENT FORM ================= */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-white px-6 py-12 dark:bg-zinc-950 sm:px-12 lg:px-16">
        <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-[300px] w-[300px] rounded-full bg-brand-teal/5 blur-3xl lg:hidden" />

        <div className="w-full max-w-lg space-y-8">
          <div className="flex flex-col items-center space-y-4 lg:items-start lg:text-left">
            <Link href="/" className="block lg:hidden">
              <img
                src="/assets/header-logo.png"
                alt="NextDoorClinic Logo"
                className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
              />
            </Link>

            <div className="space-y-1.5 text-center lg:text-left">
              <h2 className="text-2xl font-black tracking-tight text-brand-navy dark:text-white sm:text-3xl">
                Create patient account
              </h2>
              <p className="max-w-xs text-xs font-normal leading-relaxed text-slate-500 dark:text-zinc-400">
                Join NextDoorClinic to coordinate vaccine bookings and clinical consultations.
              </p>
            </div>
          </div>

          {success ? (
            <div className="dark:text-emerald-450 flex flex-col items-center space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center text-emerald-600">
              <CheckCircle2 className="size-10 animate-bounce text-emerald-500" />
              <h3 className="text-lg font-bold">Registration Successful!</h3>
              <p className="text-xs font-semibold leading-relaxed">
                Your patient profile has been configured successfully. Redirecting you to login...
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="dark:text-rose-455 flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold leading-relaxed text-rose-600">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-zinc-300">
                    First Name
                  </label>
                  <div className="relative">
                    <span className="text-slate-450 absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-semibold placeholder-slate-400 outline-none transition-all focus:border-brand-teal focus:ring-brand-teal dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                      placeholder="Alistair"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-zinc-300">
                    Last Name
                  </label>
                  <div className="relative">
                    <span className="text-slate-455 absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-semibold placeholder-slate-400 outline-none transition-all focus:border-brand-teal focus:ring-brand-teal dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                      placeholder="Pemberton"
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <span className="text-slate-450 absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-semibold placeholder-slate-400 outline-none transition-all focus:border-brand-teal focus:ring-brand-teal dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                    placeholder="alistair.pemberton@healthmail.co.uk"
                  />
                </div>
              </div>

              {/* Mobile Number & OTP Verification */}
              <div>
                <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-zinc-300">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="text-slate-455 absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      disabled={otpVerified}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-semibold placeholder-slate-400 outline-none transition-all focus:border-brand-teal focus:ring-brand-teal disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                      placeholder="07700 900077"
                    />
                  </div>
                  {!otpVerified && (
                    <button
                      type="button"
                      disabled={sendingOtp || !phone}
                      onClick={handleSendOtp}
                      className="h-10.5 shrink-0 rounded-xl bg-slate-900 px-4 text-[10px] font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                    >
                      {sendingOtp ? "Sending..." : otpSent ? "Resend" : "Verify Mobile"}
                    </button>
                  )}
                </div>
              </div>

              {/* OTP Code entry mock */}
              {otpSent && !otpVerified && (
                <div className="space-y-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <div className="dark:text-emerald-450 flex select-none items-center space-x-2 text-[10px] font-extrabold text-emerald-600">
                    <Phone className="size-3.5 animate-pulse" />
                    <span>
                      [SMS GATEWAY MOCK]: verification code is:{" "}
                      <code className="rounded border bg-white px-1.5 py-0.5 font-mono font-black text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
                        {generatedOtp}
                      </code>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={userOtp}
                      onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-24 rounded-xl border border-slate-200 bg-white p-2 text-center font-mono text-xs font-black outline-none focus:border-brand-teal focus:ring-brand-teal"
                      placeholder="••••"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="hover:bg-emerald-505 h-9 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white transition-colors"
                    >
                      Confirm Code
                    </button>
                  </div>
                  {otpError && (
                    <span className="block text-[10px] font-semibold text-rose-500">
                      Incorrect verification code.
                    </span>
                  )}
                </div>
              )}

              {otpVerified && (
                <div className="dark:text-emerald-450 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-600">
                  <Check className="size-4 shrink-0" />
                  <span>Mobile number verified successfully</span>
                </div>
              )}

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-zinc-300">
                    Password
                  </label>
                  <div className="relative">
                    <span className="text-slate-450 absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-semibold placeholder-slate-400 outline-none transition-all focus:border-brand-teal focus:ring-brand-teal dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-brand-navy dark:text-zinc-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="text-slate-450 absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-semibold placeholder-slate-400 outline-none transition-all focus:border-brand-teal focus:ring-brand-teal dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Accept Policies Checkboxes */}
              <div className="select-none space-y-2 pt-2">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="border-slate-350 mt-0.5 size-4 shrink-0 rounded text-brand-teal focus:ring-brand-teal dark:border-zinc-700"
                  />
                  <span className="text-[11px] font-semibold leading-tight text-slate-500 dark:text-zinc-400">
                    I accept the{" "}
                    <Link href="/terms" className="text-brand-teal hover:underline">
                      Terms and Conditions
                    </Link>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="border-slate-350 mt-0.5 size-4 shrink-0 rounded text-brand-teal focus:ring-brand-teal dark:border-zinc-700"
                  />
                  <span className="text-[11px] font-semibold leading-tight text-slate-500 dark:text-zinc-400">
                    I accept the{" "}
                    <Link href="/privacy" className="text-brand-teal hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="shadow-emerald-605/10 flex w-full select-none justify-center rounded-xl border border-transparent bg-emerald-600 px-4 py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:scale-[0.99] disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    "Register Account"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Link */}
          <div className="space-y-3.5 border-t border-slate-100 pt-6 text-center dark:border-zinc-800/60 lg:text-left">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-brand-teal hover:underline">
                Sign In
              </Link>
            </p>
            <div className="inline-flex select-none items-center space-x-1.5 rounded-lg border border-slate-200/50 bg-slate-50 px-3 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-900/40">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-teal" />
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                NHS Verified Partner System
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
