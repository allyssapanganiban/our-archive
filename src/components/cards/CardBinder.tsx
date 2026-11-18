"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CardData, FrameType } from "@/lib/card-schema";
import { parseDay, stampDate, type UpcomingEvent } from "@/lib/dates";
import { HoloTilt } from "./HoloTilt";
import { TradingCard } from "./TradingCard";
import { TradingCardSleeve } from "./TradingCardSleeve";
import { PaperClip } from "@/components/ephemera";
import { ConfirmDelete, manageStyles as m } from "@/components/manage";
import { SAVE_FAILED } from "@/lib/store";
import b from "./binder.module.css";

type FrameFilter = "all" | FrameType;
const FRAME_FILTERS: { id: FrameFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "standard", label: "standard" },
  { id: "prism", label: "prism" },
  { id: "star", label: "star full-art" },
];
const FRAME_LABEL: Record<FrameType, string> = { standard: "Standard", prism: "Prism holo", star: "Star full-art" };
const POCKETS_PER_PAGE = 9;

type Props = {
  cards: CardData[];
  initialCardId?: string;
  /** Title of each card's memory, keyed by memory id, for the "open the memory" link. */
  memoryTitles?: Record<string, string>;
  /** Next occasion, shown in the empty "make the next one" pocket. */
  nextEvent?: UpcomingEvent;
  onDownload?: (card: CardData) => void;
  /** Turn on edit + delete in the index card. */
  onSave?: (card: CardData) => Promise<void>;
  onDelete?: (card: CardData) => Promise<void>;
};

