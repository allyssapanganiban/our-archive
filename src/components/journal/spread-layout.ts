import type { Memory, PlacedItem, TemplateId } from "@/lib/types";
import { lineCount } from "./measure";
import type { SpreadCtx } from "./Spread";

/**
 * Where things go on a journal spread. Coordinates are page px (pages are 640
 * wide, content between x 56 and 584), top-left corner of each item.
 * `layoutFromMemory` reproduces the classic spread, so a page looks the same
 * before and after it's first opened in the editor.
 */
const PAD = 56;
const CONTENT = 640 - PAD * 2; // 528
const TITLE_TOP = 83;
const TITLE_W = 370;

type Draft = Omit<PlacedItem, "id" | "z">;

/** Saved arrangements from before spreads (no `page` on items) are laid out again from the page's content. */
export const isSpreadLayout = (items: PlacedItem[] | undefined): items is PlacedItem[] => Boolean(items?.length && items.every((i) => i.page));

export function titleBottom(title: string) {
  const lines = lineCount(title || "untitled", { fontVar: "--font-serif", size: 68, width: TITLE_W, avgChar: 0.4 });
  return TITLE_TOP + lines * 68;
}

export const diaryHeight = (text: string, w = 440) => {
  const paras = text.split(/\n\s*\n/).filter((p) => p.trim());
  const lines = paras.reduce((n, p) => n + lineCount(p.replace(/\n/g, " "), { fontVar: "--font-hand", size: 26, width: w, avgChar: 0.4 }), 0);
  return lines * 34 + Math.max(0, paras.length - 1) * 34;
};
const slipHeight = (text: string, w = 340) => {
  const lines = lineCount(text.replace(/\n\s*\n/g, "\n"), { fontVar: "--font-hand", size: 25, width: w - 48, avgChar: 0.4 });
  return 22 + 20 + lines * 29 + 26;
};

const number = (items: Draft[], prefix: string): PlacedItem[] => items.map((it, n) => ({ ...it, id: `${prefix}-${n}`, z: n + 2 }));

/** The classic spread, as items: title + postmark + diary + two photos on the left; the other side, checklist, tickets, cassette and card on the right. */
export function layoutFromMemory(m: Memory, ctx: SpreadCtx): PlacedItem[] {
  const items: Draft[] = [];
  const left = { y: titleBottom(m.title) + 34 };

  if (m.location) items.push({ kind: "postmark", page: "left", x: 640 - 24 - 100, y: 84, rot: 12, scale: 1, data: { text: m.location.name, date: m.location.date ?? "" } });

  const [main, ...others] = m.diary;
  if (main) {
    const text = [...main.paragraphs, ...(main.signoff ? [main.signoff] : [])].join("\n\n");
    items.push({ kind: "note", page: "left", x: PAD, y: left.y, rot: 0, scale: 1, data: { text, writer: main.author, style: "diary", w: "440" } });
    left.y += diaryHeight(text);
  }
  const row = left.y + 30;
  m.photos.slice(0, 2).forEach((p, i) =>
    items.push({ kind: "photo", page: "left", x: PAD + (i === 0 ? CONTENT * 0.02 : CONTENT * 0.44), y: row + (i === 0 ? 10 : 36), rot: i === 0 ? -5 : 4, scale: 1,
      data: { src: p.src, alt: p.alt, caption: p.caption ?? "", washi: p.washi ?? "plain", w: i === 0 ? "210" : "180" } }),
  );

  const right = { y: 75 };
  others.forEach((d) => {
    const text = [...d.paragraphs, ...(d.signoff ? [d.signoff] : [])].join("\n\n");
    items.push({ kind: "note", page: "right", x: PAD, y: right.y, rot: -2, scale: 1, data: { text, writer: d.author, style: "slip", w: "340" } });
    right.y += slipHeight(text) + 30;
  });
  if (ctx.checklist?.items.length) {
    items.push({ kind: "checklist", page: "right", x: PAD, y: right.y + 4, rot: 0, scale: 1, data: {} });
    right.y += 34 + 20 + ctx.checklist.items.length * 34;
  }
  const extras = right.y + 20;
  m.tickets.forEach((t, i) =>
    items.push({ kind: "ticket", page: "right", x: PAD + CONTENT * 0.96 - 260, y: extras + i * 120, rot: 5 - i * 7, scale: 1, data: { top: t.top, title: t.title, sub: t.sub, no: t.no, tint: t.tint ?? "cream" } }),
  );
  if (m.playlist) items.push({ kind: "cassette", page: "right", x: PAD + CONTENT * 0.02, y: extras + 150, rot: -6, scale: 1, data: { title: m.playlist.title } });
  if (ctx.card) items.push({ kind: "card", page: "right", x: PAD + CONTENT * 0.96 - 180, y: extras + 241, rot: -4, scale: 1, data: {} });
  // Photos beyond the first two go on the right page.
  m.photos.slice(2).forEach((p, i) =>
    items.push({ kind: "photo", page: "right", x: PAD + (i % 2) * 230, y: Math.max(extras + 420, 520) + Math.floor(i / 2) * 260, rot: i % 2 ? 3 : -3, scale: 1,
      data: { src: p.src, alt: p.alt, caption: p.caption ?? "", washi: p.washi ?? "plain", w: "190" } }),
  );
  return number(items, "auto");
}

