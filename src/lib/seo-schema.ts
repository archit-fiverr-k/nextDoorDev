/**
 * NextDoorClinic Automated Local SEO & Schema.org JSON-LD Generator
 * Produces structured data for Google Search indexing of UK independent pharmacies & clinical services.
 */

export interface PharmacySchemaParams {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  gphcNumber?: string;
  url?: string;
  imageUrl?: string;
  ratingValue?: number;
  reviewCount?: number;
  services?: { name: string; description?: string; price?: number }[];
}

export function generatePharmacyJsonLd(params: PharmacySchemaParams) {
  const {
    name,
    description = "Regulated UK Independent Pharmacy & Private Healthcare Clinic",
    address,
    city,
    postcode,
    phone,
    email,
    gphcNumber,
    url = "https://next-door-dev.vercel.app",
    imageUrl,
    ratingValue = 4.9,
    reviewCount = 120,
    services = [],
  } = params;

  const schema = {
    "@context": "https://schema.org",
    "@type": ["Pharmacy", "MedicalBusiness"],
    "@id": `${url}#pharmacy`,
    name,
    description,
    url,
    telephone: phone || "+44 20 7946 0912",
    email: email || "info@nextdoorclinic.co.uk",
    logo: imageUrl || `${url}/assets/ndc-logo.png`,
    image: imageUrl || `${url}/assets/pharmacy_hero.png`,
    priceRange: "££",
    ...(gphcNumber
      ? { identifier: { "@type": "PropertyValue", name: "GPhC Premises", value: gphcNumber } }
      : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: address || "High Street",
      addressLocality: city || "London",
      postalCode: postcode || "W1D 1BS",
      addressCountry: "GB",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
      bestRating: "5",
      worstRating: "1",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Clinical Pharmacy Services",
      itemListElement: services.map((s, i) => ({
        "@type": "OfferCatalog",
        name: s.name,
        description: s.description || s.name,
        price: s.price || 0,
        priceCurrency: "GBP",
      })),
    },
  };

  return JSON.stringify(schema);
}

export function generateServiceJsonLd(
  serviceName: string,
  servicePrice: number,
  durationMinutes: number,
  pharmacyName: string
) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: serviceName,
    procedureType: "Clinical Examination",
    howPerformed: `Private clinical consultation at ${pharmacyName}`,
    offers: {
      "@type": "Offer",
      price: servicePrice,
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
    },
  });
}
