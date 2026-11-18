import { ticketPath } from "@/lib/geometry";
import type { TicketStub } from "@/lib/types";
import s from "./ephemera.module.css";
import { cx, rotVar, type Placed } from "./types";

const TINTS = { cream: "#F4E3C3", blush: "#F6E0D9", ice: "#E5EEF3" } as const;

type Props = Placed & TicketStub & { width?: number; height?: number; accent?: string };

/** A notched ticket stub with a perforated tear-off. */
export function Ticket({ top, title, sub, no, tint = "cream", width = 250, height = 104, accent = "var(--pink-deep)", rot = 4, className, style }: Props) {
  return (
    <div className={cx(s.ticket, "lift", className)} style={rotVar(rot, { width, height, ...style })}>
      <svg aria-hidden="true" width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <path d={ticketPath(width, height)} fill={TINTS[tint]} />
        <path d={`M${width - 62} 8 V${height - 8}`} stroke={accent} strokeWidth="1.4" strokeDasharray="3 4" />
      </svg>
      <div className={s.ticketBody}>
        <span className={s.ticketTop} style={{ color: accent }}>{top}</span>
        <span className={s.ticketTitle} style={{ fontSize: Math.round(height * 0.26) }}>{title}</span>
        <span className={s.ticketSub}>{sub}</span>
      </div>
      <div className={s.ticketStub}>
        <span style={{ color: accent }}>{no}</span>
      </div>
    </div>
  );
}
