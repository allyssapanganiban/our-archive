import type { CardData, EnergyType, FrameType, ImageSource } from "@/lib/card-schema";
import { ordinal, parseDay, slashDate } from "@/lib/dates";

/**
 * What the studio needs from the card pipeline. The real implementation calls
 * your server routes (Claude copywriter + art director, OpenAI image step,
 * compositor/QA). `offlineActions` lets the studio work before those exist.
 */
export type StudioActions = {
  /** Copywriter step: occasion text in, card fields out. */
  writeText: (input: { occasion: CardData["occasion"]; frame: FrameType; type: EnergyType }) => Promise<Partial<CardData>>;
  /** Art director + image step for pixel backgrounds. Return null if not available. */
  makeBackground: ((input: { occasion: CardData["occasion"] }) => Promise<ImageSource>) | null;
  /** Server-side PNG export at print resolution. Optional until the compositor exists. */
  exportPng?: (card: CardData) => Promise<Blob>;
};

const KIND_ATTACKS: Record<CardData["occasion"]["kind"], [string, string]> = {
  monthversary: ["Love Beam", "×1000"],
  anniversary: ["Forever Shine", "∞"],
  birthday: ["Birthday Wish", "×23"],
  trip: ["Road Trip Rush", "300"],
  date: ["Date Night", "200"],
  other: ["Tiny Joy", "100"],
};

/** Simple local copy so the studio works without the AI pipeline. Not a substitute for the copywriter. */
export const offlineActions: StudioActions = {
  async writeText({ occasion }) {
    const d = parseDay(occasion.date);
    const [attack, damage] = KIND_ATTACKS[occasion.kind];
    const n = occasion.title.match(/\d+/)?.[0];
    const headline =
      occasion.kind === "monthversary" && n ? `Happy ${ordinal(Number(n))} Monthversary!` : occasion.kind === "birthday" ? "Happy Birthday!" : `${occasion.title}!`;
    return {
      headlineMove: headline.slice(0, 28),
      attack: { name: attack, cost: ["love", "love"], damage },
      subtitle: `Our story continues, every day. ${slashDate(d)}`,
      flavorText: occasion.note.slice(0, 110),
    };
  },
  makeBackground: null,
};
