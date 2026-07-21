import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Metadata } from "next";
import Link from "next/link";
import { Clock, Tag, ArrowRight, MapPin, Phone, ShieldCheck } from "lucide-react";

export const revalidate = 0;

interface CategoryBookingPageProps {
  params: {
    pharmacySlug: string;
    categorySlug: string;
  };
}

export async function generateMetadata({ params }: CategoryBookingPageProps): Promise<Metadata> {
  const { pharmacySlug, categorySlug } = params;

  let pharmacy = null;
  let category = null;

  try {
    const res = await Promise.all([
      db.pharmacy.findUnique({
        where: { slug: pharmacySlug },
      }),
      db.category.findUnique({
        where: { slug: categorySlug, deleted: false },
      }),
    ]);
    pharmacy = res[0];
    category = res[1];
  } catch (err) {
    console.error("Category metadata DB error:", err);
  }

  if (!pharmacy || !category) return {};

  const name = pharmacy.displayName || pharmacy.name;
  return {
    title: `Book ${category.name} Services at ${name} — NextDoorClinic`,
    description: `Book your ${category.name} appointments online with ${name}. ${category.description || ""}. Located at ${pharmacy.address}.`,
    alternates: {
      canonical: `https://booking.nextdoorclinic.co.uk/book/${pharmacySlug}/${categorySlug}`,
    },
    openGraph: {
      title: `Book ${category.name} at ${name}`,
      description: `Book your ${category.name} appointments online with ${name}.`,
      images: pharmacy.logoUrl ? [{ url: pharmacy.logoUrl }] : [],
    },
  };
}

