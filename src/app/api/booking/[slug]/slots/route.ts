import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { localDateTimeToUTC, formatUTCInTimezone } from "@/lib/timezone";

const UK_TIMEZONE = "Europe/London";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const serviceId = request.nextUrl.searchParams.get("serviceId");
  const date = request.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  if (!serviceId || !date) {
    return NextResponse.json({ error: "serviceId and date are required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  try {
    const pharmacy = await db.pharmacy.findUnique({ where: { slug } });
    if (!pharmacy || pharmacy.status !== "APPROVED") {
      return NextResponse.json({ slots: [] });
    }

    const serviceIds = serviceId.split(",");
    const matchedServices = await db.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true,
      },
    });
    if (matchedServices.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    const duration = matchedServices.reduce((sum, s) => sum + s.duration, 0);

    // Check blocked date
    const targetDate = new Date(date);
    const isBlocked = await db.blockedDate.findFirst({
      where: { pharmacyId: pharmacy.id, date: targetDate },
    });
    if (isBlocked) {
      return NextResponse.json({ slots: [] });
    }

    // Determine day of week
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

    // Operating hours
    const availability = await db.availability.findUnique({
      where: {
        pharmacyId_dayOfWeek: {
          pharmacyId: pharmacy.id,
          dayOfWeek,
        },
      },
    });
    if (!availability) {
      return NextResponse.json({ slots: [] });
    }

    const { openTime, closeTime } = availability;
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    const candidateSlots: { startMin: number; endMin: number }[] = [];
    for (let currentMin = openMin; currentMin + duration <= closeMin; currentMin += 15) {
      candidateSlots.push({
        startMin: currentMin,
        endMin: currentMin + duration,
      });
    }

    if (candidateSlots.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Existing appointments
    const startOfDayUTC = localDateTimeToUTC(date, "00:00", UK_TIMEZONE);
    const endOfDayUTC = localDateTimeToUTC(date, "23:59", UK_TIMEZONE);

    const appointments = await db.appointment.findMany({
      where: {
        pharmacyId: pharmacy.id,
        startTime: { gte: startOfDayUTC },
        endTime: { lte: endOfDayUTC },
        status: { not: "CANCELLED" },
      },
      select: { startTime: true, endTime: true },
    });

    const now = new Date();
    const resultSlots: { label: string; startTime: string; isAvailable: boolean }[] = [];

    for (const slot of candidateSlots) {
      const startH = Math.floor(slot.startMin / 60);
      const startM = slot.startMin % 60;
      const startStr = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;

      const slotStartUTC = localDateTimeToUTC(date, startStr, UK_TIMEZONE);
      const slotEndUTC = new Date(slotStartUTC.getTime() + duration * 60 * 1000);

      // Discard past slots (don't show past slots at all today)
      if (slotStartUTC.getTime() <= now.getTime()) {
        continue;
      }

      // Check overlap
      let hasOverlap = false;
      for (const app of appointments) {
        if (
          slotStartUTC.getTime() < app.endTime.getTime() &&
          slotEndUTC.getTime() > app.startTime.getTime()
        ) {
          hasOverlap = true;
          break;
        }
      }

      resultSlots.push({
        label: formatUTCInTimezone(slotStartUTC, UK_TIMEZONE, "time"),
        startTime: slotStartUTC.toISOString(),
        isAvailable: !hasOverlap,
      });
    }

    return NextResponse.json({ slots: resultSlots });
  } catch (error) {
    console.error("❌ slots API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
