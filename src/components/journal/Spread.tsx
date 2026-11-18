"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { inks, type Washi } from "@/design/tokens";
import type { CardData } from "@/lib/card-schema";
import { dotDate, monthLabel, parseDay, PEOPLE, stampDate, type Person } from "@/lib/dates";
import type { Memory, PlacedItem } from "@/lib/types";
import { Cassette, HeartIcon, Polaroid, Postmark, Stamp, Tape, Ticket, TornEdge } from "@/components/ephemera";
import { CardPocket } from "@/components/cards/CardPocket";
import { layoutFromMemory, ensureItems, isSpreadLayout } from "./spread-layout";
import j from "./journal.module.css";
import s from "./spread.module.css";

/** Every journal page is laid out at this width (page px) and scaled to fit the screen. */
export const PAGE_W = 640;
export const PAGE_MIN_H = 820;
/** Fixed parts of the left page (match the classic spread). */
export const TITLE = { x: 56, y: 83, w: 370, size: 68 };

export type Side = "left" | "right";

/** What items on the page need to know beyond their own data. */
export type SpreadCtx = {
  date: string;
  tracks: string[];
  playlistUrl?: string;
  checklist?: Memory["checklist"];
  card?: CardData;
};

// ---------------------------------------------------------------- frame

type FrameProps = {
  date: string;
  title: string;
  /** Right side of the left page's header: folder name or "No. 05". */
  label: ReactNode;
  left: ReactNode;
  right: ReactNode;
  pageRef?: (side: Side) => Ref<HTMLDivElement>;
  pageProps?: (side: Side) => HTMLAttributes<HTMLDivElement>;
  ariaLabel: string;
};

/**
 * The two-page journal spread. Pages are 640 px wide and as tall as their contents
 * (at least 820), scaled to fit; on phones they stack.
 */
