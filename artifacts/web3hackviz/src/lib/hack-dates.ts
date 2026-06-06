import type { Hack } from "@/data/hacks";

const MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function parseMonth(name: string): number | undefined {
  return MONTHS[name.toLowerCase()];
}

/** Parse incident date from longDesc; falls back to mid-year of `year`. */
export function getHackSortDate(hack: Hack): number {
  const text = hack.longDesc;

  // "On April 16, 2026" / "On May 28-29, 2026"
  const onMatch = text.match(/On\s+(\w+)\s+(\d{1,2})(?:[–-]\d{1,2})?,?\s+(\d{4})/i);
  if (onMatch) {
    const month = parseMonth(onMatch[1]);
    if (month !== undefined) {
      return Date.UTC(+onMatch[3], month, +onMatch[2]);
    }
  }

  // "Between April 13-14, 2026"
  const betweenMatch = text.match(
    /Between\s+(\w+)\s+(\d{1,2})[–-](\d{1,2}),?\s+(\d{4})/i,
  );
  if (betweenMatch) {
    const month = parseMonth(betweenMatch[1]);
    if (month !== undefined) {
      return Date.UTC(+betweenMatch[4], month, +betweenMatch[2]);
    }
  }

  // "In February 2025"
  const inMatch = text.match(/In\s+(\w+)\s+(\d{4})/i);
  if (inMatch) {
    const month = parseMonth(inMatch[1]);
    if (month !== undefined) {
      return Date.UTC(+inMatch[2], month, 15);
    }
  }

  return Date.UTC(hack.year, 6, 1);
}
