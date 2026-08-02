import { db } from "./db";
import { localDateTimeToUTC, formatUTCInTimezone } from "./timezone";

export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  formattedTime: string;
  isAvailable: boolean;
  reason?: "BOOKED" | "PAST" | "CLOSED";
}

/**
 * Reusable timezone-aware booking engine.
 * Generates and validates scheduling slots.
 */
export class BookingEngine {
  /**
   * Retrieves all scheduling slots for a service on a given date, including availability status.
   */
  static async getAvailableSlots(
    pharmacyId: string,
    serviceId: string,
    dateStr: string, // YYYY-MM-DD
    timezone: string
  ): Promise<AvailableSlot[]> {
    // 1. Fetch Service Details
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      return [];
    }

    const duration = service.duration; // in minutes

    // 2. Check if Date is Blocked (Holiday / Vacation)
    const targetDate = new Date(dateStr);
    const isBlocked = await db.blockedDate.findFirst({
      where: {
        pharmacyId,
        date: targetDate,
      },
    });

    if (isBlocked) {
      return [];
    }

    // 3. Determine Day of Week (0 = Sunday, 6 = Saturday)
    // Use 12:00 local time to safely resolve day of week without offset shifts
    const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();

    // 4. Fetch Operating Hours for this day of week
    const availability = await db.availability.findUnique({
      where: {
        pharmacyId_dayOfWeek: {
          pharmacyId,
          dayOfWeek,
        },
      },
    });

    if (!availability) {
      return []; // Closed
    }

    const { openTime, closeTime } = availability;

    // 5. Generate Candidate Slots (30-minute increments by default)
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);

    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    const candidateSlots: { startMin: number; endMin: number }[] = [];

    // Loop at 30-minute increments
    for (let currentMin = openMin; currentMin + duration <= closeMin; currentMin += 30) {
      candidateSlots.push({
        startMin: currentMin,
        endMin: currentMin + duration,
      });
    }

    if (candidateSlots.length === 0) {
      return [];
    }

    // 6. Fetch Existing Appointments for the Date to check conflicts across all services
    const startOfDayUTC = localDateTimeToUTC(dateStr, "00:00", timezone);
    const endOfDayUTC = localDateTimeToUTC(dateStr, "23:59", timezone);

    const appointments = await db.appointment.findMany({
      where: {
        pharmacyId,
        startTime: { gte: startOfDayUTC },
        endTime: { lte: endOfDayUTC },
        status: { notIn: ["CANCELLED", "REJECTED"] },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const now = new Date();
    const availableSlots: AvailableSlot[] = [];

    // 7. Validate and tag candidates
    for (const slot of candidateSlots) {
      const startH = Math.floor(slot.startMin / 60);
      const startM = slot.startMin % 60;
      const startStr = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}`;

      const slotStartUTC = localDateTimeToUTC(dateStr, startStr, timezone);
      const slotEndUTC = new Date(slotStartUTC.getTime() + duration * 60 * 1000);

      // Check if slot is in the past
      const isPast = slotStartUTC.getTime() <= now.getTime();

      // Check overlap conflicts with ANY appointment at pharmacy
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

      const isAvailable = !isPast && !hasOverlap;
      const reason = isPast ? "PAST" : hasOverlap ? "BOOKED" : undefined;

      availableSlots.push({
        startTime: slotStartUTC,
        endTime: slotEndUTC,
        formattedTime: formatUTCInTimezone(slotStartUTC, timezone, "time"),
        isAvailable,
        reason,
      });
    }

    return availableSlots;
  }

  /**
   * Validates if a specific timeslot is available for booking.
   * Used as a guard to prevent double bookings.
   */
  static async checkSlotAvailability(
    pharmacyId: string,
    serviceId: string,
    startTimeUTC: Date,
    timezone: string
  ): Promise<boolean> {
    const service = await db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      return false;
    }

    const duration = service.duration;
    const endTimeUTC = new Date(startTimeUTC.getTime() + duration * 60 * 1000);

    // 1. Check if date is blocked
    // Format date string from UTC in target timezone
    const dateStr = startTimeUTC.toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
    const targetDate = new Date(dateStr);
    const isBlocked = await db.blockedDate.findFirst({
      where: {
        pharmacyId,
        date: targetDate,
      },
    });

    if (isBlocked) {
      return false;
    }

    // 2. Check if within operating hours
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" });
    const weekdayShort = formatter.format(startTimeUTC); // "Sun", "Mon", etc.
    const shortNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayIndex = shortNames.indexOf(weekdayShort);

    const availability = await db.availability.findUnique({
      where: {
        pharmacyId_dayOfWeek: {
          pharmacyId,
          dayOfWeek: dayIndex,
        },
      },
    });

    if (!availability) {
      return false; // Closed
    }

    const { openTime, closeTime } = availability;

    // Convert open/close local times to UTC for comparison
    const openUTC = localDateTimeToUTC(dateStr, openTime, timezone);
    const closeUTC = localDateTimeToUTC(dateStr, closeTime, timezone);

    if (startTimeUTC.getTime() < openUTC.getTime() || endTimeUTC.getTime() > closeUTC.getTime()) {
      return false; // Out of bounds
    }

    // 3. Check for overlapping appointments
    const overlap = await db.appointment.findFirst({
      where: {
        pharmacyId,
        status: { not: "CANCELLED" },
        startTime: { lt: endTimeUTC },
        endTime: { gt: startTimeUTC },
      },
    });

    return !overlap;
  }
}
