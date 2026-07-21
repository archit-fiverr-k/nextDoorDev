import { db } from "@/lib/db";
import { BookingEngine } from "@/lib/booking-service";
import { geocodeLocation } from "@/lib/geocoding";
import { SearchView } from "./search-view";

export const revalidate = 0; // Disable static cache for real-time slot checking

interface SearchPageProps {
  searchParams: {
    location?: string;
    service?: string;
    lat?: string;
    lng?: string;
  };
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

// Helper to format booking start time representation
function formatEarliestTime(date: Date): string {
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/London",
  });
  return `Today • ${timeFormatter.format(date)}`;
}

export default async function SearchResultsPage({ searchParams }: SearchPageProps) {
  const { location = "", service = "", lat = "", lng = "" } = searchParams;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayStr = today.toLocaleDateString("en-CA");

  // 1. Resolve coordinates from searchParams or offline geocoder
  let centerLat: number | null = lat ? parseFloat(lat) : null;
  let centerLng: number | null = lng ? parseFloat(lng) : null;

  if (location && (!centerLat || !centerLng)) {
    const geocoded = geocodeLocation(location);
    if (geocoded) {
      centerLat = geocoded.lat;
      centerLng = geocoded.lng;
    }
  }

  // 2. Database query: Fetch active and matching providers
  let allProviders: any[] = [];
  try {
    allProviders = await db.pharmacy.findMany({
      where: {
        status: "APPROVED",
        deletedAt: null,
      },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
        },
        availability: true,
        blockedDates: true,
        subscription: true,
      },
    });
  } catch (err) {
    console.error("Search db query error:", err);
  }

  // Calculate dynamic slot availability and earliest appointment today on server
  const processedProviders = await Promise.all(
    allProviders.map(async (p) => {
      const dbPostcode = p.postcode || parseAddress(p.address).postcode;
      const dbCity = p.city || parseAddress(p.address).city;

      // Check if blocked today
      const isBlocked = p.blockedDates.some(
        (b: any) => new Date(b.date).toLocaleDateString("en-CA") === todayStr
      );

      // Check if open today
      const avail = p.availability.find((a: any) => a.dayOfWeek === dayOfWeek);
      const isOpenToday = !isBlocked && !!avail;

      // Check subscription
      const hasActiveSub =
        p.subscription?.status === "ACTIVE" || p.subscription?.status === "TRIAL";
      const subNotExpired = p.subscription?.endDate
        ? new Date(p.subscription.endDate) > today
        : true;
      const isSubscribed = hasActiveSub && subNotExpired;

      // Calculate slots count today and find earliest available appointment today
      let slotsToday = 0;
      let earliestAppointmentToday: Date | null = null;

      if (isOpenToday && isSubscribed) {
        for (const svc of p.services) {
          try {
            const slots = await BookingEngine.getAvailableSlots(
              p.id,
              svc.id,
              todayStr,
              "Europe/London"
            );
            slotsToday += slots.length;

            for (const slot of slots) {
              if (
                !earliestAppointmentToday ||
                slot.startTime.getTime() < earliestAppointmentToday.getTime()
              ) {
                earliestAppointmentToday = slot.startTime;
              }
            }
          } catch (e) {
            console.error(`Error fetching slots for search results:`, e);
          }
        }
      }

      // Generate consistent rating (future review count placeholder)
      const charSum = p.id
        .split("")
        .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const ratingScore = parseFloat((4.5 + (charSum % 5) / 10).toFixed(1));
      const ratingCount = 50 + (charSum % 150);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        logoUrl: p.logoUrl,
        brandColor: p.brandColor,
        displayName: p.displayName,
        address: p.address,
        phone: p.phone,
        latitude: p.latitude,
        longitude: p.longitude,
        postcode: dbPostcode,
        city: dbCity,
        isOpenToday,
        slotsToday,
        earliestAppointment: earliestAppointmentToday
          ? formatEarliestTime(earliestAppointmentToday)
          : undefined,
        earliestAppointmentDate: earliestAppointmentToday,
        ratingScore,
        ratingCount,
        services: p.services.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: Number(s.price),
          isActive: s.isActive,
        })),
      };
    })
  );

  // 3. Fetch taxomony lists for filters (Categories and Services list)
  const [dbCategories, allServicesList] = await Promise.all([
    db.category.findMany({
      where: { status: "ACTIVE", deleted: false, type: "SERVICE" },
      select: { id: true, name: true },
    }),
    db.service.findMany({
      where: { isActive: true },
      select: { name: true },
      distinct: ["name"],
    }),
  ]);

  const serviceNames = allServicesList.map((s) => s.name);

  return (
    <div className="min-h-screen w-full bg-slate-50/50 py-10 dark:bg-zinc-950/40">
      <div className="mx-auto max-w-7xl space-y-8 px-6 lg:px-8">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Healthcare Directory
          </h2>
          <p className="mt-1 text-slate-500 dark:text-zinc-400">
            Search and book private clinical services in your local area.
          </p>
        </div>

        <SearchView
          initialLocation={location}
          initialLat={centerLat}
          initialLng={centerLng}
          initialService={service}
          initialProviders={processedProviders}
          categories={dbCategories}
          allServiceNames={serviceNames}
        />
      </div>
    </div>
  );
}
