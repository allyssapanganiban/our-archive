import Link from "next/link";
import type { CardData } from "@/lib/card-schema";
import { dotDate, stampDate, START_DATE, upcomingEvents } from "@/lib/dates";
import { addedAt } from "@/lib/use-scrapbook";
import type { Folder as FolderT, Memory } from "@/lib/types";
import { Polaroid, Sticker } from "@/components/ephemera";
import { CardsCover, CardsPeek, Folder, FolderCover } from "@/components/folder";
import { TradingCard } from "@/components/cards/TradingCard";
import { CalendarPage, CalendarStrip } from "./CalendarPage";
import s from "./desk.module.css";

const DAY = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const POUR_WASHI = ["pink", "sky", "sage", "marigold", "plain", "pink"] as const;

/** What spills out of a memory folder: its photos, plus any cards tucked into its pages. */
function pourFor(memories: Memory[], cards: CardData[]) {
  const photos = memories.flatMap((m) => m.photos).slice(0, 6);
  const tucked = memories.map((m) => cards.find((c) => c.id === m.cardId)).filter((c): c is CardData => !!c).slice(0, 1);
  const nodes = photos.slice(0, 6 - tucked.length).map((p, i) => (
    <Polaroid key={p.src + i} src={p.src} alt="" caption={p.caption} width={150} rot={0} washi={POUR_WASHI[i]} lift={false} loading="eager" />
  ));
  return [...nodes, ...tucked.map((c) => <TradingCard key={c.id} card={c} width={130} decorative />)];
}

const RECENT_ROT = [-4, 3, -2, 4, -3];
const WASHI = ["pink", "sky", "sage", "marigold", "pink"] as const;

type Props = {
  folders: FolderT[];
  memories: Memory[];
  cards: CardData[];
  /** Optional overrides; by default each folder shows what is inside it. */
  counts?: Record<string, number>;
  today?: Date;
};

/** Home: hero line, the next dates on a torn calendar page, the folders, and what was added lately. */
export function Desk({ folders, memories, cards, counts = {}, today = new Date() }: Props) {
  const events = upcomingEvents(today);
  // The five pages added most recently, whether or not they have photos.
  const recent = [...memories].sort((a, b) => addedAt(b) - addedAt(a)).slice(0, 5);
  const cardFor = (m: Memory) => cards.find((c) => c.id === m.cardId) ?? cards.find((c) => c.memoryId === m.id);
  const newestCards = [...cards].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <section className={s.hero}>
        <div className={s.heroText}>
          <p className={s.eyebrow}>{DAY.format(today).replace(/,/g, " ·").toUpperCase()}</p>
          <h1 className={`display ${s.h1}`}>
            our <em>little</em>
            <br />
            archive
          </h1>
          <p className={`hand ${s.lede}`}>every special occasion, inside joke &amp; tiny thing we never want to forget.</p>
          <div className={s.mobileStrip}>
            <CalendarStrip events={events} today={today} />
          </div>
          <div className={s.actions}>
            <Link href="/memories/new" className={`${s.primary} lift`}>+ tuck in a memory</Link>
            <Link href="/studio" className={`${s.secondary} lift`}>✦ make a card</Link>
          </div>
          <Sticker background="var(--sky)" size={82} rot={12} style={{ right: "6%", top: -10 }}>
            est.
            <br />
            {dotDate(START_DATE).slice(0, 5)}
          </Sticker>
        </div>
        <div className={s.calWrap}>
          <CalendarPage events={events} today={today} />
        </div>
      </section>

      <section aria-labelledby="folders-heading" style={{ marginTop: 84 }}>
        <div className={s.sectionHead}>
          <h2 id="folders-heading" className="label" style={{ margin: 0 }}>THE FOLDERS · {folders.length}</h2>
          <Link href="/folders/new" className="hand" style={{ fontSize: 24, color: "var(--kraft)" }}>+ start a new folder</Link>
        </div>
        <ul className={s.folders}>
          {folders.map((f) => {
            const inside = memories.filter((m) => m.folder === f.slug).sort((a, b) => b.date.localeCompare(a.date));
            return (
              <li key={f.slug}>
                {f.kind === "cards" ? (
                  <Folder folder={f} count={counts[f.slug] ?? cards.length} href="/cards" cover={<CardsCover />} peek={<CardsPeek cards={newestCards} />}
                    pour={newestCards.slice(0, 6).map((c) => <TradingCard key={c.id} card={c} width={140} decorative />)} />
                ) : (
                  <Folder folder={f} count={counts[f.slug] ?? inside.length} href={`/folders/${f.slug}`} cover={<FolderCover folder={f} memories={inside} />}
                    pour={pourFor(inside, cards)} />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" style={{ marginTop: 96 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
            <h2 id="recent-heading" className="hand" style={{ fontSize: 36, fontWeight: 600, margin: 0 }}>recently tucked in</h2>
            <svg aria-hidden="true" width="70" height="34" viewBox="0 0 70 34">
              <path d="M2 6 C22 2 44 8 60 26 M60 26 l-10 -2 M60 26 l1 -10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <ul className={s.recent}>
            {recent.map((m, i) => {
              const photo = m.photos[0];
              const card = photo ? undefined : cardFor(m);
              const cardImg = card ? (card.finishedImage?.url ?? (card.art.kind === "full-art" ? card.art.illustration.url : undefined)) : undefined;
              return (
                <li key={m.id}>
                  <Link href={`/memories/${m.id}`} aria-label={`${m.title}, ${stampDate(m.date).toLowerCase()}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                    <Polaroid
                      src={photo?.src ?? cardImg}
                      alt={photo?.alt ?? (cardImg ? `Our card for ${m.title}` : `Page: ${m.title}`)}
                      caption={m.title.toLowerCase()}
                      width={190}
                      rot={RECENT_ROT[i]}
                      washi={WASHI[i]}
                    >
                      <span className={`tx-lined ${s.slip}`}>
                        <span className={s.slipDate}>{stampDate(m.date)}</span>
                        <span className={s.slipTitle}>{m.title}</span>
                        {m.summary && <span className={s.slipLine}>{m.summary}</span>}
                      </span>
                    </Polaroid>
                    <span className={s.recentDate}>{stampDate(m.date)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
