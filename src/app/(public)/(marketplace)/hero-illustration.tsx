"use client";

import React from "react";

export function HeroIllustration() {
  return (
    <div className="relative flex w-full select-none items-center justify-center">
      {/* Background Soft Ambient Emerald Glow */}
      <div className="pointer-events-none absolute inset-0 scale-125 rounded-full bg-gradient-to-tr from-[#10B981]/25 via-teal-500/15 to-transparent blur-3xl" />

      {/* High-Definition Consultation Room Nurse Image - 40% Bigger */}
      <div className="relative flex w-full items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/hero-consultation-nurse.png"
          alt="NextDoorClinic Healthcare Nurse Consultation"
          className="lg:scale-115 h-auto max-h-[580px] w-full origin-center scale-105 object-contain sm:max-h-[640px] sm:scale-110 lg:max-h-[700px]"
        />
      </div>
    </div>
  );
}
