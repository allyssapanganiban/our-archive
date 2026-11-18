"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CARDS, FOLDERS, MEMORIES } from "./sample-data";
import { CHANGE_EVENT, loadBook, type Book } from "./store";
import type { Folder, Memory } from "./types";

export type Scrapbook = Book & {
  /** True once real data (saved / from Supabase) has loaded at least once. */
  ready: boolean;
  /** Set when the last load failed (e.g. offline); the last good data stays on screen. */
  error: string | null;
};

/** Drop links to things that were deleted, and pages whose folder is gone. */
function tidy(book: Book): Book {
  const slugs = new Set(book.folders.map((f) => f.slug));
  const memories0 = book.memories.filter((m) => slugs.has(m.folder));
  const cardIds = new Set(book.cards.map((c) => c.id));
  const memoryIds = new Set(memories0.map((m) => m.id));
  return {
    folders: book.folders,
    memories: memories0.map((m) => (m.cardId && !cardIds.has(m.cardId) ? { ...m, cardId: undefined } : m)),
    cards: book.cards.map((c) => (c.memoryId && !memoryIds.has(c.memoryId) ? { ...c, memoryId: undefined } : c)),
  };
}

// One shared copy for every component on the page, so data loads once and page changes are instant.
const SAMPLE: Scrapbook = { folders: FOLDERS, memories: MEMORIES, cards: CARDS, ready: false, error: null };
let current: Scrapbook = SAMPLE;
let loadedAt = 0;
let inFlight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function refresh(): Promise<void> {
  inFlight ??= loadBook()
    .then((book) => {
      current = { ...tidy(book), ready: true, error: null };
      loadedAt = Date.now();
    })
    .catch((e: unknown) => {
      console.error("Couldn't load the scrapbook", e);
      current = { ...current, error: "can’t reach the scrapbook right now. retrying when you come back." };
    })
    .finally(() => {
      inFlight = null;
      emit();
    });
  return inFlight;
}

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  window.addEventListener(CHANGE_EVENT, () => void refresh());
  window.addEventListener("storage", () => void refresh());
  // Pick up what the other person changed when you come back to the tab.
  const stale = () => document.visibilityState === "visible" && Date.now() - loadedAt > 15_000 && void refresh();
  window.addEventListener("focus", stale);
  document.addEventListener("visibilitychange", stale);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => void listeners.delete(l);
}

/**
 * Everything in the scrapbook. The first render uses the sample content (so
 * server and client match, and it's hidden until `ready`); real data follows
 * right after and again whenever something changes.
 */
export function useScrapbook(): Scrapbook {
  const book = useSyncExternalStore(subscribe, () => current, () => SAMPLE);
  useEffect(() => {
    wire();
    if (!current.ready || Date.now() - loadedAt > 15_000) void refresh();
  }, []);
  return book;
}

/**
 * When a page was added to the scrapbook (ms), for "recently tucked in":
 * 1. `createdAt` (every page saved from now on has it);
 * 2. the time baked into ids made by `newId()` (prefix-<base36 ms><4 random>);
 * 3. for a starting page you've since filled in, when you last saved it;
 * 4. starting pages you haven't touched sort below everything else, newest date first.
 */
export function addedAt(m: Memory): number {
  if (m.createdAt) return Date.parse(m.createdAt);
  const stamp = m.id.split("-").pop() ?? "";
  const fromId = stamp.length > 6 ? parseInt(stamp.slice(0, -4), 36) : NaN;
  if (fromId > Date.parse("2026-01-01") && fromId < Date.now() + 86_400_000) return fromId;
  if (m.editedAt) return Date.parse(m.editedAt);
  return Date.parse(`${m.date}T12:00:00`) - 1e13; // negative: never-touched starting page
}

export const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date);

/**
 * A folder's pages in display order: by date, earliest first (pages added on the
 * same day stay in the order they were added). If the folder was arranged by hand,
 * that order is kept and any page not in it yet slots in by its date.
 */
export function folderMemories(folder: Folder, memories: Memory[]): Memory[] {
  const inside = memories
    .filter((m) => m.folder === folder.slug)
    .sort((a, b) => a.date.localeCompare(b.date) || addedAt(a) - addedAt(b));
  if (!folder.order?.length) return inside;
  const pos = new Map(folder.order.map((id, i) => [id, i]));
  const placed = inside.filter((m) => pos.has(m.id)).sort((a, b) => pos.get(a.id)! - pos.get(b.id)!);
  for (const m of inside.filter((x) => !pos.has(x.id))) {
    const at = placed.findIndex((p) => p.date > m.date);
    placed.splice(at === -1 ? placed.length : at, 0, m);
  }
  return placed;
}
