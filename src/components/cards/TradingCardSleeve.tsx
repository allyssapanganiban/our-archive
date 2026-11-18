import type { ReactNode } from "react";
import s from "./cards.module.css";

/** A clear plastic binder sleeve around a card. */
export function TradingCardSleeve({ children, width = 250 }: { children: ReactNode; width?: number }) {
  return (
    <div className={s.sleeve} style={{ padding: Math.round(width * 0.035), borderRadius: Math.round(width * 0.07) }}>
      {children}
    </div>
  );
}
