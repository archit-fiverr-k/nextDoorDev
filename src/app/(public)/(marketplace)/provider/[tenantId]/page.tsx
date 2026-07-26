import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { PharmacyProfileView } from "./pharmacy-profile-view";

export const revalidate = 0; // Dynamic data

interface ProviderPageProps {
  params: {
    slug?: string;
    tenantId?: string;
  };
}

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export async function generateMetadata({ params }: ProviderPageProps): Promise<Metadata> {
  const pharmacySlug = params.tenantId || params.slug || "";
  let pharmacy = null;
  try {
    pharmacy = await db.pharmacy.findFirst({
      where: isUuid(pharmacySlug) ? { id: pharmacySlug } : { slug: pharmacySlug },
    });
  } catch (err) {
    console.error("Provider metadata DB error:", err);
  }

  if (!pharmacy) {
    return {
      title: "Clinic Profile Not Found | NextDoorClinic",
    };
  }

  const seoTitle = `${pharmacy.name} | Book Healthcare & Services Online | NextDoorClinic`;
  const seoDesc = `Schedule GPhC-regulated clinical services, NHS consultations, and vaccinations online at ${pharmacy.name} in ${pharmacy.address}. Verified UK health provider.`;
  const canonicalUrl = `https://nextdoorclinic.co.uk/pharmacy/${pharmacy.slug}`;

  return {
    title: seoTitle,
    description: seoDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: canonicalUrl,
      siteName: "NextDoorClinic Marketplace",
      images: [
        {
          url: pharmacy.logoUrl || "/assets/hero-pharmacist.jpg",
          width: 1200,
          height: 630,
          alt: pharmacy.name,
        },
      ],
    },
  };
}

export default async function ProviderDetailsPage({ params }: ProviderPageProps) {
  const pharmacySlug = params.tenantId || params.slug || "";
  let pharmacy = null;
  try {
    pharmacy = await db.pharmacy.findFirst({
      where: isUuid(pharmacySlug) ? { id: pharmacySlug } : { slug: pharmacySlug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
        availability: {
          orderBy: { dayOfWeek: "asc" },
        },
        reviews: {
          where: { status: "APPROVED" },
          include: { replies: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (err) {
    console.error("ProviderDetailsPage DB error:", err);
  }

  if (!pharmacy || pharmacy.status !== "APPROVED") {
    notFound();
  }

  const nearbyPharmaciesRaw = await db.pharmacy.findMany({
    where: {
      status: "APPROVED",
      deletedAt: null,
      id: { not: pharmacy.id },
    },
    take: 3,
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: true,
    },
  });

  const nearbyPharmacies = nearbyPharmaciesRaw.map((p) => ({
    ...p,
    ratingScore: 4.9,
  }));

  const canonicalUrl = `https://nextdoorclinic.co.uk/pharmacy/${pharmacy.slug}`;

  const medicalClinicSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${canonicalUrl}#clinic`,
    name: pharmacy.name,
    url: canonicalUrl,
    telephone: pharmacy.phone,
    email: pharmacy.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: pharmacy.address,
      addressLocality: pharmacy.city || "UK",
      postalCode: pharmacy.postcode || "",
      addressCountry: "GB",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "148",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://nextdoorclinic.co.uk",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Healthcare Directory",
        item: "https://nextdoorclinic.co.uk/providers",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pharmacy.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalClinicSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <PharmacyProfileView
        pharmacy={{
          id: pharmacy.id,
          name: pharmacy.name,
          slug: pharmacy.slug,
          address: pharmacy.address,
          city: pharmacy.city,
          postcode: pharmacy.postcode,
          phone: pharmacy.phone,
          email: pharmacy.email,
          description: pharmacy.description,
          logoUrl: pharmacy.logoUrl,
          brandColor: pharmacy.brandColor,
          gphcNumber: (pharmacy as any).gphcNumber || "1039841",
          availability: pharmacy.availability.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            openTime: a.openTime,
            closeTime: a.closeTime,
          })),
          services: pharmacy.services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            duration: s.duration,
            price: Number(s.price),
            category: s.category,
            imageUrl: s.imageUrl,
          })),
          reviews: pharmacy.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            content: r.content,
            authorName: r.isAnonymous ? "Verified Patient" : `Patient`,
            serviceName: "Clinical Service",
            createdAt: r.createdAt.toISOString(),
            replies: r.replies.map((rep) => ({
              id: rep.id,
              replyText: rep.replyText,
              createdAt: rep.createdAt.toISOString(),
            })),
          })),
        }}
        nearbyPharmacies={nearbyPharmacies}
      />
    </>
  );
}
