import Link from "next/link";
import type { CardData } from "@/lib/card-schema";
import type { CSSProperties } from "react";
import { TradingCard } from "./TradingCard";
import s from "./cards.module.css";

/** A kraft corner pocket on a journal page with the matching card tucked in. */
export function CardPocket({ card, cardWidth = 128, rot = -4, style }: { card: CardData; cardWidth?: number; rot?: number; style?: CSSProperties }) {
  const no = String(card.setNumber.no).padStart(3, "0");
  return (
    <Link
      href={`/cards?card=${card.id}`}
      aria-label={`Open the matching card: ${card.occasion.title}`}
      className={`${s.pocket} lift`}
      style={{ width: cardWidth + 52, height: Math.round(cardWidth * 1.4) + 10, ["--r" as string]: `${rot}deg`, ...style } as CSSProperties}
    >
      <div style={{ position: "absolute", left: 14, top: 0, transform: "rotate(-7deg)" }}>
        <TradingCard card={card} width={cardWidth} decorative />
      </div>
      <div className={`${s.pocketFlap} tx-kraft`} aria-hidden="true" />
      <span className={s.pocketLabel}>our card ♥</span>
      <span className={s.pocketNo}>No. {no}</span>
    </Link>
  );
}
