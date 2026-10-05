export type DateFormatOption = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD MMM YYYY";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getStoredDateFormat(): DateFormatOption {
  if (typeof window === "undefined") return "DD/MM/YYYY";
  const stored = localStorage.getItem("date_format") as DateFormatOption;
  if (stored && ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD MMM YYYY"].includes(stored)) {
    return stored;
  }
  return "DD/MM/YYYY";
}

/**
 * Formats an ISO date string or Date object according to the active date format preference.
 */
export function formatDate(dateInput?: string | Date | null, formatOverride?: DateFormatOption): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "—";

  const format = formatOverride || getStoredDateFormat();
  const day = String(date.getDate()).padStart(2, "0");
  const monthNum = String(date.getMonth() + 1).padStart(2, "0");
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();

  switch (format) {
    case "MM/DD/YYYY":
      return `${monthNum}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${monthNum}-${day}`;
    case "DD MMM YYYY":
      return `${day} ${monthName} ${year}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${monthNum}/${year}`;
  }
}

/**
 * Formats an ISO date string or Date object into Date + HH:mm format.
 */
export function formatDateTime(dateInput?: string | Date | null, formatOverride?: DateFormatOption): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "—";

  const formattedDate = formatDate(date, formatOverride);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${formattedDate} ${hours}:${minutes}`;
}

/**
 * Formats a live Date object into full Date + HH:mm:ss for real-time record tracking and auditing.
 */
export function formatRealTimeClock(date: Date = new Date(), formatOverride?: DateFormatOption): string {
  const formattedDate = formatDate(date, formatOverride);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${formattedDate} ${hours}:${minutes}:${seconds}`;
}

