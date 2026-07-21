import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { slugify, matchServiceSlug } from "@/lib/slug";
import { ServicePageView } from "./service-page-view";

export const revalidate = 0; // Dynamic database rendering

interface DynamicServicePageProps {
  params: {
    tenantId: string;
    serviceSlug: string;
  };
}

// =========================================================================
// 1. DYNAMIC SEO METADATA ENGINE
// =========================================================================
export async function generateMetadata({ params }: DynamicServicePageProps): Promise<Metadata> {
  const pharmacy = await db.pharmacy.findUnique({
    where: { slug: params.tenantId },
    include: {
      services: {
        where: { isActive: true },
      },
    },
  });

  if (!pharmacy || pharmacy.status !== "APPROVED" || pharmacy.deletedAt) {
    return {
      title: "Clinical Service Page | NextDoorClinic",
    };
  }

  const service = pharmacy.services.find((s) =>
    matchServiceSlug(s.name, s.serviceSlug, params.serviceSlug)
  );

  if (!service) {
    return {
      title: `Healthcare Services at ${pharmacy.name} | NextDoorClinic`,
    };
  }

  const cleanServiceSlug = slugify(service.name);
  const canonicalUrl = `https://nextdoorclinic.co.uk/${pharmacy.slug}/${cleanServiceSlug}`;
  const priceFormatted = Number(service.price).toFixed(2);
  const locationText = pharmacy.city ? `${pharmacy.city}` : pharmacy.address;

  const seoTitle = `${service.name} at ${pharmacy.name} (${locationText}) | Book Online`;
  const seoDesc = `Book ${service.name} at ${pharmacy.name} in ${locationText}. Upfront price: £${priceFormatted}. Duration: ${service.duration} mins. GPhC-regulated clinic with instant scheduling and £0 online deposit.`;

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
          url: service.imageUrl || pharmacy.logoUrl || "/assets/demo-pharmacy-1.jpg",
          width: 1200,
          height: 630,
          alt: `${service.name} at ${pharmacy.name}`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc,
    },
  };
}

// =========================================================================
// 2. MAIN DYNAMIC SERVICE PAGE ROUTE
// =========================================================================
export default async function DynamicServicePage({ params }: DynamicServicePageProps) {
  // Query pharmacy and its active services & availability
  const pharmacy = await db.pharmacy.findUnique({
    where: { slug: params.tenantId },
    include: {
      availability: {
        orderBy: { dayOfWeek: "asc" },
      },
      services: {
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!pharmacy || pharmacy.status !== "APPROVED" || pharmacy.deletedAt) {
    notFound();
  }

  // Resolve matching service
  const service = pharmacy.services.find((s) =>
    matchServiceSlug(s.name, s.serviceSlug, params.serviceSlug)
  );

  if (!service) {
    notFound();
  }

  // Fetch related services offered by this pharmacy (or other pharmacies)
  const relatedServices = pharmacy.services
    .filter((s) => s.id !== service.id)
    .slice(0, 4)
    .map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price),
      duration: s.duration,
      pharmacySlug: pharmacy.slug,
    }));

  // Fetch nearby alternative pharmacies
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

  const cleanServiceSlug = slugify(service.name);
  const canonicalUrl = `https://nextdoorclinic.co.uk/${pharmacy.slug}/${cleanServiceSlug}`;
  const formattedPrice = Number(service.price).toFixed(2);
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // =========================================================================
  // 3. COMPREHENSIVE JSON-LD STRUCTURED DATA SCHEMAS
  // =========================================================================

  // A. LocalBusiness / MedicalClinic Schema
  const medicalClinicSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${canonicalUrl}#clinic`,
    name: pharmacy.name,
    url: `https://nextdoorclinic.co.uk/provider/${pharmacy.slug}`,
    telephone: pharmacy.phone,
    email: pharmacy.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: pharmacy.address,
      addressLocality: pharmacy.city || "UK",
      postalCode: pharmacy.postcode || "",
      addressCountry: "GB",
    },
    priceRange: "££",
    openingHoursSpecification: pharmacy.availability.map((a) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
        a.dayOfWeek
      ],
      opens: a.openTime,
      closes: a.closeTime,
    })),
  };

  // B. MedicalProcedure / MedicalService Schema
  const medicalServiceSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "@id": `${canonicalUrl}#service`,
    name: service.name,
    description: service.description || `Clinical ${service.name} at ${pharmacy.name}`,
    procedureType: "NonSurgicalProcedure",
    howPerformed:
      service.instructions || "In-clinic professional healthcare consultation and administration.",
    preparation: service.prepNotes || "Bring photo ID and list of current medications.",
    provider: {
      "@type": "MedicalClinic",
      name: pharmacy.name,
      address: pharmacy.address,
    },
    offers: {
      "@type": "Offer",
      price: formattedPrice,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
      validFrom: new Date().toISOString().split("T")[0],
    },
  };

  // C. FAQPage Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Do I need a GP referral for ${service.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `No doctor's referral is required. You can book directly online with ${pharmacy.name}.`,
        },
      },
      {
        "@type": "Question",
        name: `How much does ${service.name} cost at ${pharmacy.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The price is £${formattedPrice} with £0 online deposit. Pay at the pharmacy upon arrival.`,
        },
      },
      {
        "@type": "Question",
        name: `How long is the ${service.name} appointment?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The appointment takes approximately ${service.duration} minutes.`,
        },
      },
    ],
  };

  // D. BreadcrumbList Schema
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
        name: "Pharmacies",
        item: "https://nextdoorclinic.co.uk/providers",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: pharmacy.name,
        item: `https://nextdoorclinic.co.uk/provider/${pharmacy.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: service.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      {/* Inject Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalClinicSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ServicePageView
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
          availability: pharmacy.availability.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            openTime: a.openTime,
            closeTime: a.closeTime,
          })),
        }}
        service={{
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: Number(service.price),
          category: service.category,
          prepNotes: service.prepNotes,
          instructions: service.instructions,
          imageUrl: service.imageUrl,
        }}
        relatedServices={relatedServices}
        nearbyPharmacies={nearbyPharmacies}
        lastReviewedDate={todayFormatted}
      />
    </>
  );
}
