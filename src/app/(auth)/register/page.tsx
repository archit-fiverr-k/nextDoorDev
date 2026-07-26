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
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
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
  const [showPassword, setShowPassword] = useState(false);
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
      setError("Please supply a valid UK mobile number to send OTP.");
      return;
    }
    setError(null);
    setSendingOtp(true);
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setSendingOtp(false);
    }, 1000);
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
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!otpVerified) {
      setError("Please verify your mobile number using the OTP code sent to your phone.");
      return;
    }

    if (!acceptTerms || !acceptPrivacy) {
      setError("You must accept the terms of service and privacy policy to continue.");
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
        setError(res.error || "Registration failed. Please try again.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    });
  };

  return (
    <div className="grid min-h-screen bg-slate-50 font-sans dark:bg-zinc-950 lg:grid-cols-[1.1fr_1fr]">
      {/* ========================================================================= */}
      {/* LEFT SIDE: EDITORIAL BRAND SHOWCASE */}
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
                Patient Healthcare Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Hero Showcase */}
        <div className="relative z-10 my-auto max-w-lg space-y-8">
          <div className="space-y-3">
            <span className="inline-flex select-none items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 backdrop-blur-md">
              <Heart className="h-3.5 w-3.5 text-[#10B981]" /> Personal Healthcare Companion
            </span>

            <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white lg:text-5xl">
              Your health, effortlessly managed.
            </h1>

            <p className="text-xs font-medium leading-relaxed text-slate-300 sm:text-sm">
              Create a free patient profile to book same-day consultations, access clinical reports,
              reorder treatments, and store medical records securely.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-4 pt-2">
            {[
              {
                title: "Instant Same-Day Bookings",
                desc: "Book ear wax removal, blood tests, and travel vaccines in under 30 seconds.",
              },
              {
                title: "GPhC & NHS Verified Partners",
                desc: "100% accredited UK pharmacies with transparent upfront pricing.",
              },
              {
                title: "Unified Family Health Records",
                desc: "Access consultation history and medical certificates from any device.",
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

        {/* Testimonial Footer */}
        <div className="relative z-10 border-t border-slate-800 pt-6">
          <div className="space-y-3">
            <div className="flex gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
              ))}
            </div>
            <p className="relative text-xs font-medium italic leading-relaxed text-slate-300">
              <Quote className="pointer-events-none absolute -left-2 -top-3 h-8 w-8 text-white/5" />
              &quot;NextDoorClinic makes booking health checkups so straightforward. Outstanding
              interface and verified local pharmacies.&quot;
            </p>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#10B981]">
              Sarah Jenkins • Verified Patient Portal User
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SIDE: REGISTRATION FORM */}
      {/* ========================================================================= */}
      <div className="relative flex flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12 dark:bg-zinc-950 sm:px-12 lg:px-16">
        {/* Soft Background Accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#10B981]/10 blur-3xl lg:hidden" />

        <div className="w-full max-w-lg space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center space-y-3 text-center lg:items-start lg:text-left">
            <Link href="/" className="flex items-center space-x-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#10B981] text-xs font-black text-white shadow-md">
                NC
              </div>
              <span className="text-base font-black text-slate-900 dark:text-white">
                NextDoorClinic
              </span>
            </Link>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">
                Patient Registration
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Create your patient account
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Join NextDoorClinic to discover and book clinical healthcare services.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {success ? (
            <div className="flex flex-col items-center space-y-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center text-[#10B981] animate-in fade-in">
              <CheckCircle2 className="h-12 w-12 animate-bounce text-[#10B981]" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Registration Successful!
              </h3>
              <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                Your patient profile has been created successfully. Redirecting you to sign in...
              </p>
              <Link
                href="/login"
                className="mt-2 rounded-xl bg-[#10B981] px-6 py-2.5 text-xs font-black text-white shadow-md hover:bg-emerald-600"
              >
                Go to Sign In Now
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-start space-x-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-600 animate-in fade-in dark:text-rose-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    First Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      placeholder="Archit"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Last Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      placeholder="Karma"
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    placeholder="archit@example.co.uk"
                  />
                </div>
              </div>

              {/* Mobile Number & Verification */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  UK Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      disabled={otpVerified}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      placeholder="07700 900077"
                    />
                  </div>

                  {!otpVerified && (
                    <button
                      type="button"
                      disabled={sendingOtp || !phone}
                      onClick={handleSendOtp}
                      className="shadow-xs h-11 shrink-0 rounded-2xl bg-slate-900 px-4 text-xs font-black text-white transition-all hover:bg-[#10B981] active:scale-95 disabled:opacity-50 dark:bg-zinc-800"
                    >
                      {sendingOtp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : otpSent ? (
                        "Resend OTP"
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* OTP Entry Simulation */}
              {otpSent && !otpVerified && (
                <div className="space-y-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 animate-in fade-in dark:border-emerald-900/60 dark:bg-emerald-950/40">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#10B981]">
                    <Phone className="h-4 w-4 animate-pulse" />
                    <span>
                      Verification code:{" "}
                      <code className="rounded-lg border border-emerald-300 bg-white px-2 py-0.5 font-mono text-xs font-black text-emerald-800 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300">
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
                      className="w-28 rounded-xl border border-slate-200 bg-white p-2 text-center font-mono text-sm font-black outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      placeholder="••••"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="shadow-xs rounded-xl bg-[#10B981] px-4 py-2 text-xs font-black text-white hover:bg-emerald-600 active:scale-95"
                    >
                      Verify Code
                    </button>
                  </div>
                  {otpError && (
                    <span className="block text-xs font-bold text-rose-600">
                      Incorrect verification code. Please check above code.
                    </span>
                  )}
                </div>
              )}

              {otpVerified && (
                <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3 text-xs font-bold text-[#10B981] dark:border-emerald-900/60 dark:bg-emerald-950/40">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Mobile number verified successfully</span>
                </div>
              )}

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 pl-11 pr-9 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 pl-11 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#10B981] focus:bg-white focus:ring-2 focus:ring-[#10B981]/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {/* Policy Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="flex cursor-pointer items-start space-x-2.5">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#10B981] focus:ring-[#10B981]"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    I accept the{" "}
                    <Link href="/terms" className="font-bold text-[#10B981] hover:underline">
                      Terms & Conditions
                    </Link>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start space-x-2.5">
                  <input
                    type="checkbox"
                    checked={acceptPrivacy}
                    onChange={(e) => setAcceptPrivacy(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#10B981] focus:ring-[#10B981]"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    I accept the{" "}
                    <Link href="/privacy" className="font-bold text-[#10B981] hover:underline">
                      Privacy Policy
                    </Link>
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
                    <span>Register Patient Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Link */}
          <div className="dark:border-zinc-850 space-y-3 border-t border-slate-100 pt-5 text-center lg:text-left">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="font-extrabold text-[#10B981] hover:underline">
                Sign In
              </Link>
            </p>

            <div className="flex justify-center pt-1 lg:justify-start">
              <div className="inline-flex select-none items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  NHS Verified Healthcare Partner
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
