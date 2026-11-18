import type { ReactNode } from "react";
import s from "./ephemera.module.css";
import { cx, rotVar, type Placed } from "./types";

type Props = Placed & {
  children: ReactNode;
  background: string;
  color?: string;
  size?: number;
  fontSize?: number;
  /** When set, renders a real <button> under the sticker look. */
  onClick?: () => void;
  pressed?: boolean;
  label?: string;
};

/** Round die-cut sticker. Decorative unless it gets an onClick. */
export function Sticker({ children, background, color = "var(--ink)", size = 74, fontSize, rot = -8, onClick, pressed, label, className, style }: Props) {
  const css = rotVar(rot, { width: size, height: size, background, color, fontSize: fontSize ?? Math.round(size / 3.6), ...style });
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={pressed} aria-label={label} className={cx(s.sticker, "lift", className)} style={css}>
        {children}
      </button>
    );
  }
  return (
    <span aria-hidden="true" className={cx(s.sticker, "lift", className)} style={{ ...css, position: style?.position ?? "absolute" }}>
      {children}
    </span>
  );
}