/** Binder view of our cards: filter, pick a pocket, see it big with tilt + holo. */
export function CardBinder({ cards, initialCardId, memoryTitles = {}, nextEvent, onDownload, onSave, onDelete }: Props) {
  const [frame, setFrame] = useState<FrameFilter>("all");
  const years = useMemo(() => Array.from(new Set(cards.map((c) => c.occasion.date.slice(0, 4)))).sort().reverse(), [cards]);
  const [year, setYear] = useState<string>("all");
  const [selectedId, setSelectedId] = useState(initialCardId ?? cards[0]?.id);
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(false);

  const visible = (c: CardData) => (frame === "all" || c.frame === frame) && (year === "all" || c.occasion.date.startsWith(year));
  const pages = Math.max(1, Math.ceil((cards.length + 1) / POCKETS_PER_PAGE));
  const pageCards = cards.slice(page * POCKETS_PER_PAGE, (page + 1) * POCKETS_PER_PAGE);
  const selected = cards.find((c) => c.id === selectedId) ?? cards[0];
  const empties = Math.max(0, POCKETS_PER_PAGE - pageCards.length - (page === pages - 1 ? 1 : 0));

  return (
    <>
      <div role="group" aria-label="Filter cards" className={b.filters}>
        <span className={b.filterLabel}>FRAME</span>
        {FRAME_FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={frame === f.id} className={b.pill} onClick={() => setFrame(f.id)}>
            {f.label}
          </button>
        ))}
        <span className={b.filterLabel} style={{ marginLeft: 18 }}>YEAR</span>
        {["all", ...years].map((y) => (
          <button key={y} type="button" aria-pressed={year === y} className={b.pill} onClick={() => setYear(y)}>
            {y}
          </button>
        ))}
      </div>

      <div className={b.layout}>
        <section aria-label={`Binder page ${page + 1} of ${pages}`} className={b.binder}>
          {[16, 48, 80].map((t) => (
            <span key={t} aria-hidden="true" className={b.ring} style={{ top: `${t}%` }} />
          ))}
          <ul className={b.pockets}>
            {pageCards.map((c, i) => (
              <li key={c.id} style={{ opacity: visible(c) ? 1 : 0.28 }}>
                <button
                  type="button"
                  className={`${b.pocket} lift drop-in`}
                  style={{ ["--r" as string]: `${[-1.5, 1, -0.5, 1.5, -1, 0.5, -1.2, 0.8, -0.6][i % 9]}deg`, animationDelay: `${100 + i * 55}ms` } as React.CSSProperties}
                  aria-pressed={c.id === selected?.id}
                  aria-label={`${c.occasion.title}, ${stampDate(c.occasion.date)}`}
                  onClick={() => (setSelectedId(c.id), setEditing(false))}
                >
                  <TradingCardSleeve width={164}>
                    <TradingCard card={c} width={164} decorative />
                  </TradingCardSleeve>
                  {c.id === selected?.id && <span aria-hidden="true" className={b.selectedRing} />}
                </button>
              </li>
            ))}
            {page === pages - 1 && (
              <li>
                <Link href="/studio" className={b.makeNext}>
                  <span className="hand" style={{ fontSize: 44, lineHeight: 1 }}>+</span>
                  <span className="hand" style={{ fontSize: 24, lineHeight: 1 }}>make the next one</span>
                  {nextEvent && (
                    <span className="mono" style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase" }}>
                      {stampDate(nextEvent.date).slice(0, 6)} · {nextEvent.short.replace(" ♥", "")}
                    </span>
                  )}
                </Link>
              </li>
            )}
            {Array.from({ length: empties }, (_, i) => (
              <li key={`empty-${i}`} aria-hidden="true">
                <span className={b.emptySleeve} />
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <nav aria-label="Binder pages" className={b.pager}>
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← page {page}</button>
              <span>{page + 1} / {pages}</span>
              <button type="button" disabled={page === pages - 1} onClick={() => setPage((p) => p + 1)}>page {page + 2} →</button>
            </nav>
          )}
        </section>

        {selected && (
          <section aria-live="polite" aria-label="Selected card" className={b.detail}>
            <HoloTilt className="drop-in" key={selected.id}>
              <TradingCard card={selected} width={330} />
            </HoloTilt>
            <article className={b.indexCard}>
              <PaperClip style={{ left: 30, top: -24 }} rot={-8} />
              <div className="tx-lined" style={{ padding: "22px 22px 24px", color: "var(--ink)" }}>
                {editing && onSave ? (
                  <CardDetailsForm key={selected.id} card={selected} memoryTitles={memoryTitles} onCancel={() => setEditing(false)}
                    onSave={async (c) => {
                      await onSave(c);
                      setEditing(false);
                    }} />
                ) : (
                <>
                <p className={b.indexDate}>{stampDate(selected.occasion.date)}</p>
                <h2 className="display" style={{ fontSize: 36, lineHeight: 1, margin: "6px 0 10px" }}>{selected.occasion.title}</h2>
                <p className="hand" style={{ fontSize: 24, lineHeight: "34px", margin: "0 0 10px" }}>{selected.occasion.note}</p>
                <p className={b.indexMeta}>FRAME · {FRAME_LABEL[selected.frame]}</p>
                {parseDay(selected.occasion.date) > new Date() && <p className={b.indexMeta}>MADE EARLY · OPENS {stampDate(selected.occasion.date)}</p>}
                {selected.memoryId && (
                  <Link href={`/memories/${selected.memoryId}`} className={b.memoryLink}>
                    → open the memory: {memoryTitles[selected.memoryId] ?? "our page"}
                  </Link>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {onDownload && (
                    <button type="button" className={b.inkPill} onClick={() => onDownload(selected)}>download png</button>
                  )}
                  {onSave && (
                    <button type="button" className={b.inkPill} onClick={() => setEditing(true)}>edit details</button>
                  )}
                  {!selected.finishedImage && (
                    <Link href={`/studio?card=${selected.id}`} className={b.inkPill}>edit in studio</Link>
                  )}
                  {onDelete && (
                    <ConfirmDelete key={selected.id} what="this card" detail={selected.memoryId ? "its memory page stays." : undefined} onConfirm={() => onDelete(selected)} />
                  )}
                </div>
                </>
                )}
              </div>
            </article>
            <p className={`hand ${b.hint}`}>↑ move your mouse over it, it&rsquo;s shiny</p>
          </section>
        )}
      </div>
    </>
  );
}

/** Inline edit for the occasion details on the index card. The card art and text are edited in the studio. */
function CardDetailsForm({ card, memoryTitles, onSave, onCancel }: { card: CardData; memoryTitles: Record<string, string>; onSave: (c: CardData) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState(card.occasion.title);
  const [date, setDate] = useState(card.occasion.date);
  const [note, setNote] = useState(card.occasion.note);
  const [memoryId, setMemoryId] = useState(card.memoryId ?? "");
  const [frame, setFrame] = useState<FrameType>(card.frame);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className={m.form}
      style={{ gap: 12 }}
      aria-label="Edit card details"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await onSave({ ...card, frame, occasion: { ...card.occasion, title: title.trim() || card.occasion.title, date, note: note.trim() }, memoryId: memoryId || undefined });
        } catch {
          setError(SAVE_FAILED);
          setSaving(false);
        }
      }}
    >
      <label className={m.field}>
        OCCASION
        <input className={m.input} required value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className={m.field}>
        DATE
        <input type="date" className={m.input} required value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className={m.field}>
        NOTE
        <textarea className={m.textarea} style={{ minHeight: 90 }} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {card.finishedImage && card.frame !== "star" && (
        <label className={m.field}>
          <span>FILE UNDER FRAME <span className={m.hint}>(for the filter)</span></span>
          <select className={m.select} value={frame} onChange={(e) => setFrame(e.target.value as FrameType)}>
            <option value="standard">standard</option>
            <option value="prism">prism</option>
          </select>
        </label>
      )}
      <label className={m.field}>
        MEMORY IT GOES WITH
        <select className={m.select} value={memoryId} onChange={(e) => setMemoryId(e.target.value)}>
          <option value="">none</option>
          {Object.entries(memoryTitles).map(([id, t]) => (
            <option key={id} value={id}>{t}</option>
          ))}
        </select>
      </label>
      {error && <p role="alert" className={m.message} style={{ color: "var(--pink-deep)" }}>{error}</p>}
      <div className={m.bar}>
        <button type="submit" className={`${m.pill} ${m.solid}`} disabled={saving}>{saving ? "saving…" : "save"}</button>
        <button type="button" className={m.pill} onClick={onCancel}>cancel</button>
      </div>
    </form>
  );
}
