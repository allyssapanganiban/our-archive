/**
 * Card JSON schema shared by the Card Studio UI, the card pipeline
 * (copywriter / art director / compositor) and the scrapbook.
 *
 * Rule from the build brief: the image model only ever produces the
 * illustration or background. Frames, text and icons are drawn by
 * <TradingCard> from this data, so text stays sharp and editable.
 */

import type { Person } from "./dates";

export const ENERGY_TYPES = ["love", "dream", "sea", "meadow", "ember"] as const;
export type EnergyType = (typeof ENERGY_TYPES)[number];

export const FRAMES = ["standard", "prism", "star"] as const;
/** standard = colored by type · prism = rainbow "Tera-style" border · star = gold + rainbow full-art "VSTAR-style" */
export type FrameType = (typeof FRAMES)[number];

export type CardStyle = "pixel" | "full-art";
export type Stage = "BASIC" | "STAGE 1" | "STAGE 2" | "STAR";
export type CornerIcon = "heart" | "star" | "cake" | "plane";

export type OutfitId =
  | "allyssa-blue-dress"
  | "allyssa-white-dress"
  | "allyssa-pink-dress-braid"
  | "justin-white-tee"
  | "justin-white-tee-2"
  | "justin-leather-jacket"
  | "justin-black-tee";

export type AvatarPlacement = { person: Person; outfit: OutfitId };

export type ImageSource =
  | { source: "upload"; url: string }
  | { source: "generated"; url: string; prompt: string; model: string };

export type PixelArt = {
  kind: "pixel";
  background: ImageSource;
  avatars: AvatarPlacement[];
};
export type FullArt = {
  kind: "full-art";
  /** "restyled" = our photo run through the image-edit endpoint; "upload" = finished art. */
  illustration: ImageSource & { from?: "photo-restyle" | "finished-art" };
  alt: string;
};

export type Attack = {
  name: string;
  cost: EnergyType[];
  damage: string;
};

export type CardData = {
  id: string;
  schemaVersion: 1;
  style: CardStyle;
  frame: FrameType;
  type: EnergyType;

  name: string;
  /** Star frame only: line under the name, e.g. "Our story continues, every day. 12/11/2026" */
  subtitle?: string;
  stage: Stage;
  hp: string;
  headlineMove: string;
  attack: Attack;
  /** Short playful description of what the attack does. */
  attackText: string;
  flavorText: string;
  weakness: string;
  resistance: string;
  retreat: string;
  cornerIcon: CornerIcon;
  setNumber: { no: number; total: number };

  occasion: {
    title: string;
    kind: "monthversary" | "anniversary" | "birthday" | "trip" | "date" | "other";
    date: string; // YYYY-MM-DD
    note: string; // the free-form text typed into the studio
  };
  art: PixelArt | FullArt;

  /**
   * A finished card image made outside the studio (e.g. a PNG made by hand).
   * When set, <TradingCard> shows this image as-is instead of drawing the
   * frame; the fields above still describe the card for alt text and details.
   */
  finishedImage?: { url: string; alt: string };

  /** Memory this card is tucked into, if any. */
  memoryId?: string;
  createdBy: Person;
  createdAt: string; // ISO timestamp
};

/** Character limits the copywriter step must respect (QA flags overflow). */
export const TEXT_LIMITS = {
  name: 22,
  subtitle: 52,
  headlineMove: 28,
  attackName: 18,
  attackText: 70,
  flavorText: 110,
  weakness: 14,
  resistance: 14,
  retreat: 10,
} as const;

/** Print target for later: 63 × 88 mm at 300 DPI plus 3 mm bleed. Not used in the MVP. */
export const PRINT = { widthMm: 63, heightMm: 88, dpi: 300, bleedMm: 3 } as const;

export function textProblems(card: CardData): string[] {
  const checks: [keyof typeof TEXT_LIMITS, string | undefined][] = [
    ["name", card.name],
    ["subtitle", card.subtitle],
    ["headlineMove", card.headlineMove],
    ["attackName", card.attack.name],
    ["attackText", card.attackText],
    ["flavorText", card.flavorText],
    ["weakness", card.weakness],
    ["resistance", card.resistance],
    ["retreat", card.retreat],
  ];
  return checks
    .filter(([key, value]) => value !== undefined && value.length > TEXT_LIMITS[key])
    .map(([key, value]) => `${key} is ${value!.length}/${TEXT_LIMITS[key]} characters`);
}

/** Palette per energy type: [light, mid, deep]. */
export const TYPE_COLORS: Record<EnergyType, { light: string; mid: string; deep: string; label: string }> = {
  love: { light: "#F3C3C8", mid: "#E07F8D", deep: "#B9505F", label: "love" },
  dream: { light: "#D9C6EC", mid: "#9D7BC4", deep: "#6E4E98", label: "dream" },
  sea: { light: "#C6DDEE", mid: "#6E9FCB", deep: "#3F6E9B", label: "sea" },
  meadow: { light: "#D6E5C3", mid: "#8DB06F", deep: "#5C7F45", label: "meadow" },
  ember: { light: "#F6D2B0", mid: "#E58F57", deep: "#A9542A", label: "ember" },
};
