import { accents } from "@/design/tokens";
import { daysBetween, monthLabel, monthName, stampDate, type UpcomingEvent } from "@/lib/dates";
import { PaperClip, TornEdge } from "@/components/ephemera";
import s from "./desk.module.css";

/**
 * A torn calendar page for the month of the next event, with every
 * upcoming date in that month circled and a countdown to the first one.
 */
export function CalendarPage({ events, today = new Date(), width = 300, rot = 3 }: { events: UpcomingEvent[]; today?: Date; width?: number; rot?: number }) {
  const next = events[0];
  if (!next) return null;
  const month = new Date(next.date.getFullYear(), next.date.getMonth(), 1);
  const inMonth = events.filter((e) => e.date.getMonth() === month.getMonth() && e.date.getFullYear() === month.getFullYear());
  const later = events.find((e) => !inMonth.includes(e));
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = month.getDay();
  const marks = new Map(inMonth.map((e) => [e.date.getDate(), e]));
  const days = daysBetween(today, next.date);
  const summary = inMonth.map((e) => `${e.label} on ${monthName(e.date)} ${e.date.getDate()}`).join(", ");

  return (
    <aside aria-label={`Up next: ${summary}. ${days} days to go.`} className={s.calendar} style={{ width, transform: `rotate(${rot}deg)` }}>
      <PaperClip rot={-6} style={{ left: 34, top: -26 }} />
      <TornEdge edge="all" seed={4} depth={5} teeth={40} surface="paper" padding="26px 24px 34px">
        <div className={s.calHead} aria-hidden="true">
          <span>{monthLabel(month).replace(/^(\w{3})\w*/, "$1")}</span>
          <span>UP NEXT</span>
        </div>
        <div className={`display ${s.calMonth}`} aria-hidden="true">{monthName(month)}</div>
        <div className={s.calGrid} aria-hidden="true">
          {"SMTWTFS".split("").map((d, i) => (
            <span key={i} className={s.calWeekday}>{d}</span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {Array.from({ length: daysIn }, (_, i) => {
            const d = i + 1;
            const e = marks.get(d);
            return (
              <span key={d} className={s.calDay}>
                {e && <span className={s.calMark} style={{ background: accents[e.accent].soft }} />}
                <span style={{ position: "relative", fontWeight: e ? 700 : 400 }}>{d}</span>
              </span>
            );
          })}
        </div>
        {inMonth.map((e) => (
          <p key={e.label} className={`hand ${s.calNote}`} style={{ color: accents[e.accent].deep }} aria-hidden="true">
            {ordinalDay(e.date.getDate())} · {e.short}
          </p>
        ))}
        <span className={s.countdown} aria-hidden="true">{days === 0 ? "TODAY!" : `${days} DAY${days === 1 ? "" : "S"} TO GO`}</span>
        {later && (
          <p className={s.calLater} style={{ color: accents[later.accent].deep }}>
            THEN: {later.short.toUpperCase().replace(" ♥", "")} · {stampDate(later.date).slice(0, 6)}
          </p>
        )}
      </TornEdge>
    </aside>
  );
}

function ordinalDay(d: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = d % 100;
  return d + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Compact strip version for phones. */
export function CalendarStrip({ events, today = new Date() }: { events: UpcomingEvent[]; today?: Date }) {
  const next = events[0];
  if (!next) return null;
  const second = events[1];
  const days = daysBetween(today, next.date);
  return (
    <TornEdge edge="all" seed={12} depth={4} teeth={26} surface="paper" padding="16px 18px" rot={-1.5} className={s.strip}>
      <div className={s.stripInner}>
        <div className={s.stripDate}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "var(--muted)" }}>{stampDate(next.date).slice(0, 3)} &rsquo;{String(next.date.getFullYear()).slice(2)}</div>
          <div className="display" style={{ fontSize: 44, lineHeight: 1, color: accents[next.accent].deep }}>{next.date.getDate()}</div>
        </div>
        <div>
          <p className="hand" style={{ fontSize: 23, lineHeight: 1, margin: 0, color: accents[next.accent].deep }}>{next.short}</p>
          {second && (
            <p className="hand" style={{ fontSize: 20, lineHeight: 1.1, margin: "2px 0 0", color: accents[second.accent].deep }}>
              {second.short} · {stampDate(second.date).slice(0, 6).toLowerCase()}
            </p>
          )}
          <p className="mono" style={{ fontSize: 11, letterSpacing: ".16em", margin: "4px 0 0", fontWeight: 700 }}>{days} DAYS TO GO</p>
        </div>
      </div>
    </TornEdge>
  );
}
