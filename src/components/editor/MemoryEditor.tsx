"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { inks, washi as WASHI, type Washi } from "@/design/tokens";
import { PEOPLE, stampDate, type Person } from "@/lib/dates";
import { carriedImages, imageToDataUrl, PictureError, readTransfer, type Carried } from "@/lib/images";
import { newId, saveCard, saveFailedMessage, saveMemory } from "@/lib/store";
import { addedAt, useScrapbook } from "@/lib/use-scrapbook";
import type { Folder, Memory, PageType, PlacedItem, TemplateId, TicketStub } from "@/lib/types";
import { Stamp, Tape } from "@/components/ephemera";
import { ItemView, PAGE_W, SpreadFrame, TEMPLATES, diaryHeight, ensureItems, isSpreadLayout, itemStyle, layoutFromMemory, templateItems, type Side, type SpreadCtx } from "@/components/journal";
import { manageStyles as m } from "@/components/manage";
import { PAGE_TYPES } from "./templates";
import s from "./editor.module.css";

type Props = {
  /** Defaults to every folder on the desk, custom ones included. */
  folders?: Folder[];
  /** Pre-fill, e.g. for the next monthversary. */
  draft?: Partial<Pick<Memory, "title" | "date" | "folder" | "pageType" | "number">>;
  /** Edit this saved page instead of starting a new one. */
  existing?: Memory;
  writer?: Person;
};

const DRAWER: { kind: PlacedItem["kind"]; label: string; data?: Record<string, string> }[] = [
  { kind: "note", label: "note slip", data: { text: "", style: "slip", w: "300" } },
  { kind: "note", label: "writing", data: { text: "", style: "diary", w: "440" } },
  ...WASHI.filter((w) => w !== "plain").map((w) => ({ kind: "washi" as const, label: `washi · ${w}`, data: { washi: w } })),
  { kind: "postmark", label: "postmark", data: { text: "SOMEWHERE", date: "" } },
  { kind: "ticket", label: "ticket", data: {} },
  { kind: "cassette", label: "cassette", data: { title: "our playlist" } },
  { kind: "heart", label: "heart" },
];

