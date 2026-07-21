import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays, format, startOfDay } from "date-fns";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const serviceId = request.nextUrl.searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
  }

  try {
    // 1. Resolve pharmacy
    const pharmacy = await db.pharmacy.findUnique({ where: { slug } });
    if (!pharmacy || pharmacy.status !== "APPROVED") {
      return NextResponse.json({ dates: [] });
    }

    // 2. Resolve services (supports comma-separated service IDs for multi-service selection)
    const serviceIds = serviceId.split(",");
    const services = await db.service.findMany({
      where: {
        id: { in: serviceIds },
        pharmacyId: pharmacy.id,
        isActive: true,
      },
    });

    if (services.length === 0) {
      return NextResponse.json({ dates: [] });
    }

    const duration = services.reduce((sum, s) => sum + s.duration, 0); // Total duration in minutes
    const today = startOfDay(new Date());
    const DAY_COUNT = 60;
    const rangeEnd = addDays(today, DAY_COUNT + 1);

    // 3. Batch-fetch: availability schedule, blocked dates, existing appointments
    const [availabilityRecords, blockedDates, appointments] = await Promise.all([
      db.availability.findMany({ where: { pharmacyId: pharmacy.id } }),
      db.blockedDate.findMany({
        where: { pharmacyId: pharmacy.id, date: { gte: today, lte: rangeEnd } },
      }),
      db.appointment.findMany({
        where: {
          pharmacyId: pharmacy.id,
          startTime: { gte: today, lte: rangeEnd },
          status: { not: "CANCELLED" },
        },
        select: { startTime: true, endTime: true },
      }),
    ]);

    // Build fast lookup structures
    const availabilityByDay = new Map(availabilityRecords.map((a) => [a.dayOfWeek, a]));
    const blockedSet = new Set(blockedDates.map((b) => format(new Date(b.date), "yyyy-MM-dd")));

    const now = new Date();
    const availableDates: string[] = [];

    // 4. Check each of the next 60 days
    for (let i = 1; i <= DAY_COUNT; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");

      // Skip blocked dates
      if (blockedSet.has(dateStr)) continue;

      // Check if pharmacy is open this day of week
      const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay(); // 0=Sun…6=Sat
      const avail = availabilityByDay.get(dayOfWeek);
      if (!avail) continue;

      // Parse open/close times
      const [openH, openM] = avail.openTime.split(":").map(Number);
      const [closeH, closeM] = avail.closeTime.split(":").map(Number);
      const openMin = openH * 60 + openM;
      const closeMin = closeH * 60 + closeM;

      // Pre-filter appointments for this date
      const dayAppts = appointments.filter(
        (a) => format(new Date(a.startTime), "yyyy-MM-dd") === dateStr
      );

      // Check if at least one slot is free and in the future
      let hasOpenSlot = false;
      for (let currentMin = openMin; currentMin + duration <= closeMin; currentMin += 15) {
        const slotH = Math.floor(currentMin / 60);
        const slotM = currentMin % 60;
        const slotStart = new Date(
          `${dateStr}T${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}:00`
        );
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

        // Skip past slots
        if (slotStart <= now) continue;

        // Check for overlap with existing appointments
        const overlaps = dayAppts.some((appt) => {
          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(appt.endTime);
          return slotStart < apptEnd && slotEnd > apptStart;
        });

        if (!overlaps) {
          hasOpenSlot = true;
          break;
        }
      }

      if (hasOpenSlot) {
        availableDates.push(dateStr);
      }
    }

    return NextResponse.json({ dates: availableDates });
  } catch (error: any) {
    console.error("❌ Error in available-dates API route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate available dates" },
      { status: 500 }
    );
  }
}