export default async function CategoryBookingPage({ params }: CategoryBookingPageProps) {
  const { pharmacySlug, categorySlug } = params;

  let settings = null;
  let pharmacy = null;
  let category = null;

  try {
    // Maintenance mode guard
    settings = await db.systemSetting.findFirst();
    if (settings?.isMaintenanceMode) {
      const session = await auth();
      const isAdmin =
        session?.user?.role === "super_admin" || session?.user?.role === "platform_admin";
      if (!isAdmin) {
        redirect("/maintenance");
      }
    }

    // Fetch pharmacy and category
    const res = await Promise.all([
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
    ]);
    pharmacy = res[0];
    category = res[1];
  } catch (err) {
    console.error("CategoryBookingPage DB error:", err);
  }

  if (!pharmacy || !category) {
    notFound();
  }

  if (pharmacy.status !== "APPROVED") {
    redirect(`/book/${pharmacySlug}/suspended`);
  }

  // Filter services belonging to this category
  const categoryServices = pharmacy.services.filter((s) => s.categoryId === category.id);

  const pharmacyName = pharmacy.displayName || pharmacy.name;
  const brandColor = pharmacy.brandColor || "#10B981"; // Default Teal brand color

  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: pharmacyName,
    logo: pharmacy.logoUrl || undefined,
    image: pharmacy.logoUrl || undefined,
    telephone: pharmacy.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: pharmacy.address,
      addressCountry: "GB",
    },
    healthcareService: categoryServices.map((s) => ({
      "@type": "HealthcareService",
      name: s.name,
      serviceType: category.name,
      description: s.description || undefined,
      offers: {
        "@type": "Offer",
        price: Number(s.price),
        priceCurrency: "GBP",
      },
    })),
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
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans dark:bg-zinc-950">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Brand Color Top Border Accent */}
      <div className="h-1.5 w-full" style={{ backgroundColor: brandColor }} />

      <div className="mx-auto max-w-4xl space-y-6 px-4 pt-8">
        {/* Navigation Breadcrumb */}
        <nav className="text-slate-450 flex items-center space-x-2 text-xs font-semibold dark:text-zinc-500">
          <Link
            href={`/book/${pharmacySlug}`}
            className="hover:text-slate-700 dark:hover:text-zinc-300"
          >
            {pharmacyName}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-200">{category.name}</span>
        </nav>

        {/* Pharmacy Header Profile (Flat row - No Card) */}
        <div className="dark:border-zinc-850 flex flex-col items-start justify-between gap-6 rounded-lg border border-slate-200/80 bg-white p-6 dark:bg-zinc-950 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-4">
            {pharmacy.logoUrl ? (
              <img
                src={pharmacy.logoUrl}
                alt={pharmacyName}
                className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 bg-white object-contain dark:border-zinc-900"
              />
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold uppercase text-white"
                style={{ backgroundColor: brandColor }}
              >
                {pharmacyName.substring(0, 2)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-black leading-tight text-slate-900 dark:text-white">
                {pharmacyName}
              </h1>
              <div className="mt-1 flex flex-col gap-1 text-xs text-slate-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:gap-4">
                <span className="flex items-center">
                  <MapPin className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{pharmacy.address}</span>
                </span>
                {pharmacy.phone && (
                  <span className="flex items-center">
                    <Phone className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{pharmacy.phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href={`/book/${pharmacySlug}`}
            className="dark:border-zinc-850 w-full shrink-0 rounded border border-slate-200 px-3 py-2 text-center text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 dark:bg-zinc-900 dark:text-slate-300 dark:hover:bg-zinc-800 sm:w-auto"
          >
            View All Services
          </Link>
        </div>

        {/* Category Description Banner (Flat panel) */}
        <div
          className="dark:border-zinc-850 border-l-4 border-slate-200/80 bg-white p-5 dark:bg-zinc-950"
          style={{ borderLeftColor: brandColor }}
        >
          <span
            className="rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
            style={{ backgroundColor: brandColor }}
          >
            {category.name}
          </span>
          <h2 className="mt-2 text-base font-extrabold text-slate-800 dark:text-slate-200">
            Clinical booking for {category.name}
          </h2>
          {category.description && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
              {category.description}
            </p>
          )}
        </div>

        {/* Services Directory List */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Available Treatments ({categoryServices.length})
          </h3>

          {categoryServices.length === 0 ? (
            <div className="dark:border-zinc-850 rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center dark:bg-zinc-950">
              <p className="text-xs italic text-slate-400">
                No services are currently active in this category.
              </p>
              <Link
                href={`/book/${pharmacySlug}`}
                className="mt-3 inline-flex items-center space-x-1 text-xs font-bold"
                style={{ color: brandColor }}
              >
                <span>Browse general booking page</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {categoryServices.map((service) => (
                <div
                  key={service.id}
                  className="dark:border-zinc-850 flex flex-col gap-4 rounded-lg border border-slate-200/80 bg-white p-5 transition-all hover:border-slate-300 dark:bg-zinc-950 dark:hover:border-zinc-800 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {service.name}
                      </h4>
                      {service.duration && (
                        <span className="inline-flex items-center rounded bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-zinc-900">
                          <Clock className="mr-1 h-3 w-3 shrink-0" />
                          <span>{service.duration} mins</span>
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="max-w-2xl text-xs leading-normal text-slate-500 dark:text-zinc-400">
                        {service.description}
                      </p>
                    )}
                    {service.prepNotes && (
                      <div className="flex items-start space-x-1 pt-1 text-[10px] font-medium text-amber-600 dark:text-amber-500">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>Pre-appointment: {service.prepNotes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-6 border-t border-slate-50 pt-3 dark:border-zinc-900 md:justify-end md:border-t-0 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Price
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        £{Number(service.price).toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={
                        service.serviceSlug
                          ? `/book/${pharmacySlug}/${categorySlug}/${service.serviceSlug}`
                          : `/book/${pharmacySlug}?serviceId=${service.id}`
                      }
                      className="inline-flex select-none items-center justify-center rounded px-4 py-2.5 text-xs font-black text-white transition-all"
                      style={{ backgroundColor: brandColor }}
                    >
                      <span>Book Appointment</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
