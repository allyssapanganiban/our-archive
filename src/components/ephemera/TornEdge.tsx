import type { ElementType, ReactNode } from "react";
import { tornPolygon, type Edge } from "@/lib/geometry";
import s from "./ephemera.module.css";
import { cx, type Placed } from "./types";

type Surface = "cream" | "paper" | "kraft" | "manila" | "grid" | "lined" | "white";

type Props = Placed & {
  children?: ReactNode;
  edge?: Edge;
  /** Same seed = same tear on every render. */
  seed?: number;
  depth?: number;
  teeth?: number;
  surface?: Surface;
  padding?: number | string;
  as?: ElementType;
};

/** A piece of paper with a ragged edge (or all four). Shadow follows the tear. */
export function TornEdge({ children, edge = "bottom", seed = 1, depth = 6, teeth = 34, surface = "paper", padding = 22, rot = 0, as: Tag = "div", className, style }: Props) {
  const bg = surface === "white" ? undefined : `tx-${surface}`;
  return (
    <Tag className={cx(s.torn, className)} style={{ transform: rot ? `rotate(${rot}deg)` : undefined, ...style }}>
      <div className={bg} style={{ clipPath: tornPolygon(seed, edge, depth, teeth), padding, background: surface === "white" ? "#FFFDF8" : undefined }}>
        {children}
      </div>
    </Tag>
  );
}
