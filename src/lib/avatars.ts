import type { OutfitId } from "./card-schema";
import type { Person } from "./dates";

/**
 * Pixel avatars (transparent PNGs, one source pixel = one art pixel).
 * Always scale by whole numbers with image-rendering: pixelated.
 */
export type Outfit = { id: OutfitId; person: Person; label: string; src: string; w: number; h: number };

export const OUTFITS: Outfit[] = [
  { id: "allyssa-blue-dress", person: "allyssa", label: "blue dress", src: "/avatars/allyssa-blue-dress.png", w: 30, h: 41 },
  { id: "allyssa-white-dress", person: "allyssa", label: "white dress", src: "/avatars/allyssa-white-dress.png", w: 30, h: 41 },
  { id: "allyssa-pink-dress-braid", person: "allyssa", label: "pink dress + braid", src: "/avatars/allyssa-pink-dress-braid.png", w: 30, h: 41 },
  { id: "justin-white-tee", person: "justin", label: "white tee", src: "/avatars/justin-white-tee.png", w: 21, h: 41 },
  { id: "justin-white-tee-2", person: "justin", label: "white tee (other face)", src: "/avatars/justin-white-tee-2.png", w: 21, h: 41 },
  { id: "justin-leather-jacket", person: "justin", label: "leather jacket", src: "/avatars/justin-leather-jacket.png", w: 21, h: 41 },
  { id: "justin-black-tee", person: "justin", label: "black tee", src: "/avatars/justin-black-tee.png", w: 21, h: 41 },
];

export const outfit = (id: OutfitId): Outfit => {
  const o = OUTFITS.find((x) => x.id === id);
  if (!o) throw new Error(`Unknown outfit: ${id}`);
  return o;
};

export const outfitsFor = (person: Person) => OUTFITS.filter((o) => o.person === person);
