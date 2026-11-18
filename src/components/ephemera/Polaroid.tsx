import type { Washi } from "@/design/tokens";
import s from "./ephemera.module.css";
import { Tape } from "./Tape";
import { cx, rotVar, type Placed } from "./types";

type Props = Placed & {
  src?: string;
  /** Shown in the photo square instead of an image (e.g. a handwritten slip). */
  children?: React.ReactNode;
  /** Required: describe the photo for screen readers. */
  alt: string;
  caption?: string;
  width?: number;
  washi?: Washi | null;
  /** Lift on hover (rotation eases to 0, shadow grows). */
  lift?: boolean;
  loading?: "lazy" | "eager";
};

/** A photo print with a white border, handwritten caption and a strip of washi. */
export function Polaroid({ src, alt, caption, width = 200, rot = -3, washi = "plain", lift = true, loading = "lazy", className, style, children }: Props) {
  const pad = Math.max(7, Math.round(width / 20));
  const capSize = Math.max(14, Math.round(width / 9));
  return (
    <figure
      className={cx(s.polaroid, lift && "lift lift-shadow", className)}
      style={rotVar(rot, { width, padding: `${pad}px ${pad}px 0`, transform: lift ? undefined : `rotate(${rot}deg)`, ...style })}
    >
      <div className={s.polaroidPhoto}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads come from storage URLs
          <img src={src} alt={alt} loading={loading} />
        ) : (
          <div role="img" aria-label={alt} style={{ width: "100%", height: "100%" }}>{children}</div>
        )}
      </div>
      <figcaption className={s.polaroidCaption} style={{ fontSize: capSize, padding: `${Math.max(6, width / 22)}px 2px ${Math.max(9, width / 14)}px` }}>
        {caption ?? " "}
      </figcaption>
      {washi && (
        <Tape
          kind={washi}
          width={Math.round(width * 0.48)}
          height={Math.max(18, Math.round(width * 0.12))}
          rot={rot > 0 ? -3 : 4}
          style={{ top: -12, left: `calc(50% - ${Math.round(width * 0.24)}px)` }}
        />
      )}
    </figure>
  );
}
