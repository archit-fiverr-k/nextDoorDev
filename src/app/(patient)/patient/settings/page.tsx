"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Trash2,
} from "lucide-react";
import {
  updatePatientPasswordAction,
  updatePatientNotificationPrefsAction,
  getPatientProfileAction,
} from "@/actions/patient";

export default function PatientSettingsPage() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwPending, startPwTransition] = useTransition();
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false,
  });
  const [prefsPending, startPrefsTransition] = useTransition();
  const [prefsSuccess, setPrefsSuccess] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientProfileAction().then((res) => {
      if (res.success && res.data) {
        setPrefs({
          emailNotifications: res.data.emailNotifications,
          smsNotifications: res.data.smsNotifications,
          whatsappNotifications: res.data.whatsappNotifications,
        });
      }
      setLoading(false);
    });
  }, []);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    startPwTransition(async () => {
      const res = await updatePatientPasswordAction(passwordForm);
      if (!res.success) {
        setPwError(res.error || "Failed to change password.");
      } else {
        setPwSuccess(true);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => setPwSuccess(false), 4000);
      }
    });
  };

  const handlePrefsChange = (field: keyof typeof prefs, val: boolean) => {
    const updated = { ...prefs, [field]: val };
    setPrefs(updated);
    setPrefsError(null);
    setPrefsSuccess(false);

    startPrefsTransition(async () => {
      const res = await updatePatientNotificationPrefsAction(updated);
      if (!res.success) {
        setPrefsError(res.error || "Failed to save preferences.");
      } else {
        setPrefsSuccess(true);
        setTimeout(() => setPrefsSuccess(false), 3000);
      }
    });
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all";

  const Toggle = ({
    label,
    desc,
    icon: Icon,
    field,
  }: {
    label: string;
    desc: string;
    icon: React.ElementType;
    field: keyof typeof prefs;
  }) => (
    <div className="flex items-center justify-between border-b border-slate-50 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
          <Icon className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700">{label}</p>
          <p className="text-[10px] font-medium text-slate-400">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => handlePrefsChange(field, !prefs[field])}
        disabled={prefsPending}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${prefs[field] ? "bg-emerald-600" : "bg-slate-200"}`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${prefs[field] ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">Settings</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Manage your security and notification preferences.
        </p>
      </div>

      {/* Change Password */}
      <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-black text-slate-700">Security</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            {
              label: "Current Password",
              field: "currentPassword" as const,
              placeholder: "Enter current password",
            },
            {
              label: "New Password",
              field: "newPassword" as const,
              placeholder: "Min 8 characters",
            },
            {
              label: "Confirm New Password",
              field: "confirmPassword" as const,
              placeholder: "Repeat new password",
            },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                <Lock className="h-3 w-3" /> {label}
              </label>
              <input
                type="password"
                required
                className={inputCls}
                placeholder={placeholder}
                value={passwordForm[field]}
                onChange={(e) => setPasswordForm((f) => ({ ...f, [field]: e.target.value }))}
              />
            </div>
          ))}

          {pwError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Password changed successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={pwPending}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
          >
            {pwPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {pwPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-1 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-700">Notification Preferences</h2>
          </div>
          {prefsSuccess && <span className="text-[10px] font-bold text-emerald-600">Saved ✓</span>}
          {prefsError && <span className="text-[10px] font-bold text-rose-600">{prefsError}</span>}
        </div>
        <Toggle
          label="Email Notifications"
          desc="Booking confirmations and reminders via email"
          icon={Mail}
          field="emailNotifications"
        />
        <Toggle
          label="SMS Notifications"
          desc="Text message alerts for upcoming appointments"
          icon={Phone}
          field="smsNotifications"
        />
        <Toggle
          label="WhatsApp Notifications"
          desc="WhatsApp messages for bookings and updates"
          icon={MessageSquare}
          field="whatsappNotifications"
        />
      </div>

      {/* Privacy / Delete Account Placeholder */}
      <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Trash2 className="h-4 w-4 text-rose-500" />
          <h2 className="text-sm font-black text-slate-700">Privacy & Account</h2>
        </div>
        <p className="text-xs font-medium leading-relaxed text-slate-500">
          You can request deletion of your account and all associated data. This action is permanent
          and irreversible. Please contact our support team at{" "}
          <a
            href="mailto:support@nextdoorclinic.com"
            className="font-semibold text-emerald-600 hover:underline"
          >
            support@nextdoorclinic.com
          </a>{" "}
          to submit a deletion request.
        </p>
        <button
          disabled
          className="cursor-not-allowed rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-500 opacity-50"
        >
          Request Account Deletion
        </button>
        <p className="text-[9px] font-medium text-slate-400">
          Account deletion requests are processed within 30 days in accordance with UK GDPR.
        </p>
      </div>
    </div>
  );
}
