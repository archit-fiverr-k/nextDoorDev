import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { geocodeLocation, getDistanceMiles } from "@/lib/geocoding";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Extract Query Parameters
    const serviceParam = searchParams.get("service") || "";
    const locationParam = searchParams.get("postcode") || searchParams.get("location") || "";
    const latParam = searchParams.get("latitude");
    const lngParam = searchParams.get("longitude");
    const radiusMiles = parseFloat(searchParams.get("radius") || "10");
    const dateParam = searchParams.get("date") || "";
    const availabilityParam = searchParams.get("availability") || "";
    const nhsParam = searchParams.get("nhs") === "true";
    const privateParam = searchParams.get("private") === "true";
    const openNowParam = searchParams.get("openNow") === "true";
    const minPriceParam = parseFloat(searchParams.get("minPrice") || "0");
    const maxPriceParam = parseFloat(searchParams.get("maxPrice") || "500");
    const minRatingParam = parseFloat(searchParams.get("minRating") || "0");
    const sortParam = searchParams.get("sort") || "nearest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    // 2. Resolve Geolocation Coordinates
    let targetLat: number | null = latParam ? parseFloat(latParam) : null;
    let targetLng: number | null = lngParam ? parseFloat(lngParam) : null;
    let resolvedLocationName = locationParam;

    if ((targetLat === null || targetLng === null) && locationParam.trim()) {
      const geocoded = geocodeLocation(locationParam);
      if (geocoded) {
        targetLat = geocoded.lat;
        targetLng = geocoded.lng;
        resolvedLocationName = geocoded.name || locationParam;
      }
    }

    // Default fallback to Central London if no location provided
    if (targetLat === null || targetLng === null) {
      targetLat = 51.5074;
      targetLng = -0.1278;
      if (!resolvedLocationName) resolvedLocationName = "London";
    }

    // Word Boundary Helper for Token Matching
    const matchesWordBoundary = (text: string, term: string): boolean => {
      const cleanTerm = term.trim().toLowerCase();
      const cleanText = text.trim().toLowerCase();
      if (cleanTerm.length > 2) return cleanText.includes(cleanTerm);
      const regex = new RegExp(`\\b${cleanTerm}\\b`, "i");
      return regex.test(cleanText);
    };

    // 3. STEP 1: SERVICE FILTERING (Smart Token Matching)
    const cleanService = serviceParam.replace(/-/g, " ").trim();
    const rawTokens = cleanService
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(
        (t) => t.length >= 2 && !["service", "treatment", "private", "clinic", "check"].includes(t)
      );
    const searchTokens = rawTokens.length > 0 ? rawTokens : cleanService ? [cleanService] : [];

    // 4. Fetch Approved Pharmacies with Services & Ratings
    const pharmacies = await db.pharmacy.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
        ...(searchTokens.length > 0
          ? {
              services: {
                some: {
                  isActive: true,
                  OR: searchTokens.map((term) => ({
                    name: { contains: term, mode: "insensitive" },
                  })),
                },
              },
            }
          : {}),
      },
      include: {
        services: {
          where: {
            isActive: true,
          },
        },
        reviews: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
        availability: true,
        blockedDates: true,
      },
    });

    // Compute Europe/London current date, time, and day of week
    const now = new Date();
    const londonDateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" });
    const londonTimeFormatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const londonDayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/London",
      weekday: "short",
    });

    const londonDateStr = londonDateFormatter.format(now); // yyyy-mm-dd
    const londonTimeStr = londonTimeFormatter.format(now); // HH:mm
    const londonDayShort = londonDayFormatter.format(now);
    const shortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDayOfWeek = shortNames.indexOf(londonDayShort);

    // 5. Process & Calculate Distance, Ratings, and Availability for Each Pharmacy
    let processedPharmacies = pharmacies
      .map((pharmacy) => {
        // Calculate Haversine distance in miles
        let distanceMiles = locationParam && locationParam.trim() ? 999 : 0;
        if (
          pharmacy.latitude != null &&
          pharmacy.longitude != null &&
          targetLat != null &&
          targetLng != null
        ) {
          distanceMiles = Number(
            getDistanceMiles(targetLat, targetLng, pharmacy.latitude, pharmacy.longitude).toFixed(1)
          );
        }

        // Check if open now in Europe/London timezone & check BlockedDate
        const isBlockedToday = pharmacy.blockedDates.some((b) => {
          const blockedStr = new Date(b.date).toLocaleDateString("en-CA", {
            timeZone: "Europe/London",
          });
          return blockedStr === londonDateStr;
        });

        const todayAvailability = pharmacy.availability.find(
          (a) => a.dayOfWeek === currentDayOfWeek
        );
        let isOpenNow = false;
        if (!isBlockedToday && todayAvailability) {
          const { openTime, closeTime } = todayAvailability;
          if (closeTime >= openTime) {
            isOpenNow = londonTimeStr >= openTime && londonTimeStr <= closeTime;
          } else {
            // Overnight schedule
            isOpenNow = londonTimeStr >= openTime || londonTimeStr <= closeTime;
          }
        }

        // Calculate rating score & count
        const ratingCount = pharmacy.reviews.length;
        const ratingSum = pharmacy.reviews.reduce((acc, r) => acc + r.rating, 0);
        const ratingScore = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 4.9;

        // Find exact matched service using word-boundary search tokens
        const primaryService = cleanService
          ? pharmacy.services.find((s) => {
              return searchTokens.some((t) => matchesWordBoundary(s.name, t));
            }) || null
          : pharmacy.services[0] || null;

        // NO NAIVE FALLBACK: If service was requested and no token matched, exclude pharmacy
        if (cleanService && !primaryService) {
          return null;
        }

        const price = primaryService ? Number(primaryService.price) : 0;
        const duration = primaryService ? primaryService.duration : 15;
        const isNhs = primaryService?.category?.toLowerCase().includes("nhs") || false;

        // Earliest Appointment Slot Text
        const earliestAppointmentText = isOpenNow
          ? `Today • ${londonTimeStr}`
          : todayAvailability
            ? `Today • ${todayAvailability.openTime}`
            : `Tomorrow • 09:00 AM`;

        return {
          id: pharmacy.id,
          name: pharmacy.displayName || pharmacy.name,
          slug: pharmacy.slug || pharmacy.id,
          logoUrl: pharmacy.logoUrl,
          brandColor: pharmacy.brandColor,
          address: pharmacy.address,
          phone: pharmacy.phone,
          latitude: pharmacy.latitude,
          longitude: pharmacy.longitude,
          postcode: pharmacy.postcode,
          city: pharmacy.city,
          distanceMiles,
          isOpenNow,
          ratingScore,
          ratingCount,
          matchedService: primaryService
            ? {
                id: primaryService.id,
                name: primaryService.name,
                price,
                duration,
                category: primaryService.category || "Clinical Service",
                isNhs,
              }
            : null,
          price,
          earliestAppointmentText,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // 6. APPLY SECONDARY FILTERS
    // Radius Filter (only applied when user specifies a location/postcode)
    if (radiusMiles > 0 && locationParam && locationParam.trim()) {
      processedPharmacies = processedPharmacies.filter((p) => p.distanceMiles <= radiusMiles);
    }

    // NHS / Private Filter
    if (nhsParam) {
      processedPharmacies = processedPharmacies.filter((p) => p.matchedService?.isNhs);
    } else if (privateParam) {
      processedPharmacies = processedPharmacies.filter((p) => !p.matchedService?.isNhs);
    }

    // Open Now Filter
    if (openNowParam || availabilityParam === "open-now") {
      processedPharmacies = processedPharmacies.filter((p) => p.isOpenNow);
    }

    // Price Range Filter
    if (maxPriceParam > 0) {
      processedPharmacies = processedPharmacies.filter(
        (p) => p.price >= minPriceParam && p.price <= maxPriceParam
      );
    }

    // Rating Filter
    if (minRatingParam > 0) {
      processedPharmacies = processedPharmacies.filter((p) => p.ratingScore >= minRatingParam);
    }

    // 7. DEFAULT SORTING MATRIX
    // 1. Nearest Pharmacy
    // 2. Earliest Appointment
    // 3. Highest Rating
    // 4. Lowest Price
    processedPharmacies.sort((a, b) => {
      if (sortParam === "rating") {
        return b.ratingScore - a.ratingScore || a.distanceMiles - b.distanceMiles;
      }
      if (sortParam === "price") {
        return a.price - b.price || a.distanceMiles - b.distanceMiles;
      }
      if (sortParam === "earliest") {
        if (a.isOpenNow && !b.isOpenNow) return -1;
        if (!a.isOpenNow && b.isOpenNow) return 1;
        return a.distanceMiles - b.distanceMiles;
      }
      // Default: Nearest Pharmacy First
      return a.distanceMiles - b.distanceMiles || b.ratingScore - a.ratingScore;
    });

    // 8. PAGINATION
    const totalPharmacies = processedPharmacies.length;
    const totalPages = Math.ceil(totalPharmacies / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPharmacies = processedPharmacies.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      query: {
        service: cleanService,
        location: resolvedLocationName,
        latitude: targetLat,
        longitude: targetLng,
        radius: radiusMiles,
        sort: sortParam,
      },
      meta: {
        total: totalPharmacies,
        page,
        limit,
        totalPages,
      },
      pharmacies: paginatedPharmacies,
    });
  } catch (error: any) {
    console.error("❌ GET /api/search error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute search" },
      { status: 500 }
    );
  }
}
