// Shop hours configuration — centralized so checkout warnings and display stay in sync
// Hours are read from env vars so they can be adjusted seasonally without code changes

export interface ShopHours {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
  isOpen: boolean;
}

/**
 * Configuration type for shop hours passed from server to client
 */
export interface ShopHoursConfig {
  weekday: string;
  saturday: string;
  sunday: string;
  timezone: string;
}

const DEFAULT_SHOP_TIMEZONE = "Asia/Dubai";
const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getDefaultShopTimeZone(): string {
  return process.env.SHOP_TIMEZONE || DEFAULT_SHOP_TIMEZONE;
}

function getFormatterParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
}

function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  });

  const offsetPart = formatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  if (!offsetPart) {
    return 0;
  }

  const match = offsetPart.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] || "0");
  return sign * (hours * 60 + minutes);
}

export function getShopDateTimeParts(date: Date, timeZone = getDefaultShopTimeZone()) {
  const parts = getFormatterParts(date, timeZone);

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    day: WEEKDAY_MAP[parts.weekday] ?? 0,
  };
}

export function buildPickupDateInShopTime(
  referenceDate: Date,
  timeString: string,
  timeZone = getDefaultShopTimeZone()
): Date {
  const { date } = getShopDateTimeParts(referenceDate, timeZone);
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offsetMinutes * 60 * 1000);
}

export function isPickupTimeAtLeastMinutesAhead(
  referenceDate: Date,
  timeString: string,
  minimumMinutes: number,
  timeZone = getDefaultShopTimeZone()
): boolean {
  const { time } = getShopDateTimeParts(referenceDate, timeZone);
  return timeStringToMinutes(timeString) - timeStringToMinutes(time) >= minimumMinutes;
}

export function getShopHoursConfigFromEnv(): ShopHoursConfig {
  return {
    weekday: process.env.SHOP_HOURS_WEEKDAY || "09:00-18:00",
    saturday: process.env.SHOP_HOURS_SATURDAY || "09:00-17:00",
    sunday: process.env.SHOP_HOURS_SUNDAY || "closed",
    timezone: getDefaultShopTimeZone(),
  };
}

/**
 * Parse hours from env var format "HH:MM-HH:MM", "9am-6pm", "9:00 AM-6:00 PM", or "closed"
 * Returns 24-hour format internally for consistent processing
 */
function parseHours(hoursStr: string | undefined): ShopHours {
  if (!hoursStr || hoursStr.toLowerCase() === "closed") {
    return { open: "closed", close: "closed", isOpen: false };
  }

  const [openRaw, closeRaw] = hoursStr.split("-");
  if (!openRaw || !closeRaw) {
    // Fallback to default if malformed
    return { open: "09:00", close: "18:00", isOpen: true };
  }

  const open = convertTo24Hour(openRaw.trim());
  const close = convertTo24Hour(closeRaw.trim());

  return { open, close, isOpen: true };
}

/**
 * Convert various time formats to 24-hour "HH:MM" format
 * Handles: "09:00", "9am", "9:00am", "9AM", "9:00AM", "9 AM", "9:00 AM"
 */
function convertTo24Hour(timeStr: string): string {
  // Normalize: remove all spaces, normalize to lowercase
  const normalized = timeStr.replace(/\s+/g, "").toLowerCase();

  // Match patterns like "9am", "9:30am", "9:30AM", "12pm", "12:45pm", "12:45PM"
  // Capture: hours (1-2 digits), optional minutes (2 digits), am/pm
  const match = normalized.match(/^(\d{1,2}):?(\d{2})?(am|pm)$/i);
  if (!match) {
    // Assume it's already 24-hour format like "09:00"
    // Validate it looks like HH:MM
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(":");
      return `${String(parseInt(h, 10)).padStart(2, "0")}:${m}`;
    }
    return "09:00"; // Fallback
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2] || "00";
  const period = match[3];

  // Convert 12-hour to 24-hour
  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

/**
 * Get shop hours for a specific day of the week
 * @param day - 0 = Sunday, 6 = Saturday
 */
export function getShopHours(day: number): ShopHours {
  return getShopHoursFromConfig(day, getShopHoursConfigFromEnv());
}

/**
 * Get shop hours for a specific day using a config object
 * Use this in client components where env vars are not available
 * @param day - 0 = Sunday, 6 = Saturday
 * @param config - Shop hours configuration object
 */
export function getShopHoursFromConfig(day: number, config: ShopHoursConfig): ShopHours {
  if (day === 0) return parseHours(config.sunday);
  if (day === 6) return parseHours(config.saturday);
  return parseHours(config.weekday);
}

