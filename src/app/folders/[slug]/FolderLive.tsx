"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { accents } from "@/design/tokens";
import { EmptyEntry, FolderTabs, MiniSpread } from "@/components/journal";
import { Postmark, Stamp } from "@/components/ephemera";
import { ConfirmDelete, manageStyles as m } from "@/components/manage";
import { deleteFolder, saveFolder, saveMemory } from "@/lib/store";
import { folderMemories, useScrapbook } from "@/lib/use-scrapbook";
import type { Folder, Memory } from "@/lib/types";
import s from "@/components/journal/journal.module.css";

const EMPTY_LABEL: Record<string, string> = { trips: "next trip?", dates: "next date?", firsts: "another first?", anniversaries: "the next big day?", "little-things": "a little thing?" };

/** An open memory folder: tabs, title, its pages, and edit / delete for the folder. */
export function FolderLive({ slug }: { slug: string }) {
  const router = useRouter();
  const { folders, memories: all, ready } = useScrapbook();
  const folder = folders.find((f) => f.slug === slug);
  const [arranging, setArranging] = useState(false);
  const drag = useArrange(folder, folder ? folderMemories(folder, all) : []);

  if (!folder) {
    if (!ready) return <p className="hand" style={{ fontSize: 28, marginTop: 60 }}>opening the folder…</p>;
    return (
      <div style={{ marginTop: 60 }}>
        <p className="hand" style={{ fontSize: 32 }}>this folder isn&rsquo;t on the desk anymore.</p>
        <Link href="/" className="mono" style={{ color: "var(--cream)" }}>← back to the desk</Link>
      </div>
    );
  }

  const memories = folderMemories(folder, all);
  const cardCount = memories.filter((x) => x.cardId).length;
  const latestPhoto = memories.find((x) => x.photos[0])?.photos[0];
  const pages = memories.length === 1 ? "its 1 page goes too." : memories.length ? `its ${memories.length} pages go too (cards stay in the binder).` : "";

  return (
    <>
      <nav aria-label="Breadcrumb" className="mono" style={{ marginTop: 36, fontSize: 13, letterSpacing: ".16em", color: "var(--cream-muted)" }}>
        <Link href="/" style={{ color: "var(--cream-muted)" }}>DESK</Link> &nbsp;/&nbsp; MEMORIES &nbsp;/&nbsp;{" "}
        <span aria-current="page" style={{ color: "var(--cream)" }}>{folder.title.toUpperCase()}</span>
      </nav>
      <div style={{ marginTop: 26, position: "relative", opacity: ready ? 1 : 0 }} className="slide-out">
        <FolderTabs folders={folders.filter((f) => f.kind === "memories")} current={slug} dropTarget={drag.overFolder} />
        <section className={`${s.openFolder} tx-manila`} aria-labelledby="folder-title">
          {latestPhoto && <Stamp src={latestPhoto.src} width={96} height={118} value="♥" label={folder.title.toUpperCase()} rot={8} style={{ right: 56, top: -30 }} />}
          <Postmark text={folder.title.toUpperCase()} date={String(new Date().getFullYear())} size={104} rot={-12} style={{ right: 150, top: 30 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 40px", alignItems: "flex-end", justifyContent: "space-between", maxWidth: 900 }}>
            <div>
              <h1 id="folder-title" className="display" style={{ fontSize: "clamp(56px, 7vw, 96px)", lineHeight: 0.95, margin: 0 }}>{folder.title}</h1>
              <p className="hand" style={{ fontSize: 28, margin: "8px 0 0" }}>{folder.tagline}</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
              <span className="mono" style={{ fontSize: 12, letterSpacing: ".18em", color: accents[folder.accent].deep, fontWeight: 700 }}>
                {memories.length} {memories.length === 1 ? "MEMORY" : "MEMORIES"}{cardCount ? ` · ${cardCount} CARDS` : ""}
              </span>
              <Link href={`/memories/new?folder=${slug}`} className="lift mono"
                style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "6px 18px", background: "var(--ink)", color: "var(--cream)", borderRadius: 999, fontSize: 14, ["--r" as string]: "-1.5deg" } as React.CSSProperties}>
                + add a memory
              </Link>
            </div>
          </div>
          <div className={m.bar} style={{ marginTop: 18, color: "var(--ink)" }}>
            {memories.length > 1 || arranging ? (
              <button type="button" aria-pressed={arranging} className={`${m.pill} ${arranging ? m.solid : ""}`} onClick={() => setArranging((a) => !a)}>
                {arranging ? "done arranging" : "rearrange"}
              </button>
            ) : null}
            <Link href={`/folders/${slug}/edit`} className={m.pill}>edit folder</Link>
            <ConfirmDelete
              what={`the “${folder.title}” folder`}
              detail={pages}
              label="delete folder"
              onConfirm={async () => {
                await deleteFolder(slug, memories.map((x) => x.id));
                router.push("/");
              }}
            />
          </div>
          {arranging && (
            <p className="hand" role="status" style={{ fontSize: 24, margin: "18px 0 0" }}>
              drag the pages into any order, or onto another folder&rsquo;s tab to move them there. saves as you go.
            </p>
          )}
          <ul className={`${s.entries} ${arranging ? s.arranging : ""}`}>
            {memories.map((x, i) => {
              const dragging = drag.dragId === x.id;
              const marker = drag.overIndex === i && !dragging && drag.dragId ? (drag.overIndex < memories.findIndex((y) => y.id === drag.dragId) ? s.dropBefore : s.dropAfter) : "";
              return (
                <li key={x.id} data-entry-index={i}
                  className={`${s.entryItem} drop-in ${dragging ? s.dragging : ""} ${marker}`}
                  style={{ animationDelay: `${120 + i * 70}ms`, ...(dragging ? { transform: `translate(${drag.dx}px, ${drag.dy}px) rotate(2deg)` } : {}) }}
                  onPointerDown={arranging ? (e) => drag.start(e, x.id) : undefined}
                  onPointerMove={arranging ? drag.move : undefined}
                  onPointerUp={arranging ? drag.end : undefined}
                  onPointerCancel={arranging ? drag.cancel : undefined}>
                  <MiniSpread memory={x} index={i} accent={folder.accent} asLink={!arranging} />
                  {arranging && (
                    <div className={s.moveButtons} onPointerDown={(e) => e.stopPropagation()}>
                      <button type="button" disabled={i === 0} aria-label={`Move “${x.title}” earlier`} onClick={() => drag.moveTo(x.id, i - 1)}>← earlier</button>
                      <button type="button" disabled={i === memories.length - 1} aria-label={`Move “${x.title}” later`} onClick={() => drag.moveTo(x.id, i + 1)}>later →</button>
                    </div>
                  )}
                </li>
              );
            })}
            {!arranging && (
              <li>
                <EmptyEntry label={EMPTY_LABEL[slug] ?? "add one?"} accent={folder.accent} folder={slug} />
              </li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

/**
 * Pointer-based drag to reorder pages (mouse and touch), plus drop onto another
 * folder's tab to move a page there. Every change saves straight away.
 */
function useArrange(folder: Folder | undefined, memories: Memory[]) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [delta, setDelta] = useState({ dx: 0, dy: 0 });
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [overFolder, setOverFolder] = useState<string | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  const reset = () => {
    setDragId(null);
    setDelta({ dx: 0, dy: 0 });
    setOverIndex(null);
    setOverFolder(null);
  };

  const moveTo = async (id: string, to: number) => {
    if (!folder) return;
    const ids = memories.map((m) => m.id).filter((x) => x !== id);
    ids.splice(Math.max(0, Math.min(to, ids.length)), 0, id);
    try {
      await saveFolder({ ...folder, order: ids });
    } catch (e) {
      console.error("Couldn't save the new order", e);
    }
  };

  const targetAt = (x: number, y: number) => {
    for (const el of document.elementsFromPoint(x, y)) {
      const tab = (el as HTMLElement).closest<HTMLElement>("[data-folder-tab]");
      if (tab) return { folder: tab.dataset.folderTab!, index: null };
      const item = (el as HTMLElement).closest<HTMLElement>("[data-entry-index]");
      if (item && !item.contains(document.querySelector("[data-dragging]"))) return { folder: null, index: Number(item.dataset.entryIndex) };
    }
    return { folder: null, index: null };
  };

  return {
    dragId,
    dx: delta.dx,
    dy: delta.dy,
    overIndex,
    overFolder: overFolder && overFolder !== folder?.slug ? overFolder : null,
    moveTo,
    start(e: ReactPointerEvent<HTMLLIElement>, id: string) {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.setAttribute("data-dragging", "");
      origin.current = { x: e.clientX, y: e.clientY };
      setDragId(id);
    },
    move(e: ReactPointerEvent<HTMLLIElement>) {
      if (!dragId) return;
      setDelta({ dx: e.clientX - origin.current.x, dy: e.clientY - origin.current.y });
      const t = targetAt(e.clientX, e.clientY);
      setOverFolder(t.folder);
      setOverIndex(t.index);
    },
    async end(e: ReactPointerEvent<HTMLLIElement>) {
      const id = dragId;
      const t = targetAt(e.clientX, e.clientY); // before un-marking, so the dragged page isn't its own target
      e.currentTarget.removeAttribute("data-dragging");
      reset();
      if (!id || !folder) return;
      const memory = memories.find((m) => m.id === id)!;
      if (t.folder && t.folder !== folder.slug) await saveMemory({ ...memory, folder: t.folder }).catch((err) => console.error("Couldn't move the page", err));
      else if (t.index !== null && t.index !== memories.indexOf(memory)) await moveTo(id, t.index);
    },
    cancel(e: ReactPointerEvent<HTMLLIElement>) {
      e.currentTarget.removeAttribute("data-dragging");
      reset();
    },
  };
}
