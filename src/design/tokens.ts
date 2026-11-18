/**
 * Our Scrapbook design tokens.
 * The same values live as CSS custom properties in `src/app/globals.css`;
 * use these TS exports when you need a value in logic (e.g. picking an accent).
 */

export const color = {
  cream: "#F3EEE4",
  paper: "#FBF8F1",
  white: "#FDFBF6",
  kraft: "#7A3E2E",
  kraftDeep: "#5E2E22",
  binder: "#4A2A22",
  manila: "#E8CF9E",
  manilaDeep: "#D8B97E",
  ink: "#1F1B18",
  muted: "#5E554C",
  creamMuted: "#EADCCB",
  line: "#DCD3C4",
} as const;

/** One soft accent per folder. `deep` is the only shade allowed for text (≥ 4.5:1 on cream). */
export const accents = {
  pink: { soft: "#D8A7A9", deep: "#94474F" },
  sage: { soft: "#A9B89A", deep: "#4F6145" },
  sky: { soft: "#A9C4D6", deep: "#3B6079" },
  marigold: { soft: "#E3A73F", deep: "#80520C" },
} as const;
export type AccentName = keyof typeof accents;

/** Whose ink a note is written in. */
export const inks = {
  allyssa: accents.pink.deep,
  justin: accents.sky.deep,
} as const;

export const font = {
  display: "var(--font-serif)",
  hand: "var(--font-hand)",
  mono: "var(--font-mono)",
  card: "var(--font-card)",
} as const;

/** Type scale: [size px, line-height]. Handwriting only for short text. */
export const type = {
  displayXL: [132, 0.92],
  displayL: [96, 0.95],
  title: [64, 1],
  item: [34, 1],
  noteL: [30, 1.15],
  diary: [26, 34 / 26],
  caption: [21, 1.1],
  pill: [15, 1.2],
  label: [13, 1.2],
  labelXS: [11, 1.2],
} as const;

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

export const radius = { sm: 3, md: 6, lg: 10, card: 14, pill: 999 } as const;

export const shadow = {
  rest: "0 1px 1px rgba(31,27,24,.10), 0 3px 6px rgba(31,27,24,.10), 0 10px 22px rgba(31,27,24,.10)",
  lift: "0 2px 2px rgba(31,27,24,.10), 0 10px 18px rgba(31,27,24,.14), 0 26px 44px rgba(31,27,24,.16)",
  page: "0 20px 44px rgba(0,0,0,.28)",
  /** For clipped shapes (torn edges, scalloped stamps) where box-shadow is cut off. */
  drop: "drop-shadow(0 1px 1px rgba(31,27,24,.16)) drop-shadow(0 5px 9px rgba(31,27,24,.14))",
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
  easeOut: "cubic-bezier(.2,.7,.2,1)",
  bounce: "cubic-bezier(.3,1.45,.5,1)",
} as const;

/** Collage rotation range in degrees. Never rotate text blocks longer than ~2 lines. */
export const tilt = { min: 2, max: 6 } as const;

export const washi = ["plain", "pink", "sage", "sky", "marigold"] as const;
export type Washi = (typeof washi)[number];