/** Make sure the page shows its checklist, card and playlist even if they were added under the page after arranging it. */
export function ensureItems(items: PlacedItem[], ctx: SpreadCtx): PlacedItem[] {
  const has = (k: PlacedItem["kind"]) => items.some((i) => i.kind === k);
  const extra: Draft[] = [];
  if (ctx.checklist?.items.length && !has("checklist")) extra.push({ kind: "checklist", page: "right", x: PAD, y: 300, rot: 0, scale: 1, data: {} });
  if (ctx.tracks.length && !has("cassette")) extra.push({ kind: "cassette", page: "right", x: PAD + 10, y: 520, rot: -6, scale: 1, data: { title: "our playlist" } });
  if (ctx.card && !has("card")) extra.push({ kind: "card", page: "right", x: PAD + CONTENT * 0.96 - 180, y: 600, rot: -4, scale: 1, data: {} });
  if (!extra.length) return items;
  const z = Math.max(1, ...items.map((i) => i.z));
  return [...items, ...extra.map((it, n) => ({ ...it, id: `need-${it.kind}`, z: z + n + 1 }))];
}

/** Starting layouts for a new page. `title` decides where the writing starts. */
export const TEMPLATES: { id: TemplateId; name: string }[] = [
  { id: "photo-note", name: "photo + note" },
  { id: "big-moment", name: "one big moment" },
  { id: "ticket-stack", name: "ticket stack" },
];

export function templateItems(id: TemplateId, title: string, writer: "allyssa" | "justin"): Draft[] {
  const other = writer === "allyssa" ? "justin" : "allyssa";
  const top = titleBottom(title) + 34;
  const diary: Draft = { kind: "note", page: "left", x: PAD, y: top, rot: 0, scale: 1, data: { text: "", writer, style: "diary", w: "440" } };
  const slip: Draft = { kind: "note", page: "right", x: PAD, y: 75, rot: -2, scale: 1, data: { text: "", writer: other, style: "slip", w: "340" } };
  const postmark: Draft = { kind: "postmark", page: "left", x: 640 - 24 - 100, y: 84, rot: 12, scale: 1, data: { text: "SOMEWHERE", date: "" } };
  switch (id) {
    case "big-moment":
      return [
        diary,
        { kind: "photo", page: "right", x: 96, y: 110, rot: 1.5, scale: 1, data: { caption: "", w: "420", washi: "pink" } },
        { kind: "washi", page: "right", x: 420, y: 96, rot: 8, scale: 1, data: { washi: "pink" } },
        { kind: "note", page: "right", x: PAD, y: 610, rot: -2, scale: 1, data: { text: "", writer: other, style: "slip", w: "340" } },
      ];
    case "ticket-stack":
      return [
        diary,
        postmark,
        slip,
        { kind: "ticket", page: "right", x: 300, y: 330, rot: 5, scale: 1, data: {} },
        { kind: "ticket", page: "right", x: 280, y: 450, rot: -2, scale: 1, data: { tint: "blush" } },
        { kind: "cassette", page: "right", x: 66, y: 600, rot: -6, scale: 1, data: { title: "our playlist" } },
      ];
    default:
      return [
        diary,
        postmark,
        { kind: "photo", page: "left", x: PAD + 10, y: 470, rot: -5, scale: 1, data: { caption: "", w: "210" } },
        { kind: "photo", page: "left", x: PAD + 232, y: 496, rot: 4, scale: 1, data: { caption: "", w: "180" } },
        slip,
      ];
  }
}
