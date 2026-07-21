"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Key,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
} from "lucide-react";

interface MfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export function MfaModal({ isOpen, onClose, userRole }: MfaModalProps) {
  const [method, setMethod] = useState<"totp" | "sms" | "email">("totp");
  const [otpCode, setOtpCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const mockSecretKey = "NDC-784A-992B-4411-MFA";
  const mockRecoveryCodes = ["8492-1049", "3920-5821", "9012-4821", "5810-3912"];

  if (!isOpen) return null;

  const handleVerify = () => {
    if (otpCode.length >= 6) {
      setIsVerified(true);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(mockSecretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 font-bold text-teal-600 dark:border-teal-900/40 dark:bg-teal-950/40 dark:text-teal-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Protect your account with modern 2FA verification.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 dark:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        {isVerified ? (
          <div className="space-y-4 py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-teal-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              2FA Successfully Activated!
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Your account is now protected. Save your emergency recovery codes below:
            </p>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {mockRecoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="rounded border border-slate-100 bg-white p-1 dark:border-zinc-900 dark:bg-zinc-950"
                >
                  {code}
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-950"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-zinc-300">
            {/* Method Selection */}
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                onClick={() => setMethod("totp")}
                className={`rounded-xl border p-2 text-center font-bold transition-all ${
                  method === "totp"
                    ? "border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                Authenticator App
              </button>
              <button
                onClick={() => setMethod("sms")}
                className={`rounded-xl border p-2 text-center font-bold transition-all ${
                  method === "sms"
                    ? "border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                SMS OTP
              </button>
              <button
                onClick={() => setMethod("email")}
                className={`rounded-xl border p-2 text-center font-bold transition-all ${
                  method === "email"
                    ? "border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                Email OTP
              </button>
            </div>

            {/* TOTP Section */}
            {method === "totp" && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center space-x-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
                    <QrCode className="h-14 w-14 text-slate-900" />
                  </div>
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-900 dark:text-slate-100">
                      Scan QR Code
                    </span>
                    <p className="text-[10px] leading-tight text-slate-400">
                      Use 1Password, Google Authenticator, or Authy to scan QR code.
                    </p>
                    <button
                      onClick={copySecret}
                      className="flex items-center space-x-1 text-[10px] font-bold text-teal-600 hover:underline dark:text-teal-400"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedKey ? "Key Copied!" : "Manual Key"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Code Verification Input */}
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Enter 6-Digit 2FA Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center font-mono text-lg font-bold tracking-widest outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={otpCode.length < 6}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950"
            >
              Verify & Enable 2FA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