/** Stamp pictures to choose from (the little scenes in /public/scenes). */
const STAMPS: { src: string; label: string; text: string }[] = [
  { src: "/scenes/night.svg", label: "night", text: "CITY NIGHTS" },
  { src: "/scenes/orchard.svg", label: "apple picking", text: "APPLE PICKING" },
  { src: "/scenes/sunset.svg", label: "sunset", text: "GOLDEN HOUR" },
  { src: "/scenes/beach.svg", label: "beach", text: "BEACH DAY" },
  { src: "/scenes/lake.svg", label: "lake", text: "BY THE LAKE" },
  { src: "/scenes/ferris.svg", label: "ferris wheel", text: "FAIR RIDES" },
  { src: "/scenes/cafe.svg", label: "café", text: "COFFEE DATE" },
  { src: "/scenes/snow.svg", label: "snow", text: "FIRST SNOW" },
  { src: "/scenes/dinner.svg", label: "dinner", text: "DINNER DATE" },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const withIds = (items: Omit<PlacedItem, "id" | "z">[]): PlacedItem[] => items.map((it, n) => ({ ...it, id: newId("item"), z: n + 2, data: { ...it.data } }));

/**
 * The page editor, right on the journal spread: what you arrange here is exactly
 * what the page looks like. Start from a layout, then drag (across both pages),
 * rotate and resize anything. Details that aren't drawn on the page sit underneath.
 */
export function MemoryEditor({ folders: foldersProp, draft: draftProp = {}, existing, writer: initialWriter = "allyssa" }: Props) {
  const router = useRouter();
  const live = useScrapbook();
  const folders = foldersProp ?? live.folders;
  const draft = existing ?? draftProp;
  const [title, setTitle] = useState(draft.title ?? "");
  const [date, setDate] = useState(draft.date ?? new Date().toISOString().slice(0, 10));
  const [pageType, setPageType] = useState<PageType>(draft.pageType ?? "monthversary");
  const [folder, setFolder] = useState(draft.folder ?? PAGE_TYPES.find((p) => p.id === (draft.pageType ?? "monthversary"))!.folder);
  const [template, setTemplate] = useState<TemplateId>(existing?.template ?? "photo-note");
  const [writer, setWriter] = useState<Person>(initialWriter);
  // Details that aren't drawn on the page itself.
  const [endDate, setEndDate] = useState(existing?.endDate ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");
  const [tracks, setTracks] = useState(existing?.playlist?.tracks.join("\n") ?? "");
  const [playlistUrl, setPlaylistUrl] = useState(existing?.playlist?.url ?? "");
  const [checkTitle, setCheckTitle] = useState(existing?.checklist?.title ?? "NEXT TIME:");
  const [checkItems, setCheckItems] = useState(existing?.checklist?.items ?? []);
  const [cardId, setCardId] = useState(existing ? (existing.cardId ?? live.cards.find((c) => c.memoryId === existing.id)?.id ?? "") : "");

  const card = live.cards.find((c) => c.id === cardId);
  const trackList = tracks.split("\n").map((t) => t.trim()).filter(Boolean);
  const checklist = checkItems.filter((it) => it.text.trim());
  const ctx: SpreadCtx = { date, tracks: trackList, playlistUrl: playlistUrl.trim() || undefined, checklist: checklist.length ? { title: checkTitle, items: checklist } : undefined, card };

  const [items, setItems] = useState<PlacedItem[]>(() => {
    // Fixed ids for the starting layout so the server and browser render the same page.
    if (!existing) return templateItems("photo-note", draft.title ?? "", initialWriter).map((it, n) => ({ ...it, id: `start-${n}`, z: n + 2, data: { ...it.data } }));
    const startCtx: SpreadCtx = { date: existing.date, tracks: existing.playlist?.tracks ?? [], checklist: existing.checklist, card: live.cards.find((c) => c.id === existing.cardId) };
    const base = isSpreadLayout(existing.stickers) ? existing.stickers : layoutFromMemory(existing, startCtx);
    return ensureItems(base, startCtx).map((i) => ({ ...i, id: i.id.startsWith("auto-") || i.id.startsWith("need-") ? newId("item") : i.id, data: { ...i.data } }));
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snap, setSnap] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const pages = useRef<Record<Side, HTMLDivElement | null>>({ left: null, right: null });
  /** A press on an item; it becomes a drag once the pointer moves a few px (so a plain click still works, e.g. to upload a photo). */
  const drag = useRef<{ id: string; dx: number; dy: number; sx: number; sy: number; el: HTMLElement; pointerId: number; active: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dropSlot, setDropSlot] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState("");

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const patch = (id: string, p: Partial<PlacedItem>) => setItems((all) => all.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const patchData = (id: string, d: Record<string, string>) => setItems((all) => all.map((i) => (i.id === id ? { ...i, data: { ...i.data, ...d } } : i)));
  const topZ = () => Math.max(0, ...items.map((i) => i.z)) + 1;

  /** Pointer position in page px, on whichever page it's over (or the nearest). */
  const pagePoint = (clientX: number, clientY: number): { side: Side; x: number; y: number } => {
    let best: { side: Side; x: number; y: number; dist: number } | null = null;
    for (const side of ["left", "right"] as Side[]) {
      const el = pages.current[side];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const k = r.width / PAGE_W || 1;
      const dist = clientX < r.left ? r.left - clientX : clientX > r.right ? clientX - r.right : 0;
      const distY = clientY < r.top ? r.top - clientY : clientY > r.bottom ? clientY - r.bottom : 0;
      const p = { side, x: (clientX - r.left) / k, y: (clientY - r.top) / k, dist: dist + distY };
      if (!best || p.dist < best.dist) best = p;
    }
    return best ?? { side: "left", x: 100, y: 200 };
  };

  const add = (kind: PlacedItem["kind"], data: Record<string, string> = {}) => {
    const side: Side = selected?.page ?? "right";
    const item: PlacedItem = { id: newId("item"), kind, page: side, x: 120 + Math.round(Math.random() * 160), y: 200 + Math.round(Math.random() * 200), rot: Math.round(Math.random() * 8 - 4), scale: 1, z: topZ(), data: { ...data, writer } };
    setItems((all) => [...all, item]);
    setSelectedId(item.id);
  };

  /** Converts pictures (HEIC included); says on screen which ones couldn't be used instead of failing quietly. */
  const toSrcs = async (files: File[]) => {
    const out: string[] = [];
    for (const f of files) {
      try {
        out.push(await imageToDataUrl(f));
      } catch (e) {
        setPhotoMsg(e instanceof PictureError ? e.message : `couldn’t read “${f.name}”. try a JPG or PNG?`);
      }
    }
    return out;
  };

  const addPhotos = async (files: File[], at?: { side: Side; x: number; y: number }) => {
    if (!files.length) return;
    setPhotoMsg("");
    const srcs = await toSrcs(files);
    srcs.forEach((src, n) => {
      const item: PlacedItem = { id: newId("item"), kind: "photo", page: at?.side ?? "right", x: (at?.x ?? 320) - 105 + n * 24, y: (at?.y ?? 320) - 100 + n * 24, rot: -3 + n * 3, scale: 1, z: topZ() + n, data: { src, alt: "", caption: "", w: "210" } };
      setItems((all) => [...all, item]);
      setSelectedId(item.id);
    });
  };

  /** Put a picture into this polaroid (any extra pictures go next to it). */
  const fillPhoto = async (id: string, files: File[]) => {
    if (!files.length) return;
    setPhotoMsg("");
    const [src, ...more] = await toSrcs(files);
    if (!src) return;
    patchData(id, { src, alt: "" });
    setSelectedId(id); // so the caption and "what's in the photo" fields are right there
    const slot = items.find((i) => i.id === id);
    more.forEach((m, n) => {
      const item: PlacedItem = { id: newId("item"), kind: "photo", page: slot?.page ?? "right", x: (slot?.x ?? 100) + 230 + n * 24, y: (slot?.y ?? 200) + 20 + n * 24, rot: 3, scale: 1, z: topZ() + n + 1, data: { src: m, alt: "", caption: "", w: "210" } };
      setItems((all) => [...all, item]);
    });
  };

  /** Pictures dropped or pasted: into a polaroid if there is one to fill, otherwise onto the page. */
  const takePictures = async (carried: Carried, slot: string | null, at?: { side: Side; x: number; y: number }) => {
    let files: File[];
    try {
      files = await carriedImages(carried);
    } catch (e) {
      setPhotoMsg(e instanceof PictureError ? e.message : "couldn’t use that picture.");
      return;
    }
    if (!files.length) {
      setPhotoMsg("that didn’t have a picture in it. try dragging the photo file itself, or copy the picture and paste it.");
      return;
    }
    if (slot) await fillPhoto(slot, files);
    else await addPhotos(files, at);
  };

  // Paste a picture: it goes into the selected polaroid (blank or not), or onto the page as a new one.
  const pasteRef = useRef<(e: ClipboardEvent) => void>(() => {});
  pasteRef.current = (e: ClipboardEvent) => {
    const carried = readTransfer(e.clipboardData);
    if (!carried.files.length && !(carried.url && /^(https?:|data:image)/.test(carried.url) && !(e.target as HTMLElement)?.closest?.("input, textarea"))) return; // plain text: let it paste normally
    e.preventDefault();
    const sel = items.find((i) => i.id === selectedId && i.kind === "photo");
    const blank = items.find((i) => i.kind === "photo" && !i.data?.src);
    void takePictures(carried, sel?.id ?? blank?.id ?? null);
  };
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => pasteRef.current(e);
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const applyTemplate = (id: TemplateId) => {
    const next = withIds(templateItems(id, title, writer));
    // Carry what's already written and placed into the new layout's slots; anything left over is kept too.
    const carry = (kind: PlacedItem["kind"], has: (i: PlacedItem) => boolean, keys: string[]) => {
      const mine = items.filter((i) => i.kind === kind && has(i));
      const slots = next.filter((i) => i.kind === kind);
      mine.forEach((it, n) => {
        if (slots[n]) slots[n].data = { ...slots[n].data, ...Object.fromEntries(keys.filter((k) => it.data?.[k] !== undefined).map((k) => [k, it.data![k]])) };
        else next.push({ ...it, z: next.length + 2 });
      });
    };
    carry("photo", (i) => Boolean(i.data?.src), ["src", "alt", "caption"]);
    carry("note", (i) => Boolean(i.data?.text?.trim()), ["text", "writer"]);
    carry("postmark", (i) => Boolean(i.data?.text?.trim()) && i.data!.text !== "SOMEWHERE", ["text", "date"]);
    carry("ticket", (i) => Boolean(i.data?.title?.trim()), ["top", "title", "sub", "date", "no", "tint"]);
    items.filter((i) => ["washi", "stamp", "heart", "checklist", "card"].includes(i.kind)).forEach((i) => next.push(i));
    // Photos on the left page go below whatever is already written there.
    const diary = next.find((i) => i.kind === "note" && i.page === "left" && i.data?.style !== "slip");
    const leftPhotos = next.filter((i) => i.kind === "photo" && i.page === "left");
    if (diary && leftPhotos.length) {
      const below = diary.y + diaryHeight(diary.data?.text || " ") + 48;
      const shift = below - Math.min(...leftPhotos.map((i) => i.y));
      if (shift > 0) leftPhotos.forEach((i) => (i.y += shift));
    }
    setTemplate(id);
    setItems(next);
    setSelectedId(null);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>, item: PlacedItem) => {
    // Typing in a note or a field stays typing; notes move by their grip.
    if (e.button !== 0 || (e.target as HTMLElement).closest("textarea, select, button, input:not([type=file])")) return;
    const p = pagePoint(e.clientX, e.clientY);
    drag.current = { id: item.id, dx: p.x - item.x, dy: p.y - item.y, sx: e.clientX, sy: e.clientY, el: e.currentTarget, pointerId: e.pointerId, active: false };
    setSelectedId(item.id);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.active) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5) return;
      d.active = true;
      suppressClick.current = true; // the click that ends a drag shouldn't open the photo picker
      try {
        d.el.setPointerCapture(d.pointerId);
      } catch {
        /* element re-rendered; moves still reach the page */
      }
      patch(d.id, { z: topZ() });
    }
    const p = pagePoint(e.clientX, e.clientY);
    let x = clamp(p.x - d.dx, -60, PAGE_W - 40);
    let y = clamp(p.y - d.dy, -40, 4000);
    if (snap) {
      x = Math.round(x / 8) * 8;
      y = Math.round(y / 8) * 8;
    }
    patch(d.id, { page: p.side, x, y });
  };
  const endDrag = () => {
    drag.current = null;
    setTimeout(() => (suppressClick.current = false), 0);
  };

  const onItemKey = (e: KeyboardEvent<HTMLDivElement>, item: PlacedItem) => {
    if ((e.target as HTMLElement).closest("textarea, input")) return;
    const step = e.shiftKey ? 24 : 4;
    const moves: Record<string, Partial<PlacedItem>> = {
      ArrowLeft: { x: item.x - step },
      ArrowRight: { x: item.x + step },
      ArrowUp: { y: item.y - step },
      ArrowDown: { y: item.y + step },
      "[": { rot: item.rot - (e.shiftKey ? 5 : 1) },
      "]": { rot: item.rot + (e.shiftKey ? 5 : 1) },
    };
    if (moves[e.key]) {
      e.preventDefault();
      patch(item.id, moves[e.key]);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove(item.id);
    } else if (e.key === "Escape") {
      setSelectedId(null);
    }
  };

  const remove = (id: string) => {
    setItems((all) => all.filter((i) => i.id !== id));
    setSelectedId(null);
  };
  const duplicate = (item: PlacedItem) => {
    const copy = { ...item, id: newId("item"), x: item.x + 24, y: item.y + 24, z: topZ(), data: { ...item.data } };
    setItems((all) => [...all, copy]);
    setSelectedId(copy.id);
  };

  const save = async () => {
    setSaving(true);
    setSaveError("");
    // Reading order: left page then right, top to bottom.
    const reading = items.slice().sort((a, b) => (a.page === b.page ? a.y - b.y || a.x - b.x : a.page === "left" ? -1 : 1));
    const notes = reading.filter((i) => i.kind === "note" && i.data?.text?.trim());
    // What the page shows is also saved as plain fields, for folder covers, the desk and cards.
    const postmark = items.find((i) => i.kind === "postmark" && i.data?.text?.trim() && i.data.text.trim() !== "SOMEWHERE");
    const tickets: TicketStub[] = reading
      .filter((i) => i.kind === "ticket")
      .map((i, n) => ({ top: i.data?.top || "ADMIT TWO", title: i.data?.title?.trim() || "Ticket", sub: i.data?.sub || stampDate(i.data?.date || date), no: i.data?.no || `No. ${String(n + 1).padStart(4, "0")}`, tint: (i.data?.tint as TicketStub["tint"]) || undefined }));
    const cassette = items.find((i) => i.kind === "cassette");
    const writers = [...new Set(notes.map((n) => (n.data?.writer as Person) ?? "allyssa"))];
    const memory: Memory = {
      ...existing,
      id: existing?.id ?? newId(pageType),
      folder,
      title: title.trim() || "untitled page",
      date,
      endDate: endDate && endDate > date ? endDate : undefined,
      pageType,
      template,
      number: draft.number,
      summary: summary.trim() || (notes[0]?.data?.text ?? "").split("\n")[0].slice(0, 80),
      diary: writers.map((p) => ({
        author: p,
        paragraphs: notes.filter((n) => ((n.data?.writer as Person) ?? "allyssa") === p).flatMap((n) => n.data!.text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)),
      })),
      photos: reading.filter((i) => i.kind === "photo" && i.data?.src).map((i) => ({ src: i.data!.src, alt: i.data!.alt?.trim() || i.data!.caption?.trim() || `a photo from “${title.trim() || "our page"}”`, caption: i.data!.caption || undefined, washi: (i.data!.washi as Washi) || undefined })),
      location: postmark ? { name: postmark.data!.text.trim(), date: postmark.data!.date && postmark.data!.date !== date ? postmark.data!.date : undefined } : undefined,
      tickets,
      playlist: cassette || trackList.length ? { title: cassette?.data?.title?.trim() || existing?.playlist?.title || "our playlist", tracks: trackList, url: playlistUrl.trim() || undefined } : undefined,
      checklist: checklist.length ? { title: checkTitle.trim() || "NEXT TIME:", items: checklist } : undefined,
      cardId: cardId || undefined,
      // Card / checklist spots with nothing to show aren't kept.
      stickers: items.filter((i) => !(i.kind === "card" && !card) && !(i.kind === "checklist" && !checklist.length)),
      scene: undefined,
      // Keep when the page was first added; a starting page you fill in for the first time counts as added now.
      createdAt: existing?.createdAt ?? (existing && addedAt(existing) > 0 ? new Date(addedAt(existing)).toISOString() : new Date().toISOString()),
    };
    try {
      await saveMemory(memory);
      // Keep the card ↔ page link the same from both sides.
      if (existing?.cardId && existing.cardId !== cardId) {
        const old = live.cards.find((c) => c.id === existing.cardId);
        if (old?.memoryId === memory.id) await saveCard({ ...old, memoryId: undefined });
      }
      if (card && card.memoryId !== memory.id) await saveCard({ ...card, memoryId: memory.id });
    } catch (e) {
      setSaving(false);
      setSaveError(saveFailedMessage(e));
      return;
    }
    router.push(`/memories/${memory.id}`);
  };

  const field = `${s.input}`;
  const folderTitle = folders.find((f) => f.slug === folder)?.title ?? "";
  const shown = ensureItems(items, ctx);
  const onPage = (side: Side) =>
    shown
      .filter((i) => (i.page ?? "left") === side)
      .sort((a, b) => a.z - b.z)
      .map((item) => {
        const real = items.some((i) => i.id === item.id);
        return (
          <div
            key={item.id}
            data-spread-item
            data-item-id={item.id}
            data-empty-photo={item.kind === "photo" && !item.data?.src ? "" : undefined}
            role="group"
            aria-roledescription="page item"
            aria-label={`${item.kind}${item.data?.caption ? `: ${item.data.caption}` : ""}. Arrow keys move, [ and ] rotate, Delete removes.`}
            tabIndex={0}
            className={`${s.item} ${item.id === selectedId ? s.selected : ""} ${item.id === dropSlot ? s.dropTarget : ""}`}
            style={itemStyle(item)}
            onPointerDown={(e) => {
              // A checklist / card shown because it was filled in below becomes a real item once touched.
              if (!real) setItems((all) => [...all, { ...item, id: item.id }]);
              onPointerDown(e, item);
            }}
            onClickCapture={(e) => {
              if (suppressClick.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onFocus={() => setSelectedId(item.id)}
            onKeyDown={(e) => onItemKey(e, item)}
          >
            {item.kind === "note" && (
              <span className={s.grip} title="drag to move" aria-hidden="true">⠿ move</span>
            )}
            <ItemView item={item} ctx={ctx} onText={(text) => patchData(item.id, { text })} onPhotos={(f) => fillPhoto(item.id, f)} />
            {item.id === selectedId && (
              <span aria-hidden="true" className={s.badge}>
                {Math.round(item.rot)}° · {Math.round(item.scale * 100)}%
              </span>
            )}
          </div>
        );
      });

  return (
    <>
      <form aria-label="Page details" className={s.toolbar} onSubmit={(e) => (e.preventDefault(), save())}>
        <label className="sr-only" htmlFor="page-title">Title</label>
        <input id="page-title" className={s.titleInput} placeholder="give this page a title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className={s.inline}>
          DATE <input type="date" className={field} required value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        <label className={s.inline}>
          UNTIL <input type="date" className={field} value={endDate} min={date} aria-describedby="until-hint" onChange={(e) => setEndDate(e.target.value)} />
          <span id="until-hint" className="sr-only">optional, for trips that last more than a day</span>
        </label>
        <label className={s.inline}>
          FOLDER
          <select className={field} value={folder} onChange={(e) => setFolder(e.target.value)}>
            {folders.filter((f) => f.kind === "memories").map((f) => (
              <option key={f.slug} value={f.slug}>{f.title}</option>
            ))}
          </select>
        </label>
        <button type="submit" className={`${s.saveStamp} lift`} disabled={saving}>{saving ? "SAVING…" : existing ? "SAVE CHANGES" : "SAVE PAGE"}</button>
        {saveError && <p role="alert" className="hand" style={{ flexBasis: "100%", margin: 0, fontSize: 22, color: "var(--pink-deep)" }}>{saveError}</p>}
      </form>

      <div className={s.optionsRow} role="group" aria-label="Page options">
        <div className={s.optionGroup}>
          <label className={s.groupLabel} htmlFor="page-type">KIND OF PAGE</label>
          <select id="page-type" className={field} value={pageType}
            onChange={(e) => {
              const pt = e.target.value as PageType;
              setPageType(pt);
              if (!existing) setFolder(PAGE_TYPES.find((p) => p.id === pt)!.folder);
            }}>
            {PAGE_TYPES.map((p) => (
              <option key={p.id} value={p.id}>for: {p.label}</option>
            ))}
          </select>
        </div>
        <div className={s.optionGroup}>
          <p className={s.groupLabel}>{existing ? "REARRANGE AS" : "START FROM A TEMPLATE"}</p>
          <ul className={s.templateRow}>
            {TEMPLATES.map((t) => (
              <li key={t.id}>
                <button type="button" aria-pressed={template === t.id} className={s.templateButton} onClick={() => applyTemplate(t.id)}>
                  <span className={s.templateThumb} aria-hidden="true">
                    <span className={`tx-lined ${s.thumbPage}`} />
                    <span className={`tx-grid ${s.thumbPage}`} style={{ left: "50%" }} />
                    {templateItems(t.id, "untitled", writer).map((it, n) => (
                      <span key={n} className={s.thumbItem} data-kind={it.kind}
                        style={{ left: `${((it.page === "right" ? 640 : 0) + it.x) / 12.8}%`, top: `${(it.y / 820) * 100}%`, width: thumbWidth(it), transform: `rotate(${it.rot}deg)` }} />
                    ))}
                  </span>
                  <span className="hand" style={{ fontSize: 20 }}>{t.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className={s.optionGroup} role="group" aria-label="Whose ink">
          <p className={s.groupLabel}>NEW NOTES IN WHOSE INK?</p>
          <div style={{ display: "flex", gap: 10 }}>
            {(["allyssa", "justin"] as Person[]).map((p) => (
              <button key={p} type="button" aria-pressed={writer === p} className={s.inkButton} style={{ color: inks[p] }} onClick={() => setWriter(p)}>
                {PEOPLE[p].name}
              </button>
            ))}
          </div>
          <label className={s.check} style={{ marginTop: 4 }}>
            <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} /> snap while dragging
          </label>
        </div>
      </div>

      <div className={s.workArea}>
        <section aria-label="Journal spread" className={s.pageColumn}>
          <SpreadFrame
            ariaLabel={`Editing: ${title || "untitled page"}`}
            date={date}
            title={title}
            label={draft.number ? <span style={{ color: "var(--pink-deep)" }}>No. {String(draft.number).padStart(2, "0")}</span> : <span>{folderTitle.toUpperCase()}</span>}
            left={onPage("left")}
            right={onPage("right")}
            pageRef={(side) => (el: HTMLDivElement | null) => void (pages.current[side] = el)}
            pageProps={() => ({
              className: s.editPage,
              onPointerMove,
              onPointerUp: endDrag,
              onPointerCancel: endDrag,
              onPointerDown: (e) => e.target === e.currentTarget && setSelectedId(null),
              onDragOver: (e) => {
                e.preventDefault();
                // Light up a blank polaroid while a picture is dragged over it.
                const slot = (e.target as HTMLElement).closest<HTMLElement>("[data-empty-photo]")?.dataset.itemId ?? null;
                if (slot !== dropSlot) setDropSlot(slot);
              },
              onDragLeave: (e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropSlot(null);
              },
              onDrop: (e) => {
                e.preventDefault();
                setDropSlot(null);
                // Dropped on a blank polaroid: fill it. Anywhere else: a new polaroid where it landed.
                const slot = (e.target as HTMLElement).closest<HTMLElement>("[data-empty-photo]")?.dataset.itemId ?? null;
                void takePictures(readTransfer(e.dataTransfer), slot, pagePoint(e.clientX, e.clientY));
              },
            })}
          />
        </section>

        <aside aria-label="Sticker drawer and properties" className={`tx-kraft ${s.drawer}`}>
          <div className={s.drawerScroll}>
          <p className={s.groupLabelLight}>STICKER DRAWER</p>
          <ul className={s.drawerGrid}>
            <li>
              <button type="button" className={s.drawerItem} aria-label="Add photo" onClick={() => add("photo", { caption: "", w: "210", washi: "plain" })}>
                <span className={s.addPhoto} aria-hidden="true">+</span>
                <span className={s.drawerLabel}>photo</span>
              </button>
            </li>
            {DRAWER.map((d) => (
              <li key={d.label}>
                <button type="button" className={s.drawerItem} onClick={() => add(d.kind, d.data)} aria-label={`Add ${d.label}`}>
                  <DrawerPreview kind={d.kind} washi={d.data?.washi as Washi | undefined} />
                  <span className={s.drawerLabel}>{d.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <p className={s.groupLabelLight} style={{ marginTop: 18 }}>STAMPS</p>
          <ul className={s.stampGrid}>
            {STAMPS.map((st) => (
              <li key={st.src}>
                <button type="button" className={s.drawerItem} aria-label={`Add ${st.label} stamp`} onClick={() => add("stamp", { src: st.src, label: st.text })}>
                  <Stamp src={st.src} width={46} height={56} rot={0} lift={false} style={{ position: "relative" }} />
                  <span className={s.drawerLabel}>{st.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
          <div className={s.props}>
            <p className={s.groupLabelLight}>SELECTED · {selected.kind === "note" ? (selected.data?.style === "slip" ? "NOTE SLIP" : "WRITING") : selected.kind.toUpperCase()}</p>
            <label className={s.slider}>
              <span>ROTATE <b>{Math.round(selected.rot)}°</b></span>
              <input type="range" min={-20} max={20} value={selected.rot} onChange={(e) => patch(selected.id, { rot: Number(e.target.value) })} />
            </label>
            <label className={s.slider}>
              <span>SIZE <b>{Math.round(selected.scale * 100)}%</b></span>
              <input type="range" min={40} max={200} value={Math.round(selected.scale * 100)} onChange={(e) => patch(selected.id, { scale: Number(e.target.value) / 100 })} />
            </label>
            {selected.kind === "note" && (
              <>
                <div role="group" aria-label="Whose ink" className={s.slider}>
                  <span>WHOSE INK</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["allyssa", "justin"] as Person[]).map((p) => (
                      <button key={p} type="button" aria-pressed={(selected.data?.writer ?? "allyssa") === p} className={s.inkButton} style={{ color: inks[p] }} onClick={() => patchData(selected.id, { writer: p })}>
                        {PEOPLE[p].name}
                      </button>
                    ))}
                  </div>
                </div>
                <div role="group" aria-label="Note style" className={s.slider}>
                  <span>STYLE</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {([["diary", "on the page"], ["slip", "paper slip"]] as const).map(([v, label]) => (
                      <button key={v} type="button" aria-pressed={(selected.data?.style ?? "diary") === v} className={s.inkButton} style={{ color: "var(--ink)", fontSize: 18 }}
                        onClick={() => patchData(selected.id, { style: v, w: v === "slip" ? "340" : "440" })}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {selected.kind === "photo" && (
              <>
                <label className={s.slider}>
                  <span>CAPTION <span style={{ fontWeight: 400 }}>(optional)</span></span>
                  <input className={s.lightInput} value={selected.data?.caption ?? ""} onChange={(e) => patchData(selected.id, { caption: e.target.value })} />
                </label>
                <label className={s.slider}>
                  <span>ALT TEXT <span style={{ fontWeight: 400 }}>(optional · what&rsquo;s in the photo)</span></span>
                  <input className={s.lightInput} value={selected.data?.alt ?? ""} onChange={(e) => patchData(selected.id, { alt: e.target.value })} />
                </label>
                <label className={s.slider}>
                  <span>NEW PHOTO</span>
                  <input type="file" accept="image/*,.heic,.heif" className={s.lightInput}
                    onChange={(e) => void fillPhoto(selected.id, Array.from(e.target.files ?? []))} />
                </label>
              </>
            )}
            {selected.kind === "stamp" && (
              <>
                <div className={s.slider} role="group" aria-label="Stamp picture">
                  <span>PICTURE</span>
                  <div className={s.stampChoices}>
                    {STAMPS.map((st) => (
                      <button key={st.src} type="button" aria-pressed={(selected.data?.src || "/scenes/lake.svg") === st.src} aria-label={st.label} title={st.label}
                        className={s.stampChoice} onClick={() => patchData(selected.id, { src: st.src, label: STAMPS.some((x) => x.text === selected.data?.label) || !selected.data?.label ? st.text : selected.data.label })}>
                        <Stamp src={st.src} width={36} height={44} rot={0} lift={false} style={{ position: "relative" }} />
                      </button>
                    ))}
                  </div>
                </div>
                <label className={s.slider}>
                  <span>WORDS ON THE STAMP</span>
                  <input className={s.lightInput} value={selected.data?.label ?? "OUR POST"} onChange={(e) => patchData(selected.id, { label: e.target.value.toUpperCase() })} />
                </label>
              </>
            )}
            {selected.kind === "postmark" && (
              <>
                <label className={s.slider}>
                  <span>PLACE</span>
                  <input className={s.lightInput} value={selected.data?.text ?? ""} onChange={(e) => patchData(selected.id, { text: e.target.value.toUpperCase() })} />
                </label>
                <label className={s.slider}>
                  <span>DATE</span>
                  <input type="date" className={s.lightInput} value={selected.data?.date || date} onChange={(e) => patchData(selected.id, { date: e.target.value })} />
                </label>
              </>
            )}
            {selected.kind === "ticket" && (
              <>
                <label className={s.slider}>
                  <span>TOP LINE</span>
                  <input className={s.lightInput} value={selected.data?.top ?? "ADMIT TWO"} onChange={(e) => patchData(selected.id, { top: e.target.value })} />
                </label>
                <label className={s.slider}>
                  <span>WHAT FOR</span>
                  <input className={s.lightInput} placeholder="Movie night" value={selected.data?.title ?? ""} onChange={(e) => patchData(selected.id, { title: e.target.value })} />
                </label>
                <label className={s.slider}>
                  <span>DATE</span>
                  <input type="date" className={s.lightInput} value={selected.data?.date || date} onChange={(e) => patchData(selected.id, { date: e.target.value, sub: "" })} />
                </label>
                <label className={s.slider}>
                  <span>SMALL PRINT</span>
                  <input className={s.lightInput} value={selected.data?.sub || stampDate(selected.data?.date || date)} onChange={(e) => patchData(selected.id, { sub: e.target.value })} />
                </label>
              </>
            )}
            {selected.kind === "cassette" && (
              <label className={s.slider}>
                <span>CASSETTE LABEL <span style={{ fontWeight: 400 }}>(songs go under the page)</span></span>
                <input className={s.lightInput} value={selected.data?.title ?? ""} onChange={(e) => patchData(selected.id, { title: e.target.value })} />
              </label>
            )}
            {(selected.kind === "checklist" || selected.kind === "card") && (
              <p className={s.groupLabelLight} style={{ fontWeight: 400, letterSpacing: ".04em" }}>
                {selected.kind === "checklist" ? "write the checklist under the page." : "pick the card under the page."}
              </p>
            )}
            <div className={s.propButtons}>
              <button type="button" onClick={() => patch(selected.id, { z: topZ() })}>↑ to front</button>
              <button type="button" onClick={() => patch(selected.id, { z: Math.min(...items.map((i) => i.z)) - 1 })}>↓ to back</button>
              <button type="button" onClick={() => duplicate(selected)}>duplicate</button>
              <button type="button" onClick={() => remove(selected.id)}>remove</button>
              <button type="button" onClick={() => setSelectedId(null)}>done</button>
            </div>
          </div>
          )}
          <Link href={existing ? `/memories/${existing.id}` : "/"} className={s.cancel}>leave without saving</Link>
          </div>
        </aside>
      </div>
      {photoMsg && (
        <p role="alert" className={s.photoMsg}>
          {photoMsg} <button type="button" onClick={() => setPhotoMsg("")}>ok</button>
        </p>
      )}
      <p className={s.help}>Drag anything, even across to the other page. Notes move by their ⠿ grip. Drop or paste photos onto a blank polaroid to fill it (or select a polaroid, then paste), or drop anywhere on the spread for a new one. Arrow keys move the selected thing; [ and ] turn it.</p>

      <section aria-labelledby="details-heading" className={`tx-lined ${s.details}`}>
        <h2 id="details-heading" className={s.detailsTitle}>PAGE DETAILS</h2>
        <div className={s.detailsGrid}>
          <label className={s.dField}>
            <span className={s.dLabel}>ONE-LINE SUMMARY</span>
            <span className={s.dHint}>shown in the folder · left empty, the first line of the first note</span>
            <input className={m.input} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>
          <label className={s.dField}>
            <span className={s.dLabel}>CARD IN THE CORNER POCKET</span>
            <span className={s.dHint}>shows on the page</span>
            <select className={m.select} value={cardId} onChange={(e) => setCardId(e.target.value)}>
              <option value="">no card</option>
              {live.cards.map((c) => (
                <option key={c.id} value={c.id}>{c.occasion.title} · {stampDate(c.occasion.date)}</option>
              ))}
            </select>
          </label>

          <label className={s.dField}>
            <span className={s.dLabel}>PLAYLIST LINK</span>
            <span className={s.dHint}>optional · the cassette opens it</span>
            <input type="url" className={m.input} value={playlistUrl} onChange={(e) => setPlaylistUrl(e.target.value)} />
          </label>
          <label className={s.dField}>
            <span className={s.dLabel}>CHECKLIST HEADING</span>
            <span className={s.dHint}>the checklist shows on the page</span>
            <input className={m.input} value={checkTitle} onChange={(e) => setCheckTitle(e.target.value)} />
          </label>

          <label className={s.dField}>
            <span className={s.dLabel}>SONGS ON THE CASSETTE</span>
            <span className={s.dHint}>one per line · shows next to the cassette</span>
            <textarea className={`${m.input} ${s.dTextarea}`} rows={5} value={tracks} onChange={(e) => setTracks(e.target.value)} />
          </label>
          <div className={s.dField} role="group" aria-labelledby="check-items-label">
            <span id="check-items-label" className={s.dLabel}>CHECKLIST ITEMS</span>
            <span className={s.dHint}>tick the ones you&rsquo;ve done</span>
            <div className={s.checkItems}>
              {checkItems.map((it, i) => (
                <div key={i} className={s.checkRow}>
                  <input type="checkbox" aria-label={`Done: ${it.text || "item"}`} checked={it.done} className={s.checkBox}
                    onChange={(e) => setCheckItems((all) => all.map((x, n) => (n === i ? { ...x, done: e.target.checked } : x)))} />
                  <input className={m.input} aria-label="Checklist item" value={it.text}
                    onChange={(e) => setCheckItems((all) => all.map((x, n) => (n === i ? { ...x, text: e.target.value } : x)))} />
                  <button type="button" className={m.pill} onClick={() => setCheckItems((all) => all.filter((_, n) => n !== i))}>remove</button>
                </div>
              ))}
              <button type="button" className={m.pill} style={{ alignSelf: "flex-start" }} onClick={() => setCheckItems((all) => [...all, { text: "", done: false }])}>+ add an item</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** Rough width of an item in a template preview (% of the two-page thumbnail). */
function thumbWidth(it: { kind: PlacedItem["kind"]; data?: Record<string, string> }) {
  const w = it.kind === "note" ? Number(it.data?.w) || 300 : it.kind === "photo" ? Number(it.data?.w) || 210 : it.kind === "ticket" ? 260 : it.kind === "cassette" ? 250 : it.kind === "postmark" ? 100 : 120;
  return `${w / 12.8}%`;
}

function DrawerPreview({ kind, washi }: { kind: PlacedItem["kind"]; washi?: Washi }) {
  if (kind === "washi") return <Tape kind={washi ?? "plain"} width={70} height={20} rot={0} style={{ position: "relative" }} />;
  return <span aria-hidden="true" className={s.preview} data-kind={kind} />;
}
