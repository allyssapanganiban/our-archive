"use client";

import { useRouter } from "next/navigation";
import { CardBinder } from "@/components/cards/CardBinder";
import type { CardData } from "@/lib/card-schema";
import type { UpcomingEvent } from "@/lib/dates";
import { deleteCard, saveCard, saveMemory } from "@/lib/store";
import { useScrapbook } from "@/lib/use-scrapbook";

/** The binder with saved edits applied, plus edit details / delete. */
export function CardsLive({ initialCardId, nextEvent }: { initialCardId?: string; nextEvent?: UpcomingEvent }) {
  const router = useRouter();
  const { cards: all, memories, ready } = useScrapbook();
  const cards = [...all].sort((a, b) => b.occasion.date.localeCompare(a.occasion.date));
  const memoryTitles = Object.fromEntries(memories.map((m) => [m.id, m.title]));

  const onSave = async (card: CardData) => {
    const before = all.find((c) => c.id === card.id);
    await saveCard(card);
    // Keep the memory's corner pocket in sync with the card's link.
    if (before?.memoryId !== card.memoryId) {
      const old = memories.find((m) => m.id === before?.memoryId);
      if (old?.cardId === card.id) await saveMemory({ ...old, cardId: undefined });
      const next = memories.find((m) => m.id === card.memoryId);
      if (next) await saveMemory({ ...next, cardId: card.id });
    }
  };
  const onDelete = async (card: CardData) => {
    await deleteCard(card.id);
    router.replace("/cards");
  };

  return (
    <div style={{ opacity: ready ? 1 : 0, transition: "opacity var(--t-fast, 150ms)" }}>
      <p className="mono" style={{ fontSize: 13, letterSpacing: ".22em", margin: "14px 0 0", color: "var(--cream-muted)", textAlign: "center" }}>
        {cards.length} {cards.length === 1 ? "CARD" : "CARDS"} · BINDER 01
      </p>
      {/* re-mount once saved data is in, so the requested card is selected */}
      <CardBinder key={String(ready)} cards={cards} initialCardId={initialCardId} memoryTitles={memoryTitles} nextEvent={nextEvent} onSave={onSave} onDelete={onDelete} />
    </div>
  );
}
