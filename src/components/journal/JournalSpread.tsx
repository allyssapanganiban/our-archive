import Link from "next/link";
import type { CardData } from "@/lib/card-schema";
import { dotDate, monthLabel, parseDay, PEOPLE } from "@/lib/dates";
import { inks } from "@/design/tokens";
import type { Memory } from "@/lib/types";
import { Cassette, Polaroid, Postmark, Tape, Ticket, TornEdge } from "@/components/ephemera";
import { CardPocket } from "@/components/cards/CardPocket";
import s from "./journal.module.css";

const ROTS = [-5, 4, -2, 3];

type Props = {
  memory: Memory;
  folderTitle: string;
  card?: CardData;
};

/**
 * A memory as a two-page journal spread (one page on phones).
 * Left: date, title, the first writer's diary, photos. Right: the other
 * person's note, checklist, tickets, playlist and the tucked-in card.
 */
export function JournalSpread({ memory, folderTitle, card }: Props) {
  const date = parseDay(memory.date);
  const [main, ...others] = memory.diary;
  const no = memory.number ? `No. ${String(memory.number).padStart(2, "0")}` : "";
  return (
    <article aria-label={`Journal spread: ${memory.title}`} className={`${s.spread} page-turn`}>
      <div className={`${s.page} ${s.left} tx-lined`}>
        <div className={s.header}>
          <span>{monthLabel(date)}</span>
          <span>{folderTitle.toUpperCase()}</span>
          {no && <span style={{ color: "var(--pink-deep)" }}>{no}</span>}
        </div>
        <h1 className={`display ${s.title}`}>{memory.title}</h1>
        {memory.location && (
          <Postmark className={s.postmark} text={`${memory.location.name.toUpperCase()} · ${parseDay(memory.location.date ?? memory.date).getFullYear()}`} date={dotDate(memory.location.date ?? memory.date)} size={100} rot={12}
            color="var(--pink-deep)" style={{ right: 24, top: 84 }} />
        )}
        {main && (
          <div className={s.diary} style={{ color: "var(--ink)" }}>
            {main.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {main.signoff && <p className={s.signoff} style={{ color: inks[main.author], marginTop: 0 }}>{main.signoff}</p>}
          </div>
        )}
        {memory.photos.length > 0 && (
          <div className={s.photoRow}>
            {memory.photos.slice(0, 2).map((p, i) => (
              <Polaroid key={p.src} src={p.src} alt={p.alt} caption={p.caption} washi={p.washi ?? "plain"} width={i === 0 ? 210 : 180} rot={ROTS[i]}
                style={{ position: "absolute", left: i === 0 ? "2%" : "44%", top: i === 0 ? 10 : 36 }} />
            ))}
          </div>
        )}
      </div>

      <div className={`${s.page} ${s.right} tx-grid`}>
        <div className={s.header}>
          <span>A + J</span>
          <span>OUR SCRAPBOOK</span>
        </div>
        {others.map((d) => (
          <div key={d.author} className={s.note}>
            <TornEdge edge="all" seed={9} depth={5} teeth={30} surface="white" padding="22px 24px 26px" rot={-2}>
              <p className={s.noteWho} style={{ color: inks[d.author] }}>{PEOPLE[d.author].name.toUpperCase()}&rsquo;S SIDE</p>
              {d.paragraphs.map((p, i) => (
                <p key={i} className="hand" style={{ fontSize: 25, lineHeight: 1.15, margin: 0, color: inks[d.author] }}>{p}</p>
              ))}
            </TornEdge>
            <Tape kind={d.author === "justin" ? "sky" : "pink"} width={80} height={22} rot={3} style={{ left: 120, top: -10 }} />
          </div>
        ))}
        {memory.checklist && (
          <>
            <p className={s.checkTitle}>{memory.checklist.title}</p>
            <ul className={s.checklist}>
              {memory.checklist.items.map((it) => (
                <li key={it.text}>
                  <span aria-hidden="true">{it.done ? "☑" : "☐"}</span> {it.text}
                  <span className="sr-only">{it.done ? " (done)" : " (not yet)"}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className={s.extras}>
          {memory.tickets.map((t, i) => (
            <Ticket key={t.no} {...t} rot={5 - i * 7} width={260} height={106} style={{ right: "4%", top: i * 120 }} />
          ))}
          {memory.playlist && (
            <>
              <Cassette title={memory.playlist.title} href={memory.playlist.url} width={250} rot={-6} style={{ left: "2%", top: 150 }} />
              <ol aria-label={`Playlist: ${memory.playlist.title}`} className={s.tracks} style={{ position: "absolute", left: "calc(2% + 270px)", top: 160 }}>
                {memory.playlist.tracks.map((t, i) => (
                  <li key={t}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </>
          )}
          {card && <CardPocket card={card} style={{ right: "4%", bottom: -10 }} />}
        </div>
      </div>
    </article>
  );
}

/** Previous / next page links under a spread. */
export function PageTurn({ prev, next, index, total }: { prev?: { href: string; label: string }; next?: { href?: string; label: string }; index: number; total: number }) {
  return (
    <nav aria-label="Turn the page" className={s.turn}>
      {prev ? <Link href={prev.href}>← {prev.label}</Link> : <span />}
      <span className={s.muted}>{index} OF {total}</span>
      {next ? next.href ? <Link href={next.href}>{next.label} →</Link> : <span className={s.muted}>{next.label} →</span> : <span />}
    </nav>
  );
}
