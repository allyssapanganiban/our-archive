import { TYPE_COLORS, type EnergyType } from "@/lib/card-schema";
import { HeartIcon } from "@/components/ephemera";
import s from "./cards.module.css";

/** Our own energy-cost icon: a type-colored coin with a heart. */
export function EnergyIcon({ type, size = "1.4em", color }: { type: EnergyType; size?: string; color?: string }) {
  return (
    <span aria-hidden="true" className={s.energy} style={{ width: size, height: size, background: color ?? TYPE_COLORS[type].deep }}>
      <HeartIcon size="62%" fill="#FDFBF6" />
    </span>
  );
}
