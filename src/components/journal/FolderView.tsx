import Link from "next/link";
import { accents } from "@/design/tokens";
import { stampDate } from "@/lib/dates";
import type { Folder, Memory } from "@/lib/types";
import { Polaroid, Postmark, Stamp } from "@/components/ephemera";
import s from "./journal.module.css";

/** File tabs across the top of an open folder, one per memory folder. */
export function FolderTabs({ folders, current, dropTarget }: { folders: Folder[]; current: string; /** Tab a page is being dragged over. */ dropTarget?: string | null }) {
  return (
    <ul aria-label="Memory folders" className={s.tabs}>
      {folders.map((f) => (
        <li key={f.slug}>
          <Link href={`/folders/${f.slug}`} data-folder-tab={f.slug} aria-current={f.slug === current ? "page" : undefined}
            className={`${s.tabLink} ${f.slug === current ? "tx-manila" : "tx-manila-deep"} ${dropTarget === f.slug ? s.tabDrop : ""}`}>
            <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: accents[f.accent].soft }} />
            {f.title}
          </Link>
        </li>
      ))}
      <li>
        <Link href="/folders/new" className={s.newTab}>+ new folder</Link>
      </li>
    </ul>
  );
}

const MINI_ROT = [-1.5, 1.2, -0.8, 1.6, -1.2, 0.9];

/** A memory shown as a small closed-ish journal spread, for folder grids. */
export function MiniSpread({ memory, index, accent, asLink = true }: { memory: Memory; index: number; accent: Folder["accent"]; /** false while rearranging */ asLink?: boolean }) {
  const photo = memory.photos[0];
  const Wrap = asLink ? Link : "div";
  return (
    <Wrap href={`/memories/${memory.id}`} className={`${s.entry} ${asLink ? "lift" : ""}`} style={{ ["--r" as string]: "0deg" } as React.CSSProperties}>
      <div className={s.mini} style={{ transform: `rotate(${MINI_ROT[index % MINI_ROT.length]}deg)` }}>
        <div className={`${s.miniLeft} tx-lined`} aria-hidden="true">
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "var(--muted)" }}>{stampDate(memory.date)}</div>
          <div className="hand" style={{ fontSize: 22, lineHeight: 1, marginTop: 6 }}>{memory.title}</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 9 }}>
            {[88, 72, 80, 50].map((w) => (
              <span key={w} className={s.miniLine} style={{ width: `${w}%` }} />
            ))}
          </div>
          <Postmark text={memory.folder.toUpperCase()} date={stampDate(memory.date).slice(0, 6)} size={58} rot={-10} wavy={false} style={{ left: 40, bottom: 2 }} />
        </div>
        <div className={`${s.miniRight} tx-grid`}>
          {photo && <Polaroid src={photo.src} alt={photo.alt} width={104} rot={4} washi="sky" lift={false} style={{ position: "absolute", left: "18%", top: "14%" }} />}
          {memory.cardId && (
            <Stamp src="/backgrounds/pixel-sea.svg" width={46} height={56} value="♥" label="CARD" rot={8} lift={false} style={{ right: 14, bottom: 12 }} />
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, gap: 12 }}>
        <span className="display" style={{ fontSize: 30, lineHeight: 1 }}>{memory.title}</span>
        <span className="mono" style={{ fontSize: 12, letterSpacing: ".14em", color: accents[accent].deep, fontWeight: 700, whiteSpace: "nowrap" }}>{stampDate(memory.date)}</span>
      </div>
      <p className="hand" style={{ fontSize: 22, lineHeight: 1.1, margin: "6px 0 0" }}>
        {memory.summary}
        {memory.cardId && <span className="mono" style={{ fontSize: 11, letterSpacing: ".14em" }}> · ♥ CARD</span>}
      </p>
    </Wrap>
  );
}

export function EmptyEntry({ label, accent, folder }: { label: string; accent: Folder["accent"]; folder?: string }) {
  return (
    <Link href={folder ? `/memories/new?folder=${folder}` : "/memories/new"} className={s.emptyEntry} style={{ color: accents[accent].deep }}>
      <span className="hand" style={{ fontSize: 44, lineHeight: 1 }}>+</span>
      <span className="hand" style={{ fontSize: 28, lineHeight: 1 }}>{label}</span>
      <span className="mono" style={{ fontSize: 11, letterSpacing: ".16em" }}>ADD A MEMORY</span>
    </Link>
  );
}

export { s as journalStyles };
