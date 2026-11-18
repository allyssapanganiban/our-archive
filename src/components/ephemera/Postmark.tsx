import { useId } from "react";
import s from "./ephemera.module.css";
import { cx, rotVar, type Placed } from "./types";

type Props = Placed & { text: string; date: string; size?: number; color?: string; wavy?: boolean };

/** Circular cancellation mark with the place around the rim and the date in the middle. */
export function Postmark({ text, date, size = 96, rot = -10, color = "#3B3530", wavy = true, className, style }: Props) {
  const id = useId();
  const r = size / 2 - 14;
  const c = size / 2;
  const w = size + (wavy ? 88 : 0);
  return (
    <svg aria-hidden="true" className={cx(s.postmark, className)} width={w} height={size} viewBox={`0 0 ${w} ${size}`} style={rotVar(rot, style)}>
      <defs>
        <path id={id} d={`M${c} ${c} m-${r} 0 a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 -${2 * r} 0`} />
      </defs>
      <circle cx={c} cy={c} r={size / 2 - 3} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={c} cy={c} r={size / 2 - 22} fill="none" stroke={color} strokeWidth={1.3} />
      <text fontFamily="var(--font-mono), monospace" fontSize={(size / 9.5).toFixed(1)} fontWeight={700} letterSpacing={2} fill={color}>
        <textPath href={`#${id}`}>{text} ·</textPath>
      </text>
      <text x={c} y={c + 4} textAnchor="middle" fontFamily="var(--font-mono), monospace" fontSize={(size / 8.5).toFixed(1)} fontWeight={700} fill={color}>
        {date}
      </text>
      {wavy &&
        [0, 1, 2, 3].map((k) => (
          <path key={k} d={`M${size - 6} ${c - 18 + k * 12} q10 -6 20 0 t20 0 t20 0 t20 0`} fill="none" stroke={color} strokeWidth={1.6} opacity={0.75} />
        ))}
    </svg>
  );
}
