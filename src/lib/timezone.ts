/**
 * Timezone-aware date parsing and formatting utilities
 * using native Intl APIs, robust against DST shifts.
 */

export function getTimeZoneOffset(timeZone: string, date: Date): number {
  if (!date || isNaN(date.getTime())) {
    return 0;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const utcParts = utcFormatter.formatToParts(date);

  const getPartValue = (pList: Intl.DateTimeFormatPart[], type: string) => {
    const val = Number(pList.find((p) => p.type === type)?.value);
    if (type === "hour" && val === 24) return 0;
    return val;
  };

  const dateInTZVal = Date.UTC(
    getPartValue(parts, "year"),
    getPartValue(parts, "month") - 1,
    getPartValue(parts, "day"),
    getPartValue(parts, "hour"),
    getPartValue(parts, "minute"),
    getPartValue(parts, "second")
  );

  const dateInUTCVal = Date.UTC(
    getPartValue(utcParts, "year"),
    getPartValue(utcParts, "month") - 1,
    getPartValue(utcParts, "day"),
    getPartValue(utcParts, "hour"),
    getPartValue(utcParts, "minute"),
    getPartValue(utcParts, "second")
  );

  return dateInTZVal - dateInUTCVal;
}

export function localDateTimeToUTC(dateStr: string, timeStr: string, timeZone: string): Date {
  const today = new Date();
  const [year, month, day] = (dateStr || "").split("-").map(Number);
  let [hour, minute] = (timeStr || "09:00").split(":").map(Number);

  const safeYear = !isNaN(year) && year > 1900 ? year : today.getFullYear();
  const safeMonth = !isNaN(month) && month >= 1 && month <= 12 ? month : today.getMonth() + 1;
  const safeDay = !isNaN(day) && day >= 1 && day <= 31 ? day : today.getDate();
  const safeHour = !isNaN(hour) && hour >= 0 && hour <= 23 ? hour : 9;
  const safeMinute = !isNaN(minute) && minute >= 0 && minute <= 59 ? minute : 0;

  // 1. Construct candidate epoch treated as UTC
  const candidateUTC = Date.UTC(safeYear, safeMonth - 1, safeDay, safeHour, safeMinute, 0);

  // 2. Get timezone offset for this candidate instant
  const offsetMs = getTimeZoneOffset(timeZone, new Date(candidateUTC));

  // 3. Subtract the offset to get the correct UTC Date
  return new Date(candidateUTC - offsetMs);
}

export function formatUTCInTimezone(
  date: Date,
  timeZone: string,
  pattern: "time" | "date" | "full"
): string {
  if (pattern === "time") {
    return date.toLocaleTimeString("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (pattern === "date") {
    return date.toLocaleDateString("en-US", {
      timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else {
    return date.toLocaleString("en-US", {
      timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
}
