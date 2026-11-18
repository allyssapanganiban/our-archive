import { TopBar } from "@/components/nav";
import type { CardData } from "@/lib/card-schema";
import { ordinal, PEOPLE, slashDate, toISODay, upcomingEvents } from "@/lib/dates";
import { StudioLive } from "./StudioLive";

export const dynamic = "force-dynamic";

/** A fresh card draft for the next thing on the calendar. */
function draftForNextEvent(): CardData {
  const e = upcomingEvents()[0];
  const date = e ? toISODay(e.date) : toISODay(new Date());
  const birthday = e?.kind === "birthday" && e.who;
  const age = birthday ? e.date.getFullYear() - Number(PEOPLE[e.who!].birthday.slice(0, 4)) : 0;
  return {
    id: "",
    schemaVersion: 1,
    style: "pixel",
    frame: "standard",
    type: birthday ? "ember" : "love",
    name: birthday ? PEOPLE[e.who!].name : "Allyssa & Justin",
    subtitle: `Our story continues, every day. ${slashDate(date)}`,
    stage: "BASIC",
    hp: birthday ? String(age) : "1000",
    headlineMove: birthday ? `Happy ${ordinal(age)} Birthday!` : `Happy ${(e?.label ?? "day").replace(/\b\w/g, (c) => c.toUpperCase())}!`,
    attack: { name: birthday ? "Birthday Wish" : "Love Beam", cost: birthday ? ["ember", "ember"] : ["love", "love"], damage: birthday ? `×${age}` : "×1000" },
    attackText: "Hugs the defending heart until it says “okay, fine, I love you too.”",
    flavorText: "Two small pixels who found each other and decided to stay.",
    weakness: "tiramisu",
    resistance: "mornings",
    retreat: "never",
    cornerIcon: birthday ? "cake" : "heart",
    setNumber: { no: 1, total: 14 },
    occasion: { title: e?.label ?? "Something special", kind: e?.kind ?? "other", date, note: "" },
    art: {
      kind: "pixel",
      background: { source: "upload", url: "/backgrounds/pixel-dusk.svg" },
      avatars: [
        { person: "allyssa", outfit: "allyssa-pink-dress-braid" },
        { person: "justin", outfit: "justin-leather-jacket" },
      ],
    },
    createdBy: "allyssa",
    createdAt: new Date().toISOString(),
  };
}

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const { card: cardId } = await searchParams;
  return (
    <main className="page tx-kraft">
      <div className="wrap">
        <TopBar onDark />
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px 24px", marginTop: 44 }}>
          <h1 className="display" style={{ fontSize: "clamp(52px, 6vw, 84px)", lineHeight: 1, margin: 0 }}>The card studio</h1>
          <p className="hand" style={{ fontSize: 28, margin: 0, color: "var(--cream-muted)" }}>a little crafting desk for our big days</p>
        </header>
        <StudioLive cardId={cardId} draft={draftForNextEvent()} />
      </div>
    </main>
  );
}
