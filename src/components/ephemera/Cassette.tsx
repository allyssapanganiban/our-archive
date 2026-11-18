import s from "./ephemera.module.css";
import { cx, rotVar, type Placed } from "./types";

type Props = Placed & { title: string; width?: number; accent?: string; href?: string };

/** A playlist cassette. Pass href to make it open the playlist. */
export function Cassette({ title, width = 270, accent = "var(--pink)", href, rot = -5, className, style }: Props) {
  const h = Math.round(width * 0.64);
  const reel = Math.round(h * 0.13);
  const body = (
    <>
      <div className={s.cassetteLabel} style={{ height: Math.round(h * 0.52) }}>
        <div className={s.cassetteStripe1} style={{ background: accent }} />
        <div className={s.cassetteStripe2} />
        <div className={s.cassetteTitle} style={{ fontSize: Math.round(width * 0.1) }}>{title}</div>
        <div className={s.cassetteWindow} style={{ height: Math.round(h * 0.17), borderRadius: Math.round(h * 0.1) }}>
          <span className={s.cassetteReel} style={{ width: reel, height: reel }} />
          <span className={s.cassetteReel} style={{ width: reel, height: reel }} />
        </div>
      </div>
      <div className={s.cassetteFoot} style={{ marginTop: Math.round(h * 0.06) }}>
        <span>SIDE A</span>
        <span>60 MIN</span>
      </div>
      <div className={s.cassetteBase} style={{ height: Math.round(h * 0.15) }} />
    </>
  );
  const css = rotVar(rot, { width, height: h, padding: Math.round(width * 0.05), display: "block", ...style });
  return href ? (
    <a href={href} aria-label={`Playlist: ${title}`} className={cx(s.cassette, "lift", className)} style={css}>
      {body}
    </a>
  ) : (
    <div role="img" aria-label={`Playlist cassette: ${title}`} className={cx(s.cassette, "lift", className)} style={css}>
      {body}
    </div>
  );
}
