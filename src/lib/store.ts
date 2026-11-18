"use client";
/**
 * Where saves go.
 *
 * - With Supabase configured (.env.local), everything lives in your project's
 *   database, and images go to the private "scrapbook" bucket. Images are stored
 *   in the data as `sb://<path>` and swapped for short-lived signed links when
 *   loaded; uploaded images (data: URLs from the editors) are uploaded on save.
 * - Without it, saves stay in this browser (localStorage): saved items override
 *   the sample content by id, and deletions are remembered as deleted ids.
 *
 * Components only use the functions exported here, so neither mode leaks into them.
 */
import type { CardData } from "./card-schema";
import { CARDS, FOLDERS, MEMORIES } from "./sample-data";
import { BUCKET, supabaseConfigured } from "./supabase/config";
import { supabase } from "./supabase/client";
import type { Folder, Memory } from "./types";

export type Book = { folders: Folder[]; memories: Memory[]; cards: CardData[] };
type Kind = keyof Book;
type Item = Folder | Memory | CardData;
const idOf = (kind: Kind, x: Item) => (kind === "folders" ? (x as Folder).slug : (x as Memory | CardData).id);

/** Fired on window whenever anything is saved or deleted, so open views refresh. */
export const CHANGE_EVENT = "scrapbook:change";
const changed = () => window.dispatchEvent(new Event(CHANGE_EVENT));

export const usingSupabase = supabaseConfigured;

// ======================================================================
// Browser storage (no Supabase yet, and the source for a one-time import)
// ======================================================================
const LOCAL = { cards: "scrapbook.cards", memories: "scrapbook.memories", folders: "scrapbook.folders", deleted: "scrapbook.deleted" } as const;
type Deleted = Record<Kind, string[]>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const localItems = <T,>(kind: Kind) => readJson<T[]>(LOCAL[kind], []);
const localDeleted = (): Deleted => ({ cards: [], memories: [], folders: [], ...readJson<Partial<Deleted>>(LOCAL.deleted, {}) });

function setLocalDeleted(kind: Kind, ids: string[], deleted: boolean) {
  const all = localDeleted();
  const rest = all[kind].filter((x) => !ids.includes(x));
  try {
    window.localStorage.setItem(LOCAL.deleted, JSON.stringify({ ...all, [kind]: deleted ? [...rest, ...ids] : rest }));
  } catch {
    /* blocked storage: the deletion just won't stick */
  }
}
/** Throws if the browser refuses to store it (usually full), so the caller can say so. */
function localUpsert(kind: Kind, item: Item) {
  const all = localItems<Item>(kind).filter((x) => idOf(kind, x) !== idOf(kind, item));
  all.push(item);
  window.localStorage.setItem(LOCAL[kind], JSON.stringify(all));
  setLocalDeleted(kind, [idOf(kind, item)], false);
}
function localRemove(kind: Kind, ids: string[]) {
  try {
    window.localStorage.setItem(LOCAL[kind], JSON.stringify(localItems<Item>(kind).filter((x) => !ids.includes(idOf(kind, x)))));
  } catch {
    /* ignore */
  }
  setLocalDeleted(kind, ids, true);
}

/** Sample items, replaced by saved ones with the same id, plus new saved ones, minus deleted ones. */
function merge<T extends Item>(kind: Kind, base: T[]): T[] {
  const saved = localItems<T>(kind);
  const deleted = localDeleted()[kind];
  const byId = new Map(saved.map((x) => [idOf(kind, x), x]));
  const out = base.map((x) => byId.get(idOf(kind, x)) ?? x);
  const baseIds = new Set(base.map((x) => idOf(kind, x)));
  out.push(...saved.filter((x) => !baseIds.has(idOf(kind, x))));
  return out.filter((x) => !deleted.includes(idOf(kind, x)));
}

// ======================================================================
// Supabase
// ======================================================================
const REF = "sb://";
/** signed link → stored ref, so saving something we loaded writes the ref back, not the expiring link. */
const signedToRef = new Map<string, string>();

function mapStrings(v: unknown, f: (s: string) => string): unknown {
  if (typeof v === "string") return f(v);
  if (Array.isArray(v)) return v.map((x) => mapStrings(x, f));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mapStrings(x, f)]));
  return v;
}
function collectStrings(v: unknown, pick: (s: string) => boolean, out = new Set<string>()): Set<string> {
  if (typeof v === "string") pick(v) && out.add(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, pick, out));
  else if (v && typeof v === "object") Object.values(v).forEach((x) => collectStrings(x, pick, out));
  return out;
}

async function uploadDataUrl(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const ext = { "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[blob.type] ?? "jpg";
  const path = `img/${hash}.${ext}`; // same image → same file, so re-saving never duplicates
  const { error } = await supabase().storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error && !/exists|duplicate/i.test(error.message)) throw error;
  return REF + path;
}

/** Before saving: upload new images, and put refs back where we handed out signed links. */
async function toStored<T>(item: T): Promise<T> {
  const uploads = collectStrings(item, (s) => s.startsWith("data:image/"));
  const refs = new Map<string, string>();
  for (const d of uploads) refs.set(d, await uploadDataUrl(d));
  return mapStrings(item, (s) => refs.get(s) ?? signedToRef.get(s) ?? s) as T;
}

