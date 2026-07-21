"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getAutoLogoutMinutes, UserRole } from "@/lib/rbac";
import { logoutAction } from "@/actions/auth";
import { Clock, ShieldAlert, LogOut, RefreshCw } from "lucide-react";

interface InactivityTimerContextType {
  resetTimer: () => void;
}

const InactivityTimerContext = createContext<InactivityTimerContextType>({
  resetTimer: () => {},
});

export const useInactivityTimer = () => useContext(InactivityTimerContext);

interface InactivityTimerProviderProps {
  children: React.ReactNode;
  userRole?: UserRole;
}

export function InactivityTimerProvider({ children, userRole }: InactivityTimerProviderProps) {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120); // 2 min warning countdown

  const timeoutMinutes = getAutoLogoutMinutes(userRole);
  const warningThresholdSeconds = (timeoutMinutes - 2) * 60; // trigger warning 2m before
  const totalTimeoutSeconds = timeoutMinutes * 60;

  const lastActiveRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    lastActiveRef.current = Date.now();
    setShowWarningModal(false);
    setSecondsRemaining(120);
  };

  const handleForceLogout = async () => {
    setShowWarningModal(false);
    await logoutAction();
    window.location.href = "/login?reason=inactivity";
  };

  useEffect(() => {
    // Only run if user is logged in
    if (!userRole || userRole === "guest") return;

    const handleUserActivity = () => {
      // If modal is not active, touch activity updates timestamp
      if (!showWarningModal) {
        lastActiveRef.current = Date.now();
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity));

    // Master check interval running every 5 seconds
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActiveRef.current) / 1000);

      if (elapsedSeconds >= totalTimeoutSeconds) {
        handleForceLogout();
      } else if (elapsedSeconds >= warningThresholdSeconds && !showWarningModal) {
        setShowWarningModal(true);
      }
    }, 5000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [userRole, warningThresholdSeconds, totalTimeoutSeconds, showWarningModal]);

  // Warning countdown tick
  useEffect(() => {
    if (showWarningModal) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current as NodeJS.Timeout);
            handleForceLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [showWarningModal]);

  return (
    <InactivityTimerContext.Provider value={{ resetTimer }}>
      {children}

      {/* Auto-Logout Inactivity Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex select-text items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                Session Expiry Warning
              </h3>
              <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
                You have been inactive. For healthcare governance security, your session will expire
                in:
              </p>
            </div>

            <div className="py-2">
              <span className="font-mono text-3xl font-extrabold tracking-wider text-amber-600 dark:text-amber-400">
                {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")}
              </span>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={resetTimer}
                className="flex flex-1 items-center justify-center space-x-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Stay Logged In</span>
              </button>

              <button
                onClick={handleForceLogout}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </InactivityTimerContext.Provider>
  );
}
