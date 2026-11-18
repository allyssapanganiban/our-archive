/**
 * Sample content so every screen renders before storage is wired up.
 * Real dates are ours; the diary text, trips and card wording are
 * stand-ins to replace with the real memories.
 */
import type { CardData, EnergyType, FrameType, OutfitId } from "./card-schema";
import type { Folder, Memory } from "./types";

export const FOLDERS: Folder[] = [
  { slug: "cards", title: "Our Cards", kind: "cards", accent: "marigold", tagline: "every card we've made", builtIn: true, unit: "CARDS", tab: "right", rot: -1.2 },
  { slug: "firsts", title: "Firsts", kind: "memories", accent: "marigold", tagline: "the first time for everything", builtIn: true, unit: "MEMORIES", tab: "left", rot: 1.4 },
  { slug: "dates", title: "Dates", kind: "memories", accent: "pink", tagline: "nights out and nights in", builtIn: true, unit: "MEMORIES", tab: "right", rot: -0.8 },
  { slug: "trips", title: "Trips", kind: "memories", accent: "sky", tagline: "places we've been, together", builtIn: true, unit: "MEMORIES", tab: "left", rot: 1.8 },
  { slug: "anniversaries", title: "Anniversaries", kind: "memories", accent: "pink", tagline: "every 11th, and every year after", builtIn: true, unit: "MEMORIES", tab: "right", rot: -1.6 },
  { slug: "little-things", title: "Little Things", kind: "memories", accent: "sage", tagline: "tiny joys worth keeping", builtIn: true, unit: "NOTES", tab: "left", rot: 1 },
];

type PixelOpts = {
  id: string;
  no: number;
  frame?: Exclude<FrameType, "star">;
  type?: EnergyType;
  title: string;
  kind: CardData["occasion"]["kind"];
  date: string;
  note: string;
  move: string;
  attack: string;
  damage: string;
  attackText?: string;
  flavor?: string;
  bg: "dusk" | "day" | "sea" | "meadow";
  allyssa: OutfitId;
  justin: OutfitId;
  memoryId?: string;
};

function pixelCard(o: PixelOpts): CardData {
  const type = o.type ?? "love";
  return {
    id: o.id,
    schemaVersion: 1,
    style: "pixel",
    frame: o.frame ?? "standard",
    type,
    name: "Allyssa & Justin",
    stage: "BASIC",
    hp: "1000",
    headlineMove: o.move,
    attack: { name: o.attack, cost: [type, type], damage: o.damage },
    attackText: o.attackText ?? "Hugs the defending heart until it says “okay, fine, I love you too.”",
    flavorText: o.flavor ?? "Two small pixels who found each other and decided to stay.",
    weakness: "tiramisu",
    resistance: "mornings",
    retreat: "never",
    cornerIcon: "heart",
    setNumber: { no: o.no, total: 14 },
    occasion: { title: o.title, kind: o.kind, date: o.date, note: o.note },
    art: {
      kind: "pixel",
      background: { source: "upload", url: `/backgrounds/pixel-${o.bg}.svg` },
      avatars: [
        { person: "allyssa", outfit: o.allyssa },
        { person: "justin", outfit: o.justin },
      ],
    },
    memoryId: o.memoryId,
    createdBy: "allyssa",
    createdAt: `${o.date}T12:00:00Z`,
  };
}

/** Example of the gold "star" frame for the design-system page (not one of our real cards). */
export const STAR_EXAMPLE: CardData = {
    id: "example-star",
    schemaVersion: 1,
    style: "full-art",
    frame: "star",
    type: "love",
    name: "Allyssa & Justin",
    subtitle: "Our story continues, every day. 10/17/2026",
    stage: "STAR",
    hp: "2026",
    headlineMove: "New York Trip!",
    attack: { name: "Forever Shine", cost: ["love", "love", "love"], damage: "∞" },
    attackText: "Shines on both of you until further notice.",
    flavorText: "Bright lights, sore feet, and one perfect slice at 1 a.m.",
    weakness: "goodbyes",
    resistance: "distance",
    retreat: "never",
    cornerIcon: "star",
    setNumber: { no: 12, total: 14 },
    occasion: { title: "New York Trip", kind: "trip", date: "2026-10-17", note: "Bright lights, sore feet, one perfect slice at 1 a.m." },
    art: {
      kind: "full-art",
      illustration: { source: "upload", url: "/scenes/sunset.svg", from: "finished-art" },
      alt: "The two of us at sunset over the city (placeholder art)",
    },
    createdBy: "allyssa",
    createdAt: "2026-11-08T12:00:00Z",
  };

type FinishedOpts = {
  id: string;
  no: number;
  frame: Exclude<FrameType, "star">;
  type: EnergyType;
  stage: CardData["stage"];
  image: string;
  alt: string;
  attack: string;
  flavor: string;
  weakness: string;
  resistance: string;
  retreat: string;
  allyssa: OutfitId;
  justin: OutfitId;
};

