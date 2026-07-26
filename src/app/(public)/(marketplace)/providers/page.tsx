import React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProvidersDirectoryView } from "./providers-directory-view";

export const revalidate = 0; // Dynamic database listings

export const metadata: Metadata = {
  title: "Find & Book Local Pharmacies & Healthcare Clinics | NextDoorClinic",
  description:
    "Compare and search verified independent pharmacies and clinical centers across the United Kingdom. Check GPhC and CQC compliance, filter by clinical services, and book online.",
};

interface ProvidersPageProps {
  searchParams: {
    query?: string;
    location?: string;
  };
}

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const query = searchParams.query || "";
  const location = searchParams.location || "";

  let pharmacies: any[] = [];
  try {
    const rawPharmacies = await db.pharmacy.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
      },
      include: {
        services: {
          where: { isActive: true },
          take: 3,
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            category: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    pharmacies = rawPharmacies.map((p) => ({
      ...p,
      services: p.services.map((s) => ({
        ...s,
        price: Number(s.price),
      })),
    }));
  } catch (err) {
    console.error("ProvidersPage DB query error:", err);
  }

  return (
    <ProvidersDirectoryView
      pharmacies={pharmacies}
      initialQuery={query}
      initialLocation={location}
    />
  );
}