/** After loading: swap refs for signed links that last a day. */
async function toDisplay(book: Book): Promise<Book> {
  const paths = [...collectStrings(book, (s) => s.startsWith(REF))].map((r) => r.slice(REF.length));
  if (!paths.length) return book;
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUrls(paths, 60 * 60 * 24);
  if (error) throw error;
  const links = new Map<string, string>();
  data.forEach((d, i) => {
    if (d.signedUrl) {
      links.set(REF + paths[i], d.signedUrl);
      signedToRef.set(d.signedUrl, REF + paths[i]);
    }
  });
  return mapStrings(book, (s) => links.get(s) ?? s) as Book;
}

async function remoteRows<T>(kind: Kind): Promise<T[]> {
  const { data, error } = await supabase().from(kind).select("data, updated_at").order("updated_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  if (kind !== "memories" || !rows.length) return rows.map((r) => r.data as T);
  // The starting content was all saved at once; anything saved more than a couple of minutes later was edited by you.
  const seededAt = Date.parse(rows[0].updated_at);
  return rows.map((r) => (Date.parse(r.updated_at) - seededAt > 120_000 ? { ...r.data, editedAt: r.updated_at } : r.data) as T);
}
async function remoteUpsert(kind: Kind, item: Item) {
  const { editedAt: _loadedOnly, ...clean } = item as Memory;
  void _loadedOnly;
  const data = await toStored(clean as Item);
  const { error } = await supabase().from(kind).upsert({ id: idOf(kind, item), data });
  if (error) throw error;
}
async function remoteDelete(kind: Kind, ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase().from(kind).delete().in("id", ids);
  if (error) throw error;
}

// ======================================================================
// What the app calls
// ======================================================================
export async function loadBook(): Promise<Book> {
  if (!usingSupabase) return { folders: merge("folders", FOLDERS), memories: merge("memories", MEMORIES), cards: merge("cards", CARDS) };
  const [rows, memories, cards] = await Promise.all([remoteRows<Folder>("folders"), remoteRows<Memory>("memories"), remoteRows<CardData>("cards")]);
  // Keep the desk in a steady order: the built-in folders as always, then custom ones (editing a folder mustn't move it).
  const builtIn = FOLDERS.map((f) => f.slug);
  const rank = (f: Folder) => (builtIn.includes(f.slug) ? builtIn.indexOf(f.slug) : builtIn.length);
  const folders = rows.map((f, i) => ({ f, i })).sort((a, b) => rank(a.f) - rank(b.f) || a.i - b.i).map(({ f }) => f);
  return toDisplay({ folders, memories, cards });
}

async function save<T extends Item>(kind: Kind, item: T): Promise<T> {
  if (usingSupabase) await remoteUpsert(kind, item);
  else localUpsert(kind, item);
  changed();
  return item;
}
async function remove(kind: Kind, ids: string[]) {
  if (usingSupabase) await remoteDelete(kind, ids);
  else localRemove(kind, ids);
}

export const saveCard = (card: CardData) => save("cards", card);
export const saveMemory = (memory: Memory) => save("memories", memory);
export const saveFolder = (folder: Folder) => save("folders", folder);

export async function deleteCard(id: string) {
  await remove("cards", [id]);
  changed();
}
export async function deleteMemory(id: string) {
  await remove("memories", [id]);
  changed();
}
/** Deletes the folder and the pages inside it (pass their ids). Cards stay in the binder. */
export async function deleteFolder(slug: string, memoryIds: string[]) {
  await remove("memories", memoryIds);
  await remove("folders", [slug]);
  changed();
}

/** Edits made in this browser before Supabase was connected, waiting to be brought over. */
export function localEditCount(): number {
  if (!usingSupabase) return 0;
  const d = localDeleted();
  return (["folders", "memories", "cards"] as Kind[]).reduce((n, k) => n + localItems(k).length + d[k].length, 0);
}
/** Copies this browser's saved edits and deletions into Supabase, then clears them here. */
export async function importLocalEdits(): Promise<void> {
  const d = localDeleted();
  for (const kind of ["folders", "memories", "cards"] as Kind[]) {
    for (const item of localItems<Item>(kind)) await remoteUpsert(kind, item);
  }
  await remoteDelete("cards", d.cards);
  await remoteDelete("memories", d.memories);
  await remoteDelete("folders", d.folders);
  Object.values(LOCAL).forEach((k) => window.localStorage.removeItem(k));
  changed();
}

/** What to tell someone when a save fails. */
export const SAVE_FAILED = usingSupabase
  ? "couldn’t save. check your connection and try again."
  : "couldn’t save, the browser’s storage may be full. try fewer or smaller photos.";

/** A save failure in plain words: no access is different from no connection. */
export function saveFailedMessage(e: unknown): string {
  const err = e as { code?: string; message?: string } | null;
  if (err?.code === "42501" || /row-level security|permission denied|unauthorized/i.test(err?.message ?? ""))
    return "this account doesn’t have access to the scrapbook yet, so nothing was saved. (it needs adding to the members list.)";
  return SAVE_FAILED;
}

export async function signOut() {
  if (usingSupabase) await supabase().auth.signOut();
  window.location.assign("/login");
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
