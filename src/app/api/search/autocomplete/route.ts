import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { BookingEngine } from "@/lib/booking-service";

export const dynamic = "force-dynamic";

// In-memory cache to optimize performance
const autocompleteCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds cache

// Rate limiting map
const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests/min

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitInfo = ipRateLimitMap.get(ip);

  if (!limitInfo) {
    ipRateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (now > limitInfo.resetTime) {
    ipRateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  limitInfo.count += 1;
  if (limitInfo.count > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  return false;
}

function parseAddress(address: string) {
  const cleanAddress = address.trim();
  const postcodeRegex = /\b([A-Z]{1,2}[0-9][0-9A-Z]?)\s*([0-9][A-Z]{2})\b/i;
  const match = cleanAddress.match(postcodeRegex);

  let postcode = "";
  let outcode = "";
  if (match) {
    postcode = `${match[1].toUpperCase()} ${match[2].toUpperCase()}`;
    outcode = match[1].toUpperCase();
  }

  const parts = cleanAddress.split(",").map((p) => p.trim());
  let city = "";

  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];

    if (
      postcode &&
      lastPart.replace(/\s+/g, "").toLowerCase() === postcode.replace(/\s+/g, "").toLowerCase()
    ) {
      city = secondLastPart;
    } else {
      let temp = lastPart;
      if (postcode) {
        temp = temp.replace(new RegExp(postcode, "i"), "").trim();
        temp = temp.replace(new RegExp(outcode, "i"), "").trim();
      }
      if (temp) {
        city = temp;
      } else {
        city = secondLastPart;
      }
    }
  } else {
    let temp = cleanAddress;
    if (postcode) {
      temp = temp.replace(new RegExp(postcode, "i"), "").trim();
    }
    const spaceParts = temp.split(/\s+/);
    city = spaceParts[spaceParts.length - 1] || "";
  }

  city = city.replace(/[^a-zA-Z\s]/g, "").trim();
  return { postcode, outcode, city };
}

function formatEarliestTime(date: Date): string {
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/London",
  });
  return `Today • ${timeFormatter.format(date)}`;
}

