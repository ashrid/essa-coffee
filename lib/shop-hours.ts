// Shop hours configuration — centralized so checkout warnings and display stay in sync
// Hours are read from env vars so they can be adjusted seasonally without code changes

export interface ShopHours {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
  isOpen: boolean;
}

/**
 * Parse hours from env var format "HH:MM-HH:MM" or "closed"
 */
function parseHours(hoursStr: string | undefined): ShopHours {
  if (!hoursStr || hoursStr.toLowerCase() === "closed") {
    return { open: "closed", close: "closed", isOpen: false };
  }

  const [open, close] = hoursStr.split("-");
  if (!open || !close) {
    // Fallback to default if malformed
    return { open: "09:00", close: "18:00", isOpen: true };
  }

  return { open: open.trim(), close: close.trim(), isOpen: true };
}

/**
 * Get shop hours for a specific day of the week
 * @param day - 0 = Sunday, 6 = Saturday
 */
export function getShopHours(day: number): ShopHours {
  const weekdayHours = parseHours(process.env.SHOP_HOURS_WEEKDAY);
  const saturdayHours = parseHours(process.env.SHOP_HOURS_SATURDAY);
  const sundayHours = parseHours(process.env.SHOP_HOURS_SUNDAY);

  if (day === 0) return sundayHours;
  if (day === 6) return saturdayHours;
  return weekdayHours;
}

/**
 * Check if a given time is within shop hours for a specific date
 * Time format: "HH:MM" (24-hour)
 */
export function isWithinShopHours(date: Date, timeString: string): boolean {
  const { open, close, isOpen } = getShopHours(date.getDay());
  if (!isOpen) return false;
  return timeString >= open && timeString <= close;
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
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Group consecutive days with same hours
  const result: Array<{ day: string; hours: string }> = [];

  const weekdayHours = getFormattedHours(1);
  const saturdayHours = getFormattedHours(6);
  const sundayHours = getFormattedHours(0);

  // Weekdays (Mon-Fri)
  if (weekdayHours) {
    result.push({ day: "Monday – Friday", hours: weekdayHours });
  } else {
    result.push({ day: "Monday – Friday", hours: "Closed" });
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
