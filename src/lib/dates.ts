/**
 * Our dates. Everything date-related in the UI (calendar page, countdowns,
 * monthversary numbers) is computed from these, never hard-coded.
 */

export const START_DATE = "2026-06-11"; // the day it all started
export const PEOPLE = {
  allyssa: { name: "Allyssa", initial: "A", birthday: "2003-12-09" },
  justin: { name: "Justin", initial: "J", birthday: "2004-01-08" },
} as const;
export type Person = keyof typeof PEOPLE;

/**
 * Parse "YYYY-MM-DD" as a local calendar date (no timezone drift).
 * A missing or half-typed date (date boxes report "" mid-edit) becomes today, so labels never crash.
 */
export function parseDay(iso: string | undefined | null): Date {
  const [y, m, d] = (iso ?? "").split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (!y || !m || !d || Number.isNaN(date.getTime())) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  return date;
}

export function toISODay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

/** Add n months, clamping to the last day when the month is shorter (e.g. the 31st). */
export function addMonths(date: Date, n: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** The date of monthversary number n (1 = one month together). */
export function monthversaryDate(n: number, start = START_DATE): Date {
  return addMonths(parseDay(start), n);
}

/** Next monthversary on or after `today`, with its number. */
export function nextMonthversary(today = new Date(), start = START_DATE): { n: number; date: Date } {
  let n = 1;
  while (startOfDay(monthversaryDate(n, start)) < startOfDay(today)) n++;
  return { n, date: monthversaryDate(n, start) };
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export type UpcomingEvent = {
  date: Date;
  kind: "monthversary" | "anniversary" | "birthday";
  label: string;
  short: string;
  who?: Person;
  accent: "pink" | "marigold" | "sky";
};

/** Upcoming monthversaries, anniversaries and birthdays, soonest first. */
export function upcomingEvents(today = new Date(), withinDays = 90): UpcomingEvent[] {
  const events: UpcomingEvent[] = [];
  const t0 = startOfDay(today);

  for (let i = 0, { n } = nextMonthversary(today); i < 4; i++, n++) {
    const date = monthversaryDate(n);
    const years = n % 12 === 0 ? n / 12 : 0;
    events.push(
      years
        ? { date, kind: "anniversary", label: `${ordinal(years)} anniversary`, short: `${years} year${years > 1 ? "s" : ""} ♥`, accent: "pink" }
        : { date, kind: "monthversary", label: `${ordinal(n)} monthversary`, short: `${n} months ♥`, accent: "pink" },
    );
  }

  (Object.keys(PEOPLE) as Person[]).forEach((who) => {
    const born = parseDay(PEOPLE[who].birthday);
    let next = new Date(t0.getFullYear(), born.getMonth(), born.getDate());
    if (next < t0) next = new Date(t0.getFullYear() + 1, born.getMonth(), born.getDate());
    const age = next.getFullYear() - born.getFullYear();
    events.push({
      date: next,
      kind: "birthday",
      who,
      label: `${PEOPLE[who].name} turns ${age}`,
      short: `${PEOPLE[who].initial} turns ${age}`,
      accent: who === "allyssa" ? "marigold" : "sky",
    });
  });

  return events
    .filter((e) => daysBetween(t0, e.date) >= 0 && daysBetween(t0, e.date) <= withinDays)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "NOV 11 '26" — the typewriter date used on labels. */
export function stampDate(date: Date | string): string {
  const d = typeof date === "string" ? parseDay(date) : date;
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")} '${String(d.getFullYear()).slice(2)}`;
}
/** "NOVEMBER '26" */
export function monthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()].toUpperCase()} '${String(date.getFullYear()).slice(2)}`;
}
export function monthName(date: Date): string {
  return MONTH_NAMES[date.getMonth()];
}
/** "11·11·26" — postmark style */
export function dotDate(date: Date | string): string {
  const d = typeof date === "string" ? parseDay(date) : date;
  return `${String(d.getMonth() + 1).padStart(2, "0")}·${String(d.getDate()).padStart(2, "0")}·${String(d.getFullYear()).slice(2)}`;
}
/** "11/11/2026" — card subtitle style */
export function slashDate(date: Date | string, shortYear = false): string {
  const d = typeof date === "string" ? parseDay(date) : date;
  const y = shortYear ? String(d.getFullYear()).slice(2) : d.getFullYear();
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${y}`;
}
