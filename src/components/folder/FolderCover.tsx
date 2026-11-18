import type { CardData } from "@/lib/card-schema";
import { accents } from "@/design/tokens";
import { dotDate, monthLabel, ordinal, parseDay, stampDate, START_DATE } from "@/lib/dates";
import type { Folder, Memory } from "@/lib/types";
import { LabelTag, Postmark, Stamp, Sticker, Tape, Ticket } from "@/components/ephemera";
import { TradingCard } from "@/components/cards/TradingCard";

const px = (v: number, k: number) => Math.round(v * k);

/**
 * Cover decorations for a folder, built from what's inside it: the latest photos
 * become stamps, and each kind of folder adds its own sticker. Each has its own
 * corner so nothing covers anything else as pages are added:
 * top-left = photo stamps · top-right = round sticker · bottom-left = note / ticket / postmark · bottom-right = label.
 */
export function FolderCover({ folder, memories, scale = 1 }: { folder: Folder; memories: Memory[]; scale?: number }) {
  const k = scale;
  const a = accents[folder.accent];
  const photos = memories.flatMap((m) => m.photos.map((p) => ({ ...p, date: m.date }))).slice(0, 2);
  const latest = memories[0];

  return (
    <>
      {photos[0] && (
        <Stamp src={photos[0].src} width={px(80, k)} height={px(96, k)} value={parseDay(photos[0].date).getDate().toString().padStart(2, "0")}
          label={monthLabel(parseDay(photos[0].date)).slice(0, 3)} rot={-7} style={{ left: px(18, k), top: px(24, k) }} />
      )}
      {photos[1] && (
        <Stamp src={photos[1].src} width={px(70, k)} height={px(86, k)} value={parseDay(photos[1].date).getDate().toString().padStart(2, "0")}
          label={monthLabel(parseDay(photos[1].date)).slice(0, 3)} rot={5} style={{ left: px(96, k), top: px(40, k) }} />
      )}
      {folder.slug === "firsts" && (
        <>
          <Postmark text="FIRSTS" date={dotDate(START_DATE)} size={px(78, k)} rot={-14} wavy={false} style={{ left: px(22, k), bottom: px(20, k) }} />
          <Sticker background={a.soft} size={px(66, k)} rot={8} style={{ right: px(26, k), top: px(26, k) }}>firsts!</Sticker>
        </>
      )}
      {folder.slug === "dates" && (
        <Ticket top="ADMIT TWO" title="Movie night" sub="SEAT F7 · F8" no="No. 0412" tint="blush" rot={-5} width={px(168, k)} height={px(68, k)}
          style={{ left: px(18, k), bottom: px(28, k) }} />
      )}
      {folder.slug === "trips" && (
        <Postmark text="ON THE ROAD" date={latest ? `${stampDate(latest.date).slice(0, 3)} ${stampDate(latest.date).slice(7)}` : "2026"} size={px(80, k)} rot={-12} style={{ right: px(-30, k), bottom: px(18, k) }} />
      )}
      {folder.slug === "anniversaries" && (
        <>
          <Sticker background={a.soft} size={px(78, k)} rot={-9} style={{ right: px(24, k), top: px(22, k) }}>
            mahal
            <br />
            kita
          </Sticker>
          <LabelTag rot={3} style={{ right: px(20, k), bottom: px(26, k) }}>every {ordinal(parseDay(START_DATE).getDate())} ♥</LabelTag>
        </>
      )}
      {folder.slug === "little-things" && (
        <>
          <div style={{ position: "absolute", left: px(22, k), bottom: px(26, k), width: px(150, k), transform: "rotate(-3deg)", zIndex: 3 }}>
            <span className="hand" style={{ display: "block", padding: `${px(10, k)}px ${px(12, k)}px`, background: "#FFFDF8", boxShadow: "var(--shadow-rest)", fontSize: px(19, k), lineHeight: 1.1 }}>
              endless smiles and auraless moments
            </span>
            <Tape kind="sage" width={px(70, k)} height={px(18, k)} rot={-3} style={{ left: px(38, k), top: px(-10, k) }} />
          </div>
          <Sticker background={a.soft} size={px(70, k)} rot={7} style={{ right: px(30, k), top: px(30, k) }}>tiny<br />joys</Sticker>
        </>
      )}
      {!folder.builtIn && (
        <Sticker background={a.soft} size={px(70, k)} rot={7} style={{ right: px(30, k), top: px(30, k) }}>ours</Sticker>
      )}
    </>
  );
}

/** For the Our Cards folder: the two newest cards peek out of the top. */
export function CardsPeek({ cards, scale = 1 }: { cards: CardData[]; scale?: number }) {
  const [first, second] = cards;
  return (
    <>
      {second && (
        <div style={{ position: "absolute", right: "12%", top: px(-6, scale), transform: "rotate(9deg)" }}>
          <TradingCard card={second} width={px(118, scale)} decorative />
        </div>
      )}
      {first && (
        <div style={{ position: "absolute", right: "34%", top: px(4, scale), transform: "rotate(-7deg)" }}>
          <TradingCard card={first} width={px(112, scale)} decorative />
        </div>
      )}
    </>
  );
}

export function CardsCover({ scale = 1 }: { scale?: number }) {
  return (
    <>
      <Stamp src="/backgrounds/pixel-dusk.svg" width={px(74, scale)} height={px(90, scale)} value="HP" label="OUR SET" rot={-6} style={{ left: px(20, scale), top: px(30, scale) }} />
      <Sticker background="var(--prism)" size={px(70, scale)} rot={10} style={{ right: px(22, scale), bottom: px(22, scale) }}>holo!</Sticker>
      <LabelTag rot={-2} style={{ left: px(108, scale), bottom: px(28, scale) }}>binder 01</LabelTag>
    </>
  );
}
