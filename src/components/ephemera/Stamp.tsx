import { scallopPath } from "@/lib/geometry";
import type { ReactNode } from "react";
import s from "./ephemera.module.css";
import { cx, rotVar, type Placed } from "./types";

type Props = Placed & {
  width?: number;
  height?: number;
  /** Image for the stamp face, or pass children (e.g. a pixel scene). */
  src?: string;
  children?: ReactNode;
  value?: string;
  label?: string;
  paper?: string;
  lift?: boolean;
};

/** Original postage stamp with scalloped perforations. Decorative by default. */
export function Stamp({ width = 82, height = 100, src, children, value, label, paper = "#FDFBF6", rot = 3, lift = true, className, style }: Props) {
  return (
    <div aria-hidden="true" className={cx(s.stamp, lift && "lift", className)} style={rotVar(rot, { width, height, transform: lift ? undefined : `rotate(${rot}deg)`, ...style })}>
      <svg className={s.stampSvg} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={scallopPath(width, height)} fill={paper} />
      </svg>
      <div className={s.stampArt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img src={src} alt="" /> : children}
        {value && <span className={s.stampValue} style={{ fontSize: Math.max(9, Math.round(width / 9)) }}>{value}</span>}
        {label && <span className={s.stampLabel} style={{ fontSize: Math.max(6, Math.round(width / 14)) }}>{label}</span>}
      </div>
    </div>
  );
}