const serviceSynonyms: Record<string, string[]> = {
  jab: ["vaccination", "booster", "shot", "immunisation"],
  vaccine: ["vaccination", "booster", "shot", "immunisation"],
  injection: ["vaccination", "booster", "shot", "immunisation"],
  shot: ["vaccination", "booster", "jab", "immunisation"],
  blood: ["screening", "health", "assessment", "test"],
  test: ["screening", "health", "assessment"],
  check: ["screening", "health", "assessment", "check"],
  ear: ["wax", "removal"],
  weight: ["management", "loss"],
  travel: ["vaccination", "vaccine", "yellow fever", "typhoid", "rabies"],
  holiday: ["travel", "vaccination", "clinic"],
  yellow: ["fever", "travel", "vaccination"],
  flu: ["vaccination", "influenza", "booster"],
  covid: ["booster", "vaccination"],
  bp: ["blood", "pressure", "check"],
};

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown-ip";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const cleanQuery = q
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .toLowerCase();

    // 1. If query is empty, return popular searches from analytics
    if (cleanQuery.length === 0) {
      let analyticsPopular: any[] = [];
      try {
        analyticsPopular = await (db.searchAnalytics as any).groupBy({
          by: ["query"],
          _count: {
            query: true,
          },
          orderBy: {
            _count: {
              query: "desc",
            },
          },
          take: 5,
        });
      } catch (err) {
        console.error("Search analytics notice:", err);
      }

      const popularSearches =
        analyticsPopular.length > 0
          ? analyticsPopular.map((a: any) => a.query)
          : [
              "Travel Vaccination",
              "Blood Tests",
              "Ear Wax Removal",
              "Weight Management",
              "Flu Vaccination",
            ];

      return NextResponse.json({ popularSearches });
    }

    if (cleanQuery.length < 2) {
      return NextResponse.json([]);
    }

    const type = searchParams.get("type") || "all";
    const cacheKey = `${type}-${cleanQuery}`;

    // Check cache
    const cached = autocompleteCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json(cached.data);
    }

    let serviceSuggestions: any[] = [];
    if (type === "service" || type === "all") {
      const queryTerms = [cleanQuery];
      for (const [key, synonyms] of Object.entries(serviceSynonyms)) {
        if (cleanQuery.includes(key)) {
          for (const syn of synonyms) {
            if (!queryTerms.includes(syn)) {
              queryTerms.push(syn);
            }
          }
        }
      }

      const services = await db.service.findMany({
        where: {
          isActive: true,
          OR: queryTerms.map((term) => ({
            name: {
              contains: term,
              mode: "insensitive",
            },
          })),
        },
        select: {
          name: true,
        },
        distinct: ["name"],
        take: 5,
      });

      for (const svc of services) {
        // Find how many approved pharmacies offer this service
        const count = await db.pharmacy.count({
          where: {
            status: "APPROVED",
            deletedAt: null,
            services: {
              some: {
                name: svc.name,
                isActive: true,
              },
            },
          },
        });

        serviceSuggestions.push({
          type: "service",
          name: svc.name,
          count,
          status: count > 0 ? "green" : "grey",
          statusText:
            count > 0
              ? `${count} clinic${count > 1 ? "s" : ""} available`
              : "No registered clinics",
        });
      }
    }

    let locationSuggestions: any[] = [];
    if (type === "location" || type === "all") {
      // Fetch all pharmacies to parse their addresses dynamically
      const pharmacies = await db.pharmacy.findMany({
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          address: true,
          status: true,
          latitude: true,
          longitude: true,
          postcode: true,
          city: true,
          subscription: {
            select: {
              status: true,
              endDate: true,
            },
          },
          blockedDates: {
            select: {
              date: true,
            },
          },
          availability: {
            select: {
              dayOfWeek: true,
              openTime: true,
              closeTime: true,
            },
          },
          services: {
            where: { isActive: true },
            select: {
              id: true,
              duration: true,
            },
          },
        },
      });

      const parsedPharmacies = pharmacies.map((p) => {
        // Use parsed values from database fields, falling back to dynamic parser
        const postcode = p.postcode || parseAddress(p.address).postcode;
        const outcode = postcode ? postcode.split(" ")[0] : "";
        const city = p.city || parseAddress(p.address).city;

        return {
          ...p,
          parsedLocation: { postcode, outcode, city },
        };
      });

      // Extract unique matching location suggestions
      const cityMatches = new Set<string>();
      const outcodeMatches = new Set<string>();
      const postcodeMatches = new Set<string>();

      parsedPharmacies.forEach((p) => {
        const { city, outcode, postcode } = p.parsedLocation;
        if (city && city.toLowerCase().includes(cleanQuery)) {
          cityMatches.add(city);
        }
        if (outcode && outcode.toLowerCase().includes(cleanQuery)) {
          outcodeMatches.add(outcode);
        }
        if (postcode && postcode.toLowerCase().includes(cleanQuery)) {
          postcodeMatches.add(postcode);
        }
      });

      const today = new Date();
      const dayOfWeek = today.getDay();
      const todayStr = today.toLocaleDateString("en-CA");

      const candidates = [
        ...Array.from(cityMatches).map((name) => ({ name, type: "city" })),
        ...Array.from(outcodeMatches).map((name) => ({ name, type: "outcode" })),
        ...Array.from(postcodeMatches).map((name) => ({ name, type: "postcode" })),
      ];

      for (const cand of candidates) {
        // Find pharmacies in this location
        const localPharmacies = parsedPharmacies.filter((p) => {
          const loc = p.parsedLocation;
          if (cand.type === "city") return loc.city.toLowerCase() === cand.name.toLowerCase();
          if (cand.type === "outcode") return loc.outcode.toLowerCase() === cand.name.toLowerCase();
          if (cand.type === "postcode")
            return loc.postcode.toLowerCase() === cand.name.toLowerCase();
          return false;
        });

        // Filter active, approved, subscribed pharmacies
        const activePharmacies = localPharmacies.filter((p) => {
          const isApproved = p.status === "APPROVED";
          const hasActiveSub =
            p.subscription?.status === "ACTIVE" || p.subscription?.status === "TRIAL";
          const subNotExpired = p.subscription?.endDate
            ? new Date(p.subscription.endDate) > today
            : true;
          return isApproved && hasActiveSub && subNotExpired;
        });

        // Calculate availability counts and find earliest appointment today
        let openTodayCount = 0;
        let totalSlotsToday = 0;
        let earliestAppointmentToday: Date | null = null;

        for (const p of activePharmacies) {
          // Check if blocked today
          const isBlocked = p.blockedDates.some((b) => {
            return new Date(b.date).toLocaleDateString("en-CA") === todayStr;
          });
          if (isBlocked) continue;

          // Check if open today
          const avail = p.availability.find((a) => a.dayOfWeek === dayOfWeek);
          if (avail) {
            openTodayCount++;

            // Query slots today for earliest appointment calculation
            for (const service of p.services) {
              try {
                const slots = await BookingEngine.getAvailableSlots(
                  p.id,
                  service.id,
                  todayStr,
                  "Europe/London"
                );
                totalSlotsToday += slots.length;

                for (const slot of slots) {
                  if (
                    !earliestAppointmentToday ||
                    slot.startTime.getTime() < earliestAppointmentToday.getTime()
                  ) {
                    earliestAppointmentToday = slot.startTime;
                  }
                }
              } catch (e) {
                console.error(`Error calculating slots for autocomplete:`, e);
              }
            }
          }
        }

        // Determine status dot and status message based on calculations
        let status: "green" | "yellow" | "red" | "grey" = "grey";
        let statusText = "No registered providers";
        let earliestAppointmentText = "";

        if (localPharmacies.length === 0 || activePharmacies.length === 0) {
          status = "grey";
          statusText = "No registered pharmacies";
        } else {
          const activeCount = activePharmacies.length;
          if (totalSlotsToday > 5) {
            status = "green";
            statusText = `${activeCount} ${activeCount === 1 ? "pharmacy" : "pharmacies"} available today`;
          } else if (totalSlotsToday > 0 && totalSlotsToday <= 5) {
            status = "yellow";
            statusText = `Limited availability • ${activeCount} ${activeCount === 1 ? "pharmacy" : "pharmacies"} available`;
          } else {
            status = "red";
            statusText = "No appointments available today";
          }

          if (earliestAppointmentToday) {
            earliestAppointmentText = formatEarliestTime(earliestAppointmentToday);
          }
        }

        locationSuggestions.push({
          type: cand.type,
          name: cand.name,
          count: activePharmacies.length,
          status,
          statusText,
          earliestAppointment: earliestAppointmentText || undefined,
        });
      }

      // Sort by search priority: Exact postcode -> Exact outcode -> Exact city -> Matches starting with query
      locationSuggestions.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        const aExactPostcode = a.type === "postcode" && aName === cleanQuery;
        const bExactPostcode = b.type === "postcode" && bName === cleanQuery;
        if (aExactPostcode && !bExactPostcode) return -1;
        if (!aExactPostcode && bExactPostcode) return 1;

        const aExactOutcode = a.type === "outcode" && aName === cleanQuery;
        const bExactOutcode = b.type === "outcode" && bName === cleanQuery;
        if (aExactOutcode && !bExactOutcode) return -1;
        if (!aExactOutcode && bExactOutcode) return 1;

        const aExactCity = a.type === "city" && aName === cleanQuery;
        const bExactCity = b.type === "city" && bName === cleanQuery;
        if (aExactCity && !bExactCity) return -1;
        if (!aExactCity && bExactCity) return 1;

        const aStartPostcode = a.type === "postcode" && aName.startsWith(cleanQuery);
        const bStartPostcode = b.type === "postcode" && bName.startsWith(cleanQuery);
        if (aStartPostcode && !bStartPostcode) return -1;
        if (!aStartPostcode && bStartPostcode) return 1;

        const aStartCity = a.type === "city" && aName.startsWith(cleanQuery);
        const bStartCity = b.type === "city" && bName.startsWith(cleanQuery);
        if (aStartCity && !bStartCity) return -1;
        if (!aStartCity && bStartCity) return 1;

        return 0;
      });
    }

    const limitedSuggestions = [
      ...serviceSuggestions.slice(0, 5),
      ...locationSuggestions.slice(0, 8),
    ].slice(0, 10);

    // Save to cache
    autocompleteCache.set(cacheKey, {
      data: limitedSuggestions,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json(limitedSuggestions);
  } catch (error: any) {
    console.error("❌ Autocomplete API error notice:", error);
    return NextResponse.json([
      { type: "service", name: "Travel Health Clinic", subtitle: "Popular UK service" },
      { type: "service", name: "Flu Vaccination", subtitle: "Popular UK service" },
      { type: "service", name: "Ear Wax Removal", subtitle: "Popular UK service" },
    ]);
  }
}
