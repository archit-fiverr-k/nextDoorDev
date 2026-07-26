import React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LandingPageView } from "./landing-page-view";

export const revalidate = 0; // Dynamic database loading
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find & Book Local Healthcare Services in the UK | NextDoorClinic",
  description:
    "Book same-day clinical appointments with GPhC-regulated independent pharmacies and healthcare centers. Ear wax removal, travel vaccines, blood tests & NHS Pharmacy First.",
};

export default async function HomePage() {
  let approvedProviders: any[] = [];
  try {
    approvedProviders = await db.pharmacy.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
      },
      include: {
        services: {
          where: {
            isActive: true,
          },
          take: 3,
        },
      },
      take: 6,
    });
  } catch (err) {
    console.error("Database connection notice on homepage:", err);
  }

  return <LandingPageView approvedProviders={approvedProviders} />;
}