/** Our 6th-monthversary cards, made by hand and shown exactly as made. */
function sixthMonthversaryCard(o: FinishedOpts): CardData {
  return {
    id: o.id,
    schemaVersion: 1,
    style: "pixel",
    frame: o.frame,
    type: o.type,
    name: "Justin and Allyssa",
    stage: o.stage,
    hp: "999",
    headlineMove: "Happy 6th Monthversary! 2026",
    attack: { name: o.attack, cost: [o.type, o.type, o.type, o.type], damage: "x 1000" },
    attackText: o.flavor,
    flavorText: o.flavor,
    weakness: o.weakness,
    resistance: o.resistance,
    retreat: o.retreat,
    cornerIcon: "heart",
    setNumber: { no: o.no, total: 14 },
    occasion: { title: "Monthversary No. 6", kind: "monthversary", date: "2026-12-11", note: "Six months on December 11. Made early because I could not wait." },
    art: {
      kind: "pixel",
      background: { source: "upload", url: o.image },
      avatars: [
        { person: "allyssa", outfit: o.allyssa },
        { person: "justin", outfit: o.justin },
      ],
    },
    finishedImage: { url: o.image, alt: o.alt },
    createdBy: "allyssa",
    createdAt: "2026-11-08T12:00:00Z",
  };
}

export const CARDS: CardData[] = [
  sixthMonthversaryCard({
    id: "card-012", no: 12, frame: "prism", type: "love", stage: "STAGE 2",
    image: "/cards/monthversary-06-1.jpg",
    alt: "Rainbow holo card “Justin and Allyssa”, HP 999: our pixel selves on a meadow path at sunset under a big red heart. Happy 6th Monthversary! 2026. Love Beam, x 1000.",
    attack: "Love Beam",
    flavor: "Sends a powerful wave of love toward its favorite person. The opponent is instantly charmed and may never want to leave your side. This attack gets stronger with every month spent together!",
    weakness: "sea +1", resistance: "love −30", retreat: "5",
    allyssa: "allyssa-blue-dress", justin: "justin-white-tee",
  }),
  sixthMonthversaryCard({
    id: "card-013", no: 13, frame: "standard", type: "dream", stage: "STAGE 1",
    image: "/cards/monthversary-06-2.jpg",
    alt: "Purple card “Justin and Allyssa”, HP 999: our pixel selves holding a heart in a pink and blue twilight forest. Happy 6th Monthversary! 2026. Cuddle Crush, x 1000.",
    attack: "Cuddle Crush",
    flavor: "Wraps its opponent in the warmest hug imaginable. Opponent cannot escape until at least three more hugs have been given.",
    weakness: "lightning +2", resistance: "fire −30", retreat: "3",
    allyssa: "allyssa-pink-dress-braid", justin: "justin-black-tee",
  }),
  sixthMonthversaryCard({
    id: "card-014", no: 14, frame: "standard", type: "ember", stage: "STAGE 1",
    image: "/cards/monthversary-06-3.jpg",
    alt: "Pink card “Justin and Allyssa”, HP 999: close-up of our pixel selves under autumn trees and a full moon. Happy 6th Monthversary! 2026. Sweet Bond, x 1000.",
    attack: "Sweet Bond",
    flavor: "Uses the power of six months of memories, laughter, and love to create an unbreakable bond. Damage increases whenever its partner smiles.",
    weakness: "dragon +3", resistance: "grass −40", retreat: "4",
    allyssa: "allyssa-white-dress", justin: "justin-leather-jacket",
  }),
  pixelCard({ id: "card-011", no: 11, title: "Slow Dance", kind: "date", date: "2026-11-07", note: "Our song came on in the kitchen and we slow danced in our socks.",
    move: "Slow Dance!", attack: "Sock Twirl", damage: "500", bg: "dusk", allyssa: "allyssa-white-dress", justin: "justin-leather-jacket", memoryId: "date-slow-dance" }),
  pixelCard({ id: "card-009", no: 9, type: "dream", title: "New York Trip", kind: "trip", date: "2026-10-17", note: "Bright lights, sore feet, one perfect slice at 1 a.m.",
    move: "New York Trip!", attack: "Big City Hug", damage: "400", bg: "dusk", allyssa: "allyssa-pink-dress-braid", justin: "justin-black-tee", memoryId: "trip-nyc" }),
  pixelCard({ id: "card-007", no: 7, frame: "prism", type: "sea", title: "Boardwalk Day", kind: "trip", date: "2026-08-16", note: "Saltwater taffy, one sunburn, zero regrets.",
    move: "Boardwalk Day!", attack: "Splash Hug", damage: "200", bg: "sea", allyssa: "allyssa-blue-dress", justin: "justin-white-tee", memoryId: "trip-boardwalk" }),
  pixelCard({ id: "card-006", no: 6, type: "meadow", title: "Picnic in the Park", kind: "date", date: "2026-09-05", note: "Too many snacks, not enough blanket, a very brave squirrel.",
    move: "Picnic Day!", attack: "Snack Share", damage: "300", bg: "meadow", allyssa: "allyssa-white-dress", justin: "justin-white-tee-2" }),
  pixelCard({ id: "card-002", no: 2, type: "sea", title: "Lake Weekend", kind: "trip", date: "2026-07-04", note: "Our first trip: the dock, the fireworks, the bug spray.",
    move: "Lake Weekend!", attack: "Dock Dance", damage: "150", bg: "day", allyssa: "allyssa-blue-dress", justin: "justin-white-tee", memoryId: "trip-lake" }),
  pixelCard({ id: "card-003", no: 3, title: "First Coffee Date", kind: "date", date: "2026-06-20", note: "Two lattes, three hours, one very patient barista.",
    move: "First Coffee Date!", attack: "Latte Art", damage: "150", bg: "day", allyssa: "allyssa-pink-dress-braid", justin: "justin-white-tee" }),
];

