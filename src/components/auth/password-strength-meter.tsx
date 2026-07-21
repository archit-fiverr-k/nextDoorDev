"use client";

import React from "react";
import { Check, X, ShieldCheck, ShieldAlert } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const hasMinLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const passedChecks = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(
    Boolean
  ).length;

  // Strength score calculation
  const getScoreColor = () => {
    if (passedChecks <= 2) return "bg-rose-500 text-rose-700 dark:text-rose-400";
    if (passedChecks === 3 || passedChecks === 4)
      return "bg-amber-500 text-amber-700 dark:text-amber-400";
    return "bg-emerald-500 text-emerald-700 dark:text-emerald-400";
  };

  const getScoreLabel = () => {
    if (passedChecks <= 2) return "Weak (Does not meet security requirements)";
    if (passedChecks === 3 || passedChecks === 4) return "Fair (Add special symbols or numbers)";
    return "Enterprise Grade (Strong Security)";
  };

  if (!password) return null;

  return (
    <div className="select-none space-y-2.5 rounded-xl border border-slate-200/60 bg-slate-50 p-3.5 text-xs dark:border-zinc-800/60 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-500 dark:text-zinc-400">Password Strength:</span>
        <span className={`font-extrabold ${getScoreColor().split(" ")[1]}`}>{getScoreLabel()}</span>
      </div>

      {/* Visual Progress Bar */}
      <div className="flex h-1.5 w-full space-x-0.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 transition-all duration-300 ${
              step <= passedChecks ? getScoreColor().split(" ")[0] : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Rules Checklist Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 text-[10px] font-semibold">
        <RuleItem label="Min 12 characters" isPassed={hasMinLength} />
        <RuleItem label="Uppercase letter (A-Z)" isPassed={hasUppercase} />
        <RuleItem label="Lowercase letter (a-z)" isPassed={hasLowercase} />
        <RuleItem label="Numeric digit (0-9)" isPassed={hasNumber} />
        <RuleItem label="Special symbol (!@#$%^&*)" isPassed={hasSpecial} />
      </div>
    </div>
  );
}

function RuleItem({ label, isPassed }: { label: string; isPassed: boolean }) {
  return (
    <div className="flex items-center space-x-1.5">
      {isPassed ? (
        <Check className="h-3 w-3 shrink-0 font-bold text-emerald-600 dark:text-emerald-400" />
      ) : (
        <X className="h-3 w-3 shrink-0 text-slate-400 dark:text-zinc-600" />
      )}
      <span
        className={
          isPassed
            ? "font-bold text-slate-800 dark:text-slate-200"
            : "text-slate-400 dark:text-zinc-500"
        }
      >
        {label}
      </span>
    </div>
  );
}
