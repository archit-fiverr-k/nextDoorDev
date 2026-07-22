"use client";

import React, { useState, useEffect, useTransition } from "react";
import { ShieldCheck, CheckCircle2, Copy, Loader2, AlertCircle } from "lucide-react";
import { setupMfaAction, enableMfaAction } from "@/actions/mfa";

interface MfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  customerId?: string;
  accountName?: string;
}

export function MfaModal({ isOpen, onClose, userId, customerId, accountName }: MfaModalProps) {
  const [method, setMethod] = useState<"totp" | "email">("totp");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secretBase32, setSecretBase32] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loadingQr, setLoadingQr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setIsVerified(false);
      setOtpCode("");
      setError(null);
      setLoadingQr(true);

      setupMfaAction({
        userId,
        customerId,
        accountName: accountName || "patient@nextdoorclinic.co.uk",
      })
        .then((res) => {
          if (res.success && res.qrCodeDataUrl) {
            setQrCodeUrl(res.qrCodeDataUrl);
            setSecretBase32(res.secretBase32 || null);
          } else {
            setError(res.error || "Failed to load authenticator QR code");
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoadingQr(false));
    }
  }, [isOpen, userId, customerId, accountName]);

  if (!isOpen) return null;

  const handleVerify = () => {
    if (otpCode.length < 6) return;
    setError(null);

    startTransition(async () => {
      const res = await enableMfaAction({
        userId,
        customerId,
        code: otpCode,
      });

      if (res.success && res.backupCodes) {
        setRecoveryCodes(res.backupCodes);
        setIsVerified(true);
      } else {
        setError(res.error || "Invalid 2FA code");
      }
    });
  };

  const copySecret = () => {
    if (secretBase32) {
      navigator.clipboard.writeText(secretBase32);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 font-bold text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                Two-Factor Authentication (2FA)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Protect your NextDoorClinic account with TOTP Authenticator.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isVerified ? (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              2FA Successfully Activated!
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Your account is now protected. Save your emergency recovery backup codes below:
            </p>

            <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="rounded border border-slate-200 bg-white p-1.5 font-extrabold dark:border-zinc-800 dark:bg-zinc-950"
                >
                  {code}
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-md bg-[#000e35] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-medium text-slate-700 dark:text-zinc-300">
            {/* TOTP Section */}
            {loadingQr ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-[#000e35]" />
                <span className="mt-2 text-xs font-bold">Generating QR Code...</span>
              </div>
            ) : qrCodeUrl ? (
              <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center space-x-4">
                  <img
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                    className="h-24 w-24 rounded border border-slate-200 bg-white p-1"
                  />
                  <div className="space-y-1">
                    <span className="block font-bold text-slate-900 dark:text-slate-100">
                      Scan QR Code
                    </span>
                    <p className="text-[10px] leading-tight text-slate-500">
                      Use Google Authenticator, Microsoft Authenticator, or 1Password to scan.
                    </p>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      <Copy className="h-3 w-3" />
                      <span>{copiedKey ? "Key Copied!" : "Copy Manual Key"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Code Verification Input */}
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-500">
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-center font-mono text-lg font-bold tracking-widest outline-none focus:border-[#000e35] dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={otpCode.length < 6 || isPending}
              className="flex w-full items-center justify-center space-x-2 rounded-md bg-[#000e35] py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Verify Code & Enable 2FA</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
