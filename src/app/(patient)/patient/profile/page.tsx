"use client";

import { useState, useTransition, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Heart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  FileText,
} from "lucide-react";
import { getPatientProfileAction, updatePatientProfileAction } from "@/actions/patient";

const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say", "Other"];

export default function PatientProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    getPatientProfileAction().then((res) => {
      if (res.success && res.data) {
        const d = res.data;
        setForm({
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          email: d.email || "",
          phone: d.phone || "",
          gender: d.gender || "",
          address: d.address || "",
          emergencyContactName: d.emergencyContactName || "",
          emergencyContactPhone: d.emergencyContactPhone || "",
          dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split("T")[0] : "",
        });
      }
      setLoading(false);
    });
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await updatePatientProfileAction(form);
      if (!res.success) {
        setError(res.error || "Failed to update profile.");
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const getInitials = () => {
    const f = form.firstName[0] || "P";
    const l = form.lastName[0] || "";
    return `${f}${l}`.toUpperCase();
  };

  const Field = ({
    label,
    icon: Icon,
    children,
  }: {
    label: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="mb-1.5 block flex items-center gap-1.5 text-xs font-extrabold text-slate-700 dark:text-zinc-300">
        <Icon className="h-3.5 w-3.5 text-slate-400" /> {label}
      </label>
      {children}
    </div>
  );

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile Header Avatar Card */}
      <div className="shadow-xs dark:border-zinc-850 flex flex-col items-center gap-5 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900 sm:flex-row sm:p-8">
        <div className="dark:ring-zinc-850 flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-emerald-600 text-2xl font-black text-white shadow-lg ring-4 ring-emerald-50">
          {getInitials()}
        </div>
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {form.firstName} {form.lastName}
          </h1>
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 sm:justify-start">
            <Mail className="h-3.5 w-3.5 text-slate-400" /> {form.email}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 sm:justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified Patient
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              NHS ID Connected
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="shadow-xs dark:border-zinc-850 space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900 sm:p-8">
          <h2 className="border-b border-slate-100 pb-3 text-sm font-extrabold text-slate-900 dark:border-zinc-800 dark:text-white">
            Personal Details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" icon={User}>
              <input
                className={inputCls}
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="First name"
                required
              />
            </Field>
            <Field label="Last Name" icon={User}>
              <input
                className={inputCls}
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Last name"
                required
              />
            </Field>
          </div>

          <Field label="Email Address" icon={Mail}>
            <input
              className={`${inputCls} cursor-not-allowed opacity-70`}
              value={form.email}
              disabled
            />
          </Field>

          <Field label="Verified Mobile Number" icon={Phone}>
            <div className="relative">
              <input
                className={inputCls}
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+44 7700 900077"
                required
              />
              {form.phone && (
                <span className="absolute right-3 top-2.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  Verified ✓
                </span>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date of Birth" icon={Calendar}>
              <input
                className={inputCls}
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
              />
            </Field>
            <Field label="Gender" icon={Users}>
              <select
                className={inputCls}
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Home Address" icon={MapPin}>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="123 High Street, London, E1 6BT"
            />
          </Field>
        </div>

        {/* Emergency Contact */}
        <div className="shadow-xs dark:border-zinc-850 space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900 sm:p-8">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
            <Heart className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Emergency Contact
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Name" icon={User}>
              <input
                className={inputCls}
                value={form.emergencyContactName}
                onChange={(e) => update("emergencyContactName", e.target.value)}
                placeholder="Full name"
              />
            </Field>
            <Field label="Contact Phone" icon={Phone}>
              <input
                className={inputCls}
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(e) => update("emergencyContactPhone", e.target.value)}
                placeholder="+44 7700 900077"
              />
            </Field>
          </div>
        </div>

        {/* Medical Information */}
        <div className="shadow-xs dark:border-zinc-850 space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 dark:bg-zinc-900 sm:p-8">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-zinc-800">
            <Stethoscope className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Medical Information
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <div className="dark:bg-zinc-850 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-zinc-800">
              <span className="block font-bold text-slate-700 dark:text-zinc-300">
                Known Allergies
              </span>
              <span className="mt-0.5 block text-slate-500 dark:text-zinc-400">
                Penicillin (Mild rash recorded)
              </span>
            </div>
            <div className="dark:bg-zinc-850 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-zinc-800">
              <span className="block font-bold text-slate-700 dark:text-zinc-300">
                Chronic Conditions
              </span>
              <span className="mt-0.5 block text-slate-500 dark:text-zinc-400">
                Asthma (Inhaler prescribed)
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile updated successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-black text-white shadow-md transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Saving Profile..." : "Save Profile Details"}
        </button>
      </form>
    </div>
  );
}
