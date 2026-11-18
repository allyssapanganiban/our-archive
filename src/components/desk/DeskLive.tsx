"use client";

import { useScrapbook } from "@/lib/use-scrapbook";
import { Desk } from "./Desk";
import { ImportBanner } from "./ImportBanner";

/** The desk with saved edits and deletions applied. */
export function DeskLive() {
  const { folders, memories, cards, ready } = useScrapbook();
  return (
    <div style={{ opacity: ready ? 1 : 0, transition: "opacity var(--t-fast, 150ms)" }}>
      <ImportBanner />
      <Desk folders={folders} memories={memories} cards={cards} />
    </div>
  );
}
