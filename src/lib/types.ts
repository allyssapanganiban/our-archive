import type { AccentName, Washi } from "@/design/tokens";
import type { Person } from "./dates";

export type FolderKind = "cards" | "memories";

export type Folder = {
  slug: string;
  title: string;
  kind: FolderKind;
  accent: AccentName;
  tagline: string;
  /** Built-in folders can't be deleted; custom ones can. */
  builtIn: boolean;
  /** Label shown in the count, e.g. "MEMORIES", "NOTES", "CARDS". */
  unit: string;
  tab: "left" | "right";
  /** Folder rotation on the desk, degrees. */
  rot: number;
  /** Memory ids in the order they were arranged by hand. Pages not listed come first, newest first. */
  order?: string[];
};

export type Photo = { src: string; alt: string; caption?: string; washi?: Washi };

export type DiaryEntry = { author: Person; paragraphs: string[]; signoff?: string };

export type TicketStub = { top: string; title: string; sub: string; no: string; tint?: "cream" | "blush" | "ice" };

export type Playlist = { title: string; tracks: string[]; url?: string };

/**
 * Something placed on a journal spread (the drag/rotate layer). A spread is two
 * pages, each 640 px wide (and at least 820 px tall; it grows to fit). `x`/`y` are
 * the item's top-left corner in page px on its `page`.
 */
export type PlacedItem = {
  id: string;
  kind: "photo" | "note" | "washi" | "stamp" | "postmark" | "ticket" | "cassette" | "card" | "heart" | "checklist";
  /** Which page of the spread. Items saved before spreads existed have no page and are re-laid out. */
  page?: "left" | "right";
  x: number;
  y: number;
  rot: number; // degrees
  scale: number; // 1 = default size
  z: number;
  data?: Record<string, string>;
};

export type TemplateId = "photo-note" | "big-moment" | "ticket-stack";
export type PageType = "monthversary" | "trip" | "date" | "first" | "little-thing" | "birthday";

export type Memory = {
  id: string;
  folder: string; // folder slug
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  pageType: PageType;
  template: TemplateId;
  /** Monthversary number etc., shown as "No. 05". */
  number?: number;
  summary: string; // one handwritten line for folder views
  /** Place on the postmark; `date` (YYYY-MM-DD) overrides the memory date on the postmark. */
  location?: { name: string; date?: string };
  diary: DiaryEntry[];
  photos: Photo[];
  tickets: TicketStub[];
  playlist?: Playlist;
  checklist?: { title: string; items: { text: string; done: boolean }[] };
  cardId?: string;
  stickers: PlacedItem[];
  scene?: string; // placeholder illustration name until real photos are uploaded
  /** When the page was first saved (ISO). Older pages may not have it; see `addedAt()`. */
  createdAt?: string;
  /** Set on load only (never stored): when an older page was last saved, if after the starting content was loaded. */
  editedAt?: string;
};