export const MEMORIES: Memory[] = [
  {
    id: "date-slow-dance",
    folder: "dates",
    title: "Slow dance in the kitchen",
    date: "2026-11-07",
    pageType: "date",
    template: "photo-note",
    summary: "Our song came on mid-dinner. Socks on, lights low.",
    location: { name: "Home" },
    diary: [
      {
        author: "allyssa",
        paragraphs: [
          "Dear diary, we were halfway through making pasta when our song came on.",
          "J turned the stove down, held out his hand, and we slow danced in our socks while the sauce bubbled.",
          "I stepped on his foot twice. He said it was part of the choreography.",
        ],
        signoff: "— A ♥",
      },
      { author: "justin", paragraphs: ["best dance floor in the city. (the foot thing was absolutely choreographed.)"] },
    ],
    photos: [
      { src: "/scenes/dinner.svg", alt: "Candle-lit dinner table", caption: "the pasta survived", washi: "pink" },
      { src: "/scenes/sunset.svg", alt: "Sunset through the window", caption: "golden hour, kitchen edition", washi: "plain" },
    ],
    tickets: [{ top: "ADMIT TWO", title: "Kitchen dance floor", sub: "NOV 7 · 8:15 PM · SOCKS ONLY", no: "No. 001107" }],
    playlist: { title: "kitchen slow dance", tracks: ["our song", "the one after our song", "your pick (again)", "the pasta-timer remix"] },
    checklist: { title: "NEXT TIME:", items: [{ text: "learn an actual dip", done: false }, { text: "candles, not the stove light", done: false }, { text: "don't burn the sauce", done: true }] },
    cardId: "card-011",
    stickers: [],
  },
  { id: "trip-nyc", folder: "trips", title: "New York trip", date: "2026-10-16", endDate: "2026-10-18", pageType: "trip", template: "ticket-stack", summary: "Bright lights, sore feet, one perfect slice at 1 a.m.",
    diary: [], photos: [{ src: "/scenes/night.svg", alt: "City skyline at night" }], tickets: [], stickers: [], cardId: "card-009" },
  { id: "trip-ferris", folder: "trips", title: "Ferris wheel night", date: "2026-10-24", pageType: "trip", template: "big-moment", summary: "Top of the wheel, a little scared, very happy.",
    diary: [], photos: [{ src: "/scenes/ferris.svg", alt: "Ferris wheel lit up at night" }], tickets: [], stickers: [], scene: "ferris" },
  { id: "trip-apples", folder: "dates", title: "Apple picking", date: "2026-10-11", pageType: "date", template: "photo-note", summary: "We picked way too many. Pie count: 3.",
    diary: [], photos: [{ src: "/scenes/orchard.svg", alt: "Apple trees and a full basket" }], tickets: [], stickers: [] },
  { id: "trip-train", folder: "trips", title: "Train into the city", date: "2026-09-20", pageType: "trip", template: "ticket-stack", summary: "Late train home, your head on my shoulder.",
    diary: [], photos: [{ src: "/scenes/night.svg", alt: "City skyline at night" }], tickets: [], stickers: [] },
  { id: "trip-boardwalk", folder: "dates", title: "Boardwalk day", date: "2026-08-16", pageType: "date", template: "photo-note", summary: "Saltwater taffy and one sunburn.",
    diary: [], photos: [{ src: "/scenes/beach.svg", alt: "Beach with an umbrella" }], tickets: [], stickers: [], cardId: "card-007" },
  { id: "trip-lake", folder: "dates", title: "Lake weekend", date: "2026-07-03", endDate: "2026-07-05", pageType: "date", template: "photo-note", summary: "Our first trip. Fireworks over the water.",
    diary: [], photos: [{ src: "/scenes/lake.svg", alt: "Lake with a dock and pine trees" }], tickets: [], stickers: [], cardId: "card-002" },
];

export const folderBySlug = (slug: string) => FOLDERS.find((f) => f.slug === slug);
export const memoriesIn = (slug: string) => MEMORIES.filter((m) => m.folder === slug).sort((a, b) => b.date.localeCompare(a.date));
export const memoryById = (id: string) => MEMORIES.find((m) => m.id === id);
export const cardById = (id: string) => CARDS.find((c) => c.id === id);
