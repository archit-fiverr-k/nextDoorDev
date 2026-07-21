import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import { ServiceBookingView } from "./service-booking-view";

export const revalidate = 0;

interface ServiceBookingPageProps {
  params: {
    pharmacySlug: string;
    categorySlug: string;
    serviceSlug: string;
  };
}

export async function generateMetadata({ params }: ServiceBookingPageProps): Promise<Metadata> {
  const { pharmacySlug, categorySlug, serviceSlug } = params;

  const [pharmacy, category, service] = await Promise.all([
    db.pharmacy.findUnique({
      where: { slug: pharmacySlug },
    }),
    db.category.findUnique({
      where: { slug: categorySlug, deleted: false },
    }),
    db.service.findFirst({
      where: {
        serviceSlug: serviceSlug,
        pharmacy: { slug: pharmacySlug },
        isActive: true,
      },
    }),
  ]);

  if (!pharmacy || !category || !service) return {};

  const name = pharmacy.displayName || pharmacy.name;
  return {
    title: `${service.name} at ${name} — NHS & Private Clinic`,
    description: `Book your ${service.name} appointment online with ${name} under ${category.name}. Duration: ${service.duration} mins. Price: £${Number(service.price).toFixed(2)}. Certified GPhC premises.`,
    alternates: {
      canonical: `https://booking.nextdoorclinic.co.uk/book/${pharmacySlug}/${categorySlug}/${serviceSlug}`,
    },
    openGraph: {
      title: `${service.name} at ${name} — NHS & Private Clinic`,
      description: `Book your ${service.name} appointment online with ${name}.`,
      images: pharmacy.logoUrl ? [{ url: pharmacy.logoUrl }] : [],
    },
  };
}

export default async function ServiceBookingPage({ params }: ServiceBookingPageProps) {
  const { pharmacySlug, categorySlug, serviceSlug } = params;

  // Maintenance mode guard
  const settings = await db.systemSetting.findFirst();
  if (settings?.isMaintenanceMode) {
    const session = await auth();
    const isAdmin =
      session?.user?.role === "super_admin" || session?.user?.role === "platform_admin";
    if (!isAdmin) {
      redirect("/maintenance");
    }
  }

  // Fetch pharmacy, category, and service
  const [pharmacy, category, service] = await Promise.all([
    db.pharmacy.findUnique({
      where: { slug: pharmacySlug },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    }),
    db.category.findUnique({
      where: { slug: categorySlug, deleted: false },
    }),
    db.service.findFirst({
      where: {
        serviceSlug: serviceSlug,
        pharmacy: { slug: pharmacySlug },
        isActive: true,
      },
    }),
  ]);

  if (!pharmacy || !category || !service) {
    notFound();
  }

  if (pharmacy.status !== "APPROVED") {
    redirect(`/book/${pharmacySlug}/suspended`);
  }

  const sanitizedServices = pharmacy.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration: s.duration,
    price: Number(s.price),
    isActive: s.isActive,
    prepNotes: s.prepNotes,
    instructions: s.instructions,
  }));

  const sanitizedPharmacy = {
    id: pharmacy.id,
    name: pharmacy.name,
    slug: pharmacy.slug,
    logoUrl: pharmacy.logoUrl,
    brandColor: pharmacy.brandColor,
    displayName: pharmacy.displayName,
    address: pharmacy.address,
    phone: pharmacy.phone,
  };

  // Get current patient user session if authenticated
  const session = await auth();
  let currentUser = null;
  if (session?.user && session.user.role === "patient") {
    const customer = await db.customer.findUnique({
      where: { id: session.user.id },
    });
    if (customer) {
      currentUser = {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      };
    }
  }

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: pharmacy.displayName || pharmacy.name,
    logo: pharmacy.logoUrl || undefined,
    image: pharmacy.logoUrl || undefined,
    telephone: pharmacy.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: pharmacy.address,
      addressCountry: "GB",
    },
    healthcareService: {
      "@type": "HealthcareService",
      name: service.name,
      serviceType: category.name,
      description: service.description || undefined,
      offers: {
        "@type": "Offer",
        price: Number(service.price),
        priceCurrency: "GBP",
      },
    },
  };

  // Breadcrumbs Schema.org
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Bookings",
        item: `https://booking.nextdoorclinic.co.uk/book/${pharmacySlug}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `https://booking.nextdoorclinic.co.uk/book/${pharmacySlug}/${categorySlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.name,
        item: `https://booking.nextdoorclinic.co.uk/book/${pharmacySlug}/${categorySlug}/${serviceSlug}`,
      },
    ],
  };

  return (
    <>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ServiceBookingView
        pharmacy={sanitizedPharmacy}
        category={category}
        service={service}
        servicesList={sanitizedServices}
        currentUser={currentUser}
        pharmacySlug={pharmacySlug}
        categorySlug={categorySlug}
        serviceSlug={serviceSlug}
      />
    </>
  );
}