export function SpreadFrame({ date, title, label, left, right, pageRef, pageProps, ariaLabel }: FrameProps) {
  const inner = { left: useRef<HTMLDivElement>(null), right: useRef<HTMLDivElement>(null) };
  const outer = { left: useRef<HTMLDivElement>(null), right: useRef<HTMLDivElement>(null) };
  const [k, setK] = useState({ left: 1, right: 1 });
  const [height, setHeight] = useState(PAGE_MIN_H);

  // Scale each page to the width it has.
  useLayoutEffect(() => {
    const ro = new ResizeObserver(() =>
      setK({
        left: Math.min(1, (outer.left.current?.clientWidth ?? PAGE_W) / PAGE_W),
        right: Math.min(1, (outer.right.current?.clientWidth ?? PAGE_W) / PAGE_W),
      }),
    );
    if (outer.left.current) ro.observe(outer.left.current);
    if (outer.right.current) ro.observe(outer.right.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Grow both pages to fit whatever is lowest on either (like a real page would need).
  useLayoutEffect(() => {
    let bottom = 0;
    (["left", "right"] as Side[]).forEach((side) => {
      const page = inner[side].current;
      if (!page) return;
      const pr = page.getBoundingClientRect();
      const scale = pr.width / PAGE_W || 1;
      page.querySelectorAll<HTMLElement>("[data-spread-item]").forEach((el) => {
        bottom = Math.max(bottom, (el.getBoundingClientRect().bottom - pr.top) / scale);
      });
    });
    const next = Math.max(PAGE_MIN_H, Math.ceil(bottom + 48));
    if (Math.abs(next - height) > 2) setHeight(next);
  });

  const setRef = (side: Side) => (el: HTMLDivElement | null) => {
    inner[side].current = el;
    const r = pageRef?.(side);
    if (typeof r === "function") r(el);
    else if (r && typeof r === "object") (r as { current: HTMLDivElement | null }).current = el;
  };

  const page = (side: Side, children: ReactNode) => (
    <div ref={outer[side]} className={`${s.pageSlot} ${side === "left" ? `${j.left} tx-lined` : `${j.right} tx-grid`}`} style={{ height: height * k[side] }}>
      <div
        {...pageProps?.(side)}
        ref={setRef(side)}
        className={`${s.page} ${pageProps?.(side).className ?? ""}`}
        style={{ height, transform: `scale(${k[side]})` }}
      >
        <div className={s.header} aria-hidden="true">
          {side === "left" ? (
            <>
              <span>{monthLabel(parseDay(date))}</span>
              {label}
            </>
          ) : (
            <>
              <span>A + J</span>
              <span>OUR SCRAPBOOK</span>
            </>
          )}
        </div>
        {side === "left" && (
          <h1 className={`display ${s.title}`} style={{ left: TITLE.x, top: TITLE.y, width: TITLE.w, fontSize: TITLE.size }}>
            {title || "untitled"}
          </h1>
        )}
        {children}
      </div>
    </div>
  );

  return (
    <article aria-label={ariaLabel} className={`${j.spread} ${s.spread}`}>
      {page("left", left)}
      {page("right", right)}
    </article>
  );
}

export const itemStyle = (it: PlacedItem): CSSProperties => ({
  left: it.x,
  top: it.y,
  zIndex: it.z,
  transform: `rotate(${it.rot}deg) scale(${it.scale})`,
});

// ---------------------------------------------------------------- items

type ItemViewProps = {
  item: PlacedItem;
  ctx: SpreadCtx;
  /** Editing: notes become text boxes, empty photo slots take uploads, links don't navigate. */
  onText?: (t: string) => void;
  onPhotos?: (f: File[]) => void;
};

/** One thing on a page (photo, note, tape, stamp…). Read-only unless edit handlers are passed. */
export function ItemView({ item, ctx, onText, onPhotos }: ItemViewProps) {
  const d = item.data ?? {};
  const still = { position: "relative" as const };
  const editing = Boolean(onText);
  const writer = (d.writer as Person) || "allyssa";
  switch (item.kind) {
    case "photo":
      if (d.src) return <Polaroid src={d.src} alt={d.alt || d.caption || "photo"} caption={d.caption} width={Number(d.w) || 210} rot={0} washi={(d.washi as Washi) ?? "plain"} lift={false} />;
      if (!onPhotos) return null;
      return <EmptyPolaroid width={Number(d.w) || 210} caption={d.caption} washi={(d.washi as Washi) ?? "plain"} onPhotos={onPhotos} />;
    case "note":
      return d.style === "slip" ? <SlipNote text={d.text ?? ""} writer={writer} width={Number(d.w) || 340} onText={onText} /> : <DiaryNote text={d.text ?? ""} writer={writer} width={Number(d.w) || 440} onText={onText} />;
    case "washi":
      // display:block — tape is an inline span, which would collapse to nothing on its own.
      return <Tape kind={(d.washi as Washi) ?? "plain"} width={120} height={28} rot={0} style={{ ...still, display: "block" }} />;
    case "stamp":
      return <Stamp src={d.src || "/scenes/lake.svg"} width={82} height={100} rot={0} lift={false} style={still} value={ctx.date.slice(8, 10)} label={d.label ?? "OUR POST"} />;
    case "postmark": {
      const day = d.date || ctx.date;
      return <Postmark text={`${(d.text || "SOMEWHERE").toUpperCase()} · ${parseDay(day).getFullYear()}`} date={dotDate(day)} size={100} rot={0} color="var(--pink-deep)" style={still} />;
    }
    case "ticket":
      return (
        <Ticket top={d.top || "ADMIT TWO"} title={d.title || "Ticket"} sub={d.sub || stampDate(d.date || ctx.date)} no={d.no || "No. 0001"}
          tint={(d.tint as "cream" | "blush" | "ice") || "cream"} rot={0} width={260} height={106} style={still} />
      );
    case "cassette":
      return (
        <div className={s.cassetteRow}>
          <Cassette title={d.title || "our playlist"} href={editing ? undefined : ctx.playlistUrl} width={250} rot={0} style={still} />
          {ctx.tracks.length > 0 && (
            <ol aria-label={`Playlist: ${d.title || "our playlist"}`} className={j.tracks} style={{ marginTop: 10 }}>
              {ctx.tracks.map((t, i) => (
                <li key={`${i}-${t}`}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {t}
                </li>
              ))}
            </ol>
          )}
        </div>
      );
    case "checklist":
      if (!ctx.checklist?.items.length) return editing ? <p className={s.placeholder}>checklist · fill it in under the page</p> : null;
      return (
        <div style={{ width: Number(d.w) || 380 }}>
          <p className={j.checkTitle} style={{ marginTop: 0 }}>{ctx.checklist.title}</p>
          <ul className={j.checklist}>
            {ctx.checklist.items.map((it, i) => (
              <li key={`${i}-${it.text}`}>
                <span aria-hidden="true">{it.done ? "☑" : "☐"}</span> {it.text}
                <span className="sr-only">{it.done ? " (done)" : " (not yet)"}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "card":
      if (!ctx.card) return editing ? <p className={s.placeholder}>card pocket · pick the card under the page</p> : null;
      return (
        <div style={{ position: "relative", width: 180, height: 189, pointerEvents: editing ? "none" : undefined }}>
          <CardPocket card={ctx.card} style={{ left: 0, top: 0 }} />
        </div>
      );
    case "heart":
      return (
        <span className={s.heart}>
          <HeartIcon size={26} fill="var(--pink-deep)" />
        </span>
      );
    default:
      return null;
  }
}

/** A blank polaroid on the page (editor only). Clicking it opens your photos; the one you pick fills it. */
function EmptyPolaroid({ width, caption, washi, onPhotos }: { width: number; caption?: string; washi: Washi; onPhotos: (f: File[]) => void }) {
  const pad = Math.max(7, Math.round(width / 20));
  return (
    <div className={s.emptyPolaroid} style={{ width, padding: `${pad}px ${pad}px 0` }}>
      <label className={s.emptyPhoto}>
        <input type="file" accept="image/*,.heic,.heif" className="sr-only" onChange={(e) => onPhotos(Array.from(e.target.files ?? []))} />
        <span aria-hidden="true" style={{ fontSize: Math.round(width / 6), lineHeight: 1 }}>+</span>
        <span className="hand" style={{ fontSize: Math.max(18, Math.round(width / 9)) }}>add a photo</span>
        <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em" }}>CLICK, DROP OR PASTE</span>
      </label>
      <div className={`hand ${s.emptyCaption}`} style={{ fontSize: Math.max(14, Math.round(width / 9)), padding: `${Math.max(6, width / 22)}px 2px ${Math.max(9, width / 14)}px` }}>
        {caption || "\u00a0"}
      </div>
      <Tape kind={washi} width={Math.round(width * 0.48)} height={Math.max(18, Math.round(width * 0.12))} rot={4} style={{ top: -12, left: `calc(50% - ${Math.round(width * 0.24)}px)` }} />
    </div>
  );
}

/** Paragraphs separated by a blank line; a line starting with "—" is a sign-off in the writer's ink. */
function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/** Diary writing straight on the page, like the classic spread. */
function DiaryNote({ text, writer, width, onText }: { text: string; writer: Person; width: number; onText?: (t: string) => void }) {
  if (onText) return <AutoTextarea value={text} onChange={onText} className={`${s.diary} ${s.editable}`} style={{ width }} placeholder="dear diary…" />;
  if (!text.trim()) return null;
  return (
    <div className={s.diary} style={{ width }}>
      {paragraphs(text).map((p, i) =>
        /^[—–-]\s?/.test(p) ? (
          <p key={i} className={j.signoff} style={{ color: inks[writer] }}>{p}</p>
        ) : (
          <p key={i}>{p}</p>
        ),
      )}
    </div>
  );
}

/** The other person's side, on a torn slip of paper with tape, in their ink. */
function SlipNote({ text, writer, width, onText }: { text: string; writer: Person; width: number; onText?: (t: string) => void }) {
  if (!onText && !text.trim()) return null;
  return (
    <div style={{ position: "relative", width }}>
      <TornEdge edge="all" seed={9} depth={5} teeth={30} surface="white" padding="22px 24px 26px">
        <p className={j.noteWho} style={{ color: inks[writer] }}>{PEOPLE[writer].name.toUpperCase()}&rsquo;S SIDE</p>
        {onText ? (
          <AutoTextarea value={text} onChange={onText} className={`${s.slip} ${s.editable}`} style={{ color: inks[writer] }} placeholder="write something…" />
        ) : (
          paragraphs(text).map((p, i) => (
            <p key={i} className={s.slip} style={{ color: inks[writer], marginTop: i ? 12 : 0 }}>{p}</p>
          ))
        )}
      </TornEdge>
      <Tape kind={writer === "justin" ? "sky" : "pink"} width={80} height={22} rot={3} style={{ left: 120, top: -10 }} />
    </div>
  );
}

/** Textarea that grows with what you write. */
function AutoTextarea({ value, onChange, className, style, placeholder }: { value: string; onChange: (v: string) => void; className: string; style?: CSSProperties; placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} aria-label="Note" className={className} placeholder={placeholder} value={value} rows={2} style={style} onChange={(e) => onChange(e.target.value)} />;
}

// ---------------------------------------------------------------- saved page

export function spreadCtx(memory: Memory, card?: CardData): SpreadCtx {
  return { date: memory.date, tracks: memory.playlist?.tracks ?? [], playlistUrl: memory.playlist?.url, checklist: memory.checklist, card };
}

/** A memory as its journal spread, exactly as arranged (or laid out like the classic spread if it never was). */
export function SpreadView({ memory, folderTitle, card }: { memory: Memory; folderTitle: string; card?: CardData }) {
  const ctx = spreadCtx(memory, card);
  const items = isSpreadLayout(memory.stickers) ? ensureItems(memory.stickers, ctx) : layoutFromMemory(memory, ctx);
  const no = memory.number ? `No. ${String(memory.number).padStart(2, "0")}` : "";
  const on = (side: Side) =>
    items
      .filter((it) => (it.page ?? "left") === side)
      .sort((a, b) => a.z - b.z)
      .map((it) => (
        <div key={it.id} data-spread-item className={s.item} style={itemStyle(it)}>
          <ItemView item={it} ctx={ctx} />
        </div>
      ));
  return (
    <SpreadFrame
      ariaLabel={`Journal spread: ${memory.title}`}
      date={memory.date}
      title={memory.title}
      label={no ? <span style={{ color: "var(--pink-deep)" }}>{no}</span> : <span>{folderTitle.toUpperCase()}</span>}
      left={on("left")}
      right={on("right")}
    />
  );
}
