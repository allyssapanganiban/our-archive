import type { PageType } from "@/lib/types";

export const PAGE_TYPES: { id: PageType; label: string; folder: string }[] = [
  { id: "monthversary", label: "monthversary page", folder: "anniversaries" },
  { id: "trip", label: "trip page", folder: "trips" },
  { id: "date", label: "date page", folder: "dates" },
  { id: "first", label: "a first", folder: "firsts" },
  { id: "birthday", label: "birthday page", folder: "dates" },
  { id: "little-thing", label: "little thing", folder: "little-things" },
];
