import React from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ServiceDirectoryView } from "./service-directory-view";

export const revalidate = 0; // Dynamic database listings
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Service Directory | Search & Compare Healthcare Services | NextDoorClinic",
  description:
    "Discover local health checkups, flu vaccinations, microsuction ear wax removal, and travel clinic consultations. Compare prices and book appointments online.",
};

interface ServicesPageProps {
  searchParams: {
    query?: string;
    location?: string;
    category?: string;
  };
}

export default async function ServicesDirectoryPage({ searchParams }: ServicesPageProps) {
  const query = searchParams.query || "";
  const location = searchParams.location || "";

  let services: any[] = [];
  let categories: any[] = [];

  try {
    const [fetchedServices, fetchedCategories] = await Promise.all([
      db.service.findMany({
        where: {
          isActive: true,
          pharmacy: {
            status: "APPROVED",
            deletedAt: null,
          },
        },
        include: {
          pharmacy: {
            select: {
              name: true,
              slug: true,
              address: true,
              city: true,
              brandColor: true,
            },
          },
        },
        orderBy: {
          displayOrder: "asc",
        },
      }),
      db.category.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    services = fetchedServices.map((s) => ({
      ...s,
      price: Number(s.price),
    }));
    categories = fetchedCategories;
  } catch (err) {
    console.error("ServicesDirectoryPage DB error:", err);
  }

  return (
    <ServiceDirectoryView
      services={services}
      categories={categories}
      initialQuery={query}
      initialLocation={location}
    />
  );
}
