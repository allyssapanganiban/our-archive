"use client";

import { CardStudio } from "@/components/studio/CardStudio";
import type { CardData } from "@/lib/card-schema";
import { useScrapbook } from "@/lib/use-scrapbook";

/** Opens the studio on a saved card (edited or new) or on a fresh draft. */
export function StudioLive({ cardId, draft }: { cardId?: string; draft: CardData }) {
  const { cards, memories, ready } = useScrapbook();
  if (cardId && !ready) return <p className="hand" style={{ fontSize: 28, marginTop: 40 }}>getting the card out…</p>;
  const found = cardId ? cards.find((c) => c.id === cardId && !c.finishedImage) : undefined;
  const initial = found ?? { ...draft, setNumber: { ...draft.setNumber, no: cards.length + 1 } };
  const memoryOptions: [string, string][] = memories.map((m) => [m.id, m.title]);
  return <CardStudio key={initial.id || "draft"} initial={initial} memories={memoryOptions} />;
}
