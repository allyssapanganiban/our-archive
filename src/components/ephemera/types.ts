import type { CSSProperties } from "react";

/** Props every collage piece accepts: where it sits and how much it's rotated. */
export type Placed = {
  className?: string;
  style?: CSSProperties;
  /** Rotation in degrees (collage range ±2–6°). Eases to 0 on hover when `lift` is on. */
  rot?: number;
};

export const rotVar = (rot = 0, style?: CSSProperties): CSSProperties =>
  ({ ["--r" as string]: `${rot}deg`, ...style }) as CSSProperties;

export const cx = (...names: (string | false | null | undefined)[]) => names.filter(Boolean).join(" ");
