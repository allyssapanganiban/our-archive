import type { ReactNode } from "react";
import s from "./ephemera.module.css";
import { cx, rotVar, type Placed } from "./types";

/** Small typewritten paper label. */
export function LabelTag({ children, rot = -3, className, style }: Placed & { children: ReactNode }) {
  return (
    <span aria-hidden="true" className={cx(s.labelTag, className)} style={rotVar(rot, style)}>
      {children}
    </span>
  );
}
