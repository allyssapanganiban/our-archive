import s from "./ephemera.module.css";
import { cx, rotVar, type Placed } from "./types";

export function PaperClip({ rot = -6, color = "#9AA0A6", className, style }: Placed & { color?: string }) {
  return (
    <svg aria-hidden="true" className={cx(s.clip, className)} width="22" height="58" viewBox="0 0 22 58" style={rotVar(rot, style)}>
      <path d="M7 50 V12 a4 4 0 0 1 8 0 V44 a7 7 0 0 1 -14 0 V8 a10 10 0 0 1 20 0 V40" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
