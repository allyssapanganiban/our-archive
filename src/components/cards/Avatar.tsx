import { outfit } from "@/lib/avatars";
import type { OutfitId } from "@/lib/card-schema";
import { PEOPLE } from "@/lib/dates";

type Props = {
  id: OutfitId;
  /** Whole-number scale of the 41-px-tall source. Ignored when `height` is set. */
  scale?: number;
  /** CSS height (e.g. "8.2em" inside cards). Keeps pixels crisp via image-rendering. */
  height?: string | number;
  /** Pass "" when the avatar is decorative (e.g. inside a card that's already labelled). */
  alt?: string;
};

/** One of our pixel avatars, always scaled without blur. */
export function Avatar({ id, scale = 3, height, alt }: Props) {
  const o = outfit(id);
  const h = height ?? o.h * scale;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- next/image would smooth the pixels
    <img
      src={o.src}
      alt={alt ?? `${PEOPLE[o.person].name} in the ${o.label}, pixel avatar`}
      width={typeof h === "number" ? Math.round((o.w / o.h) * h) : undefined}
      height={typeof h === "number" ? h : undefined}
      style={{ display: "block", height: h, width: "auto", aspectRatio: `${o.w} / ${o.h}`, imageRendering: "pixelated" }}
      draggable={false}
    />
  );
}
