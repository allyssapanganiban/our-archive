import type { Washi } from "@/design/tokens";
import { zigzagEnds } from "@/lib/geometry";
import s from "./ephemera.module.css";
import { cx, rotVar, type Placed } from "./types";

type Props = Placed & { kind?: Washi; width?: number; height?: number };

/** A strip of washi tape with zig-zag torn ends. Purely decorative. */
export function Tape({ kind = "plain", width = 96, height = 26, rot = -4, className, style }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cx(s.tape, s[`tape-${kind}`], className)}
      style={rotVar(rot, { width, height, clipPath: zigzagEnds(), ...style })}
    />
  );
}
