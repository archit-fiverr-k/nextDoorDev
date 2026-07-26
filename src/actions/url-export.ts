"use server";

import { db } from "@/lib/db";

export interface UrlExportOptions {
  includeMainPages: boolean;
  includeCategories: boolean;
  includeServices: boolean;
  includeReviewsUrl: boolean;
  includeContactUrl: boolean;
  includeBookingUrl: boolean;
  includeSeoData: boolean;
  wordpressMode: boolean;
  format: "TXT" | "CSV" | "JSON";
}

export interface ValidationWarning {
  type:
    | "DUPLICATE_SLUG"
    | "UNCATEGORIZED_SERVICE"
    | "MISSING_SERVICE"
    | "INVALID_URL"
    | "MISSING_METADATA";
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  item?: string;
}

export interface PharmacyExportData {
  pharmacy: {
    id: string;
    name: string;
    slug: string;
    baseUrl: string;
    bookingUrl: string;
    email: string;
    phone: string;
    address: string;
  };
  totals: {
    categoriesCount: number;
    servicesCount: number;
    publicPagesCount: number;
    totalUrlsCount: number;
  };
  validationWarnings: ValidationWarning[];
  mainPages: { title: string; path: string; url: string; seoTitle: string; seoDesc: string }[];
  categories: {
    name: string;
    slug: string;
    url: string;
    servicesCount: number;
    seoTitle: string;
    seoDesc: string;
  }[];
  services: {
    name: string;
    slug: string;
    categoryName: string;
    categorySlug: string;
    url: string;
    price: number;
    duration: number;
    seoTitle: string;
    seoDesc: string;
  }[];
  wordpressTree: string;
  txtOutput: string;
  csvOutput: string;
  jsonOutput: any;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getPharmacyUrlExportData(
  pharmacyId: string,
  options?: Partial<UrlExportOptions>
): Promise<PharmacyExportData> {
  const opts: UrlExportOptions = {
    includeMainPages: options?.includeMainPages ?? true,
    includeCategories: options?.includeCategories ?? true,
    includeServices: options?.includeServices ?? true,
    includeReviewsUrl: options?.includeReviewsUrl ?? true,
    includeContactUrl: options?.includeContactUrl ?? true,
    includeBookingUrl: options?.includeBookingUrl ?? true,
    includeSeoData: options?.includeSeoData ?? false,
    wordpressMode: options?.wordpressMode ?? false,
    format: options?.format ?? "TXT",
  };

  const pharmacy = await db.pharmacy.findUnique({
    where: { id: pharmacyId },
    include: {
      services: {
        where: { status: "ACTIVE" },
        include: { serviceCategory: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!pharmacy) {
    throw new Error(`Pharmacy not found for ID: ${pharmacyId}`);
  }

  const allCategories = await db.category.findMany({
    where: { status: "ACTIVE", deleted: false },
    orderBy: { name: "asc" },
  });

  const baseUrl = `https://booking.nextdoorclinic.co.uk/${pharmacy.slug}`;
  const bookingUrl = `${baseUrl}/book`;

  // 1. Validation Checks
  const warnings: ValidationWarning[] = [];
  const serviceSlugsSeen = new Set<string>();
  const categorySlugsSeen = new Set<string>();

  allCategories.forEach((cat: { id: string; name: string; slug: string }) => {
    const cSlug = cat.slug || slugify(cat.name);
    if (categorySlugsSeen.has(cSlug)) {
      warnings.push({
        type: "DUPLICATE_SLUG",
        severity: "HIGH",
        message: `Duplicate category slug found: "${cSlug}" in category "${cat.name}"`,
        item: cat.name,
      });
    } else {
      categorySlugsSeen.add(cSlug);
    }
  });

  pharmacy.services.forEach(
    (svc: {
      name: string;
      serviceSlug?: string | null;
      category?: string | null;
      categoryId?: string | null;
    }) => {
      const sSlug = svc.serviceSlug || slugify(svc.name);
      if (serviceSlugsSeen.has(sSlug)) {
        warnings.push({
          type: "DUPLICATE_SLUG",
          severity: "HIGH",
          message: `Duplicate service slug found: "${sSlug}" in service "${svc.name}"`,
          item: svc.name,
        });
      } else {
        serviceSlugsSeen.add(sSlug);
      }

      if (!svc.category && !svc.categoryId) {
        warnings.push({
          type: "UNCATEGORIZED_SERVICE",
          severity: "MEDIUM",
          message: `Service "${svc.name}" is not assigned to any category`,
          item: svc.name,
        });
      }
    }
  );

  allCategories.forEach((cat: { id: string; name: string }) => {
    const serviceCount = pharmacy.services.filter(
      (s: { categoryId?: string | null; category?: string | null }) =>
        s.categoryId === cat.id || s.category === cat.name
    ).length;
    if (serviceCount === 0) {
      warnings.push({
        type: "MISSING_SERVICE",
        severity: "LOW",
        message: `Category "${cat.name}" has 0 active services attached`,
        item: cat.name,
      });
    }
  });

  // 2. Main Pages Setup
  const mainPages = [
    {
      title: "Home",
      path: "/",
      url: `${baseUrl}/`,
      seoTitle: `${pharmacy.name} | Home`,
      seoDesc: `Welcome to ${pharmacy.name} official clinic portal.`,
    },
    {
      title: "About",
      path: "/about",
      url: `${baseUrl}/about`,
      seoTitle: `About ${pharmacy.name}`,
      seoDesc: `Learn about ${pharmacy.name}'s clinical care and healthcare team.`,
    },
    {
      title: "Services",
      path: "/services",
      url: `${baseUrl}/services`,
      seoTitle: `Clinical Services | ${pharmacy.name}`,
      seoDesc: `View all available healthcare treatments and consultations.`,
    },
  ];

  if (opts.includeReviewsUrl) {
    mainPages.push({
      title: "Reviews",
      path: "/reviews",
      url: `${baseUrl}/reviews`,
      seoTitle: `Patient Reviews | ${pharmacy.name}`,
      seoDesc: `Read verified patient reviews for ${pharmacy.name}.`,
    });
  }
  if (opts.includeContactUrl) {
    mainPages.push({
      title: "Contact",
      path: "/contact",
      url: `${baseUrl}/contact`,
      seoTitle: `Contact Us | ${pharmacy.name}`,
      seoDesc: `Get in touch with ${pharmacy.name} clinic team.`,
    });
  }
  mainPages.push(
    {
      title: "Privacy Policy",
      path: "/privacy-policy",
      url: `${baseUrl}/privacy-policy`,
      seoTitle: `Privacy Policy | ${pharmacy.name}`,
      seoDesc: `Patient data privacy and GDPR compliance policy.`,
    },
    {
      title: "Terms",
      path: "/terms",
      url: `${baseUrl}/terms`,
      seoTitle: `Terms of Service | ${pharmacy.name}`,
      seoDesc: `Clinic terms and booking conditions.`,
    }
  );
  if (opts.includeBookingUrl) {
    mainPages.push({
      title: "Booking",
      path: "/book",
      url: bookingUrl,
      seoTitle: `Book Appointment | ${pharmacy.name}`,
      seoDesc: `Instant online appointment booking engine.`,
    });
  }

  // 3. Categories Setup
  const categoriesData = allCategories.map((cat: { id: string; name: string; slug: string }) => {
    const cSlug = cat.slug || slugify(cat.name);
    const servicesCount = pharmacy.services.filter(
      (s: { categoryId?: string | null; category?: string | null }) =>
        s.categoryId === cat.id || s.category === cat.name
    ).length;
    return {
      name: cat.name,
      slug: cSlug,
      url: `${baseUrl}/${cSlug}`,
      servicesCount,
      seoTitle: `${cat.name} Services | ${pharmacy.name}`,
      seoDesc: `Book ${cat.name} consultations and treatments online at ${pharmacy.name}.`,
    };
  });

  // 4. Services Setup
  const servicesData = pharmacy.services.map((svc: any) => {
    const sSlug = svc.serviceSlug || slugify(svc.name);
    const cat = allCategories.find(
      (c: { id: string; name: string }) => c.id === svc.categoryId || c.name === svc.category
    );
    const catName = cat ? cat.name : svc.category || "General";
    const catSlug = cat ? cat.slug || slugify(cat.name) : slugify(catName);

    return {
      name: svc.name,
      slug: sSlug,
      categoryName: catName,
      categorySlug: catSlug,
      url: `${baseUrl}/${catSlug}/${sSlug}`,
      price: Number(svc.price),
      duration: svc.duration,
      seoTitle: `${svc.name} | ${pharmacy.name}`,
      seoDesc: `Book ${svc.name} for £${Number(svc.price).toFixed(2)} at ${pharmacy.name}.`,
    };
  });

  // Totals
  const totals = {
    categoriesCount: categoriesData.length,
    servicesCount: servicesData.length,
    publicPagesCount: mainPages.length,
    totalUrlsCount: mainPages.length + categoriesData.length + servicesData.length,
  };

  // 5. WordPress Tree Generator
  let wpTree = `Home\n`;
  mainPages
    .filter((p: { path: string }) => p.path !== "/")
    .forEach((p: { title: string; path: string }) => {
      if (p.path === "/services") {
        wpTree += `├── Services\n`;
        categoriesData.forEach((cat: { name: string; slug: string }) => {
          wpTree += `│   ├── ${cat.name}\n`;
          const catServices = servicesData.filter(
            (s: { categorySlug: string }) => s.categorySlug === cat.slug
          );
          catServices.forEach((s: { name: string }) => {
            wpTree += `│   │   ├── ${s.name}\n`;
          });
        });
      } else {
        wpTree += `├── ${p.title}\n`;
      }
    });

  // 6. TXT Generator matching exact user template
  const dateStr = new Date().toISOString().split("T")[0];
  let txtOutput = `--------------------------------------------------\n`;
  txtOutput += `${pharmacy.name}\n`;
  txtOutput += `Slug\n${pharmacy.slug}\n`;
  txtOutput += `Booking Base URL\n${baseUrl}\n`;
  txtOutput += `==================================================\n`;
  txtOutput += `MAIN PAGES\n`;
  mainPages.forEach((p: { title: string; path: string }) => {
    txtOutput += `${p.title}\n${p.path}\n`;
  });
  txtOutput += `==================================================\n`;
  txtOutput += `CATEGORIES\n`;
  categoriesData.forEach((cat: { name: string; url: string }) => {
    txtOutput += `${cat.name}\n${cat.url}\n`;
  });
  txtOutput += `==================================================\n`;
  txtOutput += `SERVICES\n`;
  servicesData.forEach((svc: { name: string; url: string }) => {
    txtOutput += `${svc.name}\n${svc.url}\n`;
  });
  txtOutput += `==================================================\n`;
  txtOutput += `TOTALS\n`;
  txtOutput += `Categories\n${totals.categoriesCount}\n`;
  txtOutput += `Services\n${totals.servicesCount}\n`;
  txtOutput += `Public Pages\n${totals.publicPagesCount}\n`;
  txtOutput += `Total URLs\n${totals.totalUrlsCount}\n`;
  txtOutput += `==================================================\n`;
  txtOutput += `Generated\n${dateStr}\n`;
  txtOutput += `--------------------------------------------------\n`;

  // 7. CSV Generator
  const csvRows = [
    ["Page Type", "Title", "URL", "Category", "Price", "Meta Title", "Meta Description"],
    ...mainPages.map((p: { title: string; url: string; seoTitle: string; seoDesc: string }) => [
      "Main Page",
      p.title,
      p.url,
      "-",
      "-",
      p.seoTitle,
      p.seoDesc,
    ]),
    ...categoriesData.map((c: { name: string; url: string; seoTitle: string; seoDesc: string }) => [
      "Category",
      c.name,
      c.url,
      c.name,
      "-",
      c.seoTitle,
      c.seoDesc,
    ]),
    ...servicesData.map(
      (s: {
        name: string;
        url: string;
        categoryName: string;
        price: number;
        seoTitle: string;
        seoDesc: string;
      }) => [
        "Service",
        s.name,
        s.url,
        s.categoryName,
        `£${s.price.toFixed(2)}`,
        s.seoTitle,
        s.seoDesc,
      ]
    ),
  ];
  const csvOutput = csvRows
    .map((row: string[]) =>
      row.map((field: string) => `"${String(field).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  // 8. JSON Generator
  const jsonOutput = {
    pharmacy: {
      name: pharmacy.name,
      slug: pharmacy.slug,
      baseUrl,
      bookingUrl,
    },
    totals,
    mainPages,
    categories: categoriesData,
    services: servicesData,
    wordpressTree: wpTree,
    generatedAt: dateStr,
  };

  return {
    pharmacy: {
      id: pharmacy.id,
      name: pharmacy.name,
      slug: pharmacy.slug,
      baseUrl,
      bookingUrl,
      email: pharmacy.email,
      phone: pharmacy.phone,
      address: pharmacy.address,
    },
    totals,
    validationWarnings: warnings,
    mainPages,
    categories: categoriesData,
    services: servicesData,
    wordpressTree: wpTree,
    txtOutput,
    csvOutput,
    jsonOutput,
  };
}

export async function getBulkPharmacyUrlExportData(
  pharmacyIds?: string[]
): Promise<PharmacyExportData[]> {
  let pharmacies: { id: string }[] = [];
  if (pharmacyIds && pharmacyIds.length > 0) {
    pharmacies = await db.pharmacy.findMany({
      where: { id: { in: pharmacyIds } },
      select: { id: true },
    });
  } else {
    pharmacies = await db.pharmacy.findMany({
      where: { status: "APPROVED", deletedAt: null },
      select: { id: true },
    });
  }

  const results: PharmacyExportData[] = [];
  for (const p of pharmacies) {
    const data = await getPharmacyUrlExportData(p.id);
    results.push(data);
  }

  return results;
}