/**
 * Check if a given time is within shop hours for a specific date
 * Time format: "HH:MM" (24-hour)
 */
export function isWithinShopHours(date: Date, timeString: string): boolean {
  const { day } = getShopDateTimeParts(date);
  const { open, close, isOpen } = getShopHours(day);
  if (!isOpen) return false;
  return timeString >= open && timeString <= close;
}

/**
 * Check if a given time is within shop hours using a config object
 * Use this in client components where env vars are not available
 * Time format: "HH:MM" (24-hour)
 */
export function isWithinShopHoursWithConfig(
  date: Date,
  timeString: string,
  config: ShopHoursConfig
): boolean {
  const { day } = getShopDateTimeParts(date, config.timezone);
  const { open, close, isOpen } = getShopHoursFromConfig(day, config);
  if (!isOpen) return false;
  return timeString >= open && timeString <= close;
}

export function isShopOpenAt(date: Date, config: ShopHoursConfig): boolean {
  const { time, day } = getShopDateTimeParts(date, config.timezone);
  const { open, close, isOpen } = getShopHoursFromConfig(day, config);
  if (!isOpen) return false;
  return time >= open && time <= close;
}

/**
 * Format hours for display (e.g., "9:00 AM – 6:00 PM")
 */
function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return minutes === 0 ? `${hours12} ${period}` : `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * Get formatted hours string for display
 * Returns null if closed
 */
export function getFormattedHours(day: number): string | null {
  const { open, close, isOpen } = getShopHours(day);
  if (!isOpen) return null;
  return `${formatTimeDisplay(open)} – ${formatTimeDisplay(close)}`;
}

/**
 * Get a compact hours summary for footer display
 * Example: "Mon–Fri 9am–6pm, Sat 9am–5pm, Sun Closed"
 */
export function getHoursSummary(): string {
  const weekday = getShopHours(1);
  const saturday = getShopHours(6);
  const sunday = getShopHours(0);

  const parts: string[] = [];

  if (weekday.isOpen) {
    parts.push(`Mon–Fri ${formatTimeCompact(weekday.open)}–${formatTimeCompact(weekday.close)}`);
  }

  if (saturday.isOpen) {
    parts.push(`Sat ${formatTimeCompact(saturday.open)}–${formatTimeCompact(saturday.close)}`);
  } else {
    parts.push("Sat Closed");
  }

  if (sunday.isOpen) {
    parts.push(`Sun ${formatTimeCompact(sunday.open)}–${formatTimeCompact(sunday.close)}`);
  } else {
    parts.push("Sun Closed");
  }

  return parts.join(", ");
}

export function getHoursSummaryLines(): [string, string] {
  const weekday = getShopHours(1);
  const saturday = getShopHours(6);
  const sunday = getShopHours(0);

  const weekdayLine = weekday.isOpen
    ? `Weekdays ${formatTimeCompact(weekday.open)}–${formatTimeCompact(weekday.close)}`
    : "Weekdays Closed";

  const saturdayLabel = saturday.isOpen
    ? `Saturday ${formatTimeCompact(saturday.open)}–${formatTimeCompact(saturday.close)}`
    : "Saturday Closed";

  const sundayLabel = sunday.isOpen
    ? `Sunday ${formatTimeCompact(sunday.open)}–${formatTimeCompact(sunday.close)}`
    : "Sunday Closed";

  return [weekdayLine, `${saturdayLabel} | ${sundayLabel}`];
}

function formatTimeCompact(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const hours12 = hours % 12 || 12;
  return minutes === 0 ? `${hours12}${period}` : `${hours12}:${String(minutes).padStart(2, "0")}${period}`;
}

/**
 * Get detailed hours for each day (for pickup info page)
 */
export function getDetailedHours(): Array<{ day: string; hours: string }> {
  // Group consecutive days with same hours
  const result: Array<{ day: string; hours: string }> = [];

  const weekdayHours = getFormattedHours(1);
  const saturdayHours = getFormattedHours(6);
  const sundayHours = getFormattedHours(0);

  // Weekdays (Mon-Fri)
  if (weekdayHours) {
    result.push({ day: "Weekdays", hours: weekdayHours });
  } else {
    result.push({ day: "Weekdays", hours: "Closed" });
  }

  // Saturday
  if (saturdayHours) {
    result.push({ day: "Saturday", hours: saturdayHours });
  } else {
    result.push({ day: "Saturday", hours: "Closed" });
  }

  // Sunday
  if (sundayHours) {
    result.push({ day: "Sunday", hours: sundayHours });
  } else {
    result.push({ day: "Sunday", hours: "Closed" });
  }

  return result;
}
