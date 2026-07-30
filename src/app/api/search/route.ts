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

    // 3. STEP 1: SERVICE FILTERING (Smart Token Matching)
    const cleanService = serviceParam.replace(/-/g, " ").trim();
    const rawTokens = cleanService
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(
        (t) => t.length >= 2 && !["service", "treatment", "private", "clinic", "check"].includes(t)
      );
    const searchTokens = rawTokens.length > 0 ? rawTokens : [cleanService];

    // 4. Fetch Approved Pharmacies with Services & Ratings
    const pharmacies = await db.pharmacy.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
        ...(cleanService
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

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    // 5. Process & Calculate Distance, Ratings, and Availability for Each Pharmacy
    let processedPharmacies = pharmacies.map((pharmacy) => {
      // Calculate Haversine distance in miles
      let distanceMiles = 999;
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

      // Check if open now
      const todayAvailability = pharmacy.availability.find((a) => a.dayOfWeek === currentDayOfWeek);
      const isOpenNow =
        !!todayAvailability &&
        currentTimeStr >= todayAvailability.openTime &&
        currentTimeStr <= todayAvailability.closeTime;

      // Calculate rating score & count
      const ratingCount = pharmacy.reviews.length;
      const ratingSum = pharmacy.reviews.reduce((acc, r) => acc + r.rating, 0);
      const ratingScore = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 4.9;

      // Find exact matched service using search tokens
      const primaryService =
        pharmacy.services.find((s) => {
          if (!cleanService) return true;
          const sName = s.name.toLowerCase();
          return searchTokens.some((t) => sName.includes(t));
        }) ||
        pharmacy.services[0] ||
        null;
      const price = primaryService ? Number(primaryService.price) : 0;
      const duration = primaryService ? primaryService.duration : 15;
      const isNhs = primaryService?.category?.toLowerCase().includes("nhs") || false;

      // Earliest Appointment Slot Text
      const earliestAppointmentText = isOpenNow
        ? `Today • ${currentTimeStr}`
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
    });

    // 6. APPLY SECONDARY FILTERS
    // Radius Filter
    if (radiusMiles > 0) {
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
