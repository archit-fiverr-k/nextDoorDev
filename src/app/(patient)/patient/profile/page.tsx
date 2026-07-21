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
      <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
        <Icon className="h-3 w-3" /> {label}
      </label>
      {children}
    </div>
  );

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-800">My Profile</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Manage your personal information and emergency contacts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="border-b border-slate-100 pb-3 text-sm font-black text-slate-700">
            Personal Information
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
              className={`${inputCls} cursor-not-allowed opacity-60`}
              value=""
              placeholder="Contact support to change email"
              disabled
            />
            <p className="mt-1 text-[9px] font-medium text-slate-400">
              Email address cannot be changed. Contact support if needed.
            </p>
          </Field>

          <Field label="Phone Number" icon={Phone}>
            <input
              className={inputCls}
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+44 7700 900077"
              required
            />
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
        <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Heart className="h-4 w-4 text-rose-500" />
            <h2 className="text-sm font-black text-slate-700">Emergency Contact</h2>
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

        {/* Feedback messages */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile updated successfully.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
