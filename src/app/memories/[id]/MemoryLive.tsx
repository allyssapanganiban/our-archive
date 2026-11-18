"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageTurn, SpreadView } from "@/components/journal";
import { ConfirmDelete, manageStyles as m } from "@/components/manage";
import { monthversaryDate, stampDate } from "@/lib/dates";
import { deleteMemory } from "@/lib/store";
import { byDateDesc, folderMemories, useScrapbook } from "@/lib/use-scrapbook";

/** One memory as a journal spread, with edit / delete and page turning. */
export function MemoryLive({ id }: { id: string }) {
  const router = useRouter();
  const { folders, memories, cards, ready } = useScrapbook();
  const memory = memories.find((x) => x.id === id);

  if (!memory) {
    if (!ready) return <p className="hand" style={{ fontSize: 28, marginTop: 60 }}>opening the page…</p>;
    return (
      <div style={{ marginTop: 60 }}>
        <p className="hand" style={{ fontSize: 32 }}>this page isn&rsquo;t in the scrapbook (anymore).</p>
        <Link href="/" className="mono" style={{ color: "var(--cream)" }}>← back to the desk</Link>
      </div>
    );
  }

  const folder = folders.find((f) => f.slug === memory.folder);
  const folderTitle = folder?.title ?? memory.folder;
  // Page turning follows the folder: earliest first (or the hand-arranged order).
  const siblings = folder ? folderMemories(folder, memories) : memories.filter((x) => x.folder === memory.folder).sort(byDateDesc).reverse();
  const i = siblings.findIndex((x) => x.id === memory.id);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  const upcoming = !next && memory.pageType === "monthversary" && memory.number ? monthversaryDate(memory.number + 1) : null;
  const label = (n?: number, t?: string) => (n ? `No. ${String(n).padStart(2, "0")} · ${t?.toLowerCase()}` : t?.toLowerCase() ?? "");
  const card = (memory.cardId ? cards.find((c) => c.id === memory.cardId) : undefined) ?? cards.find((c) => c.memoryId === memory.id);

  return (
    <div style={{ opacity: ready ? 1 : 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 34 }}>
        <nav aria-label="Breadcrumb" className="mono" style={{ fontSize: 13, letterSpacing: ".16em", color: "var(--cream-muted)" }}>
          <Link href="/" style={{ color: "var(--cream-muted)" }}>DESK</Link> &nbsp;/&nbsp;{" "}
          <Link href={`/folders/${memory.folder}`} style={{ color: "var(--cream-muted)" }}>{folderTitle.toUpperCase()}</Link> &nbsp;/&nbsp;{" "}
          <span aria-current="page" style={{ color: "var(--cream)" }}>{memory.number ? `No. ${String(memory.number).padStart(2, "0")}` : memory.title.toUpperCase()}</span>
        </nav>
        <div className={m.bar} style={{ color: "var(--cream)" }}>
          <Link href={`/memories/${memory.id}/edit`} className={m.pill}>edit page</Link>
          <ConfirmDelete
            what={`“${memory.title}”`}
            detail={card ? "its card stays in the binder." : undefined}
            label="delete page"
            onConfirm={async () => {
              await deleteMemory(memory.id);
              router.push(`/folders/${memory.folder}`);
            }}
          />
        </div>
      </div>
      <SpreadView memory={memory} folderTitle={folderTitle} card={card} />
      <PageTurn
        index={i + 1}
        total={siblings.length}
        prev={prev && { href: `/memories/${prev.id}`, label: label(prev.number, prev.title) }}
        next={next ? { href: `/memories/${next.id}`, label: label(next.number, next.title) } : upcoming ? { label: `No. ${String(memory.number! + 1).padStart(2, "0")} · opens ${stampDate(upcoming).slice(0, 6).toLowerCase()}` } : undefined}
      />
    </div>
  );
}
