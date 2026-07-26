"use client";

import React, { useState } from "react";
import PatientSidebar from "./patient-sidebar";
import PatientHeader from "./patient-header";

interface PatientLayoutClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  children: React.ReactNode;
}

export function PatientLayoutClient({ user, children }: PatientLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans dark:bg-zinc-950">
      {/* Mobile Drawer (Only opened via mobile hamburger menu) */}
      <PatientSidebar user={user} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Top Navigation Header (Fiverr/Airbnb Style Desktop + Dedicated Mobile Header) */}
      <PatientHeader user={user} onOpenMobileSidebar={() => setMobileOpen(true)} />

      {/* Main Content Area - Full Browser Width */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
