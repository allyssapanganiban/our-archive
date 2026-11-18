import { Postmark } from "@/components/ephemera";
import { TopBar } from "@/components/nav";
import { upcomingEvents } from "@/lib/dates";
import { CardsLive } from "./CardsLive";

export const dynamic = "force-dynamic";

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const { card } = await searchParams;
  return (
    <main className="page tx-kraft">
      <Postmark text="OUR CARDS · BINDER" date={String(new Date().getFullYear())} size={120} rot={-14} color="#F3EEE4" style={{ right: -20, top: 120 }} />
      <div className="wrap">
        <TopBar onDark />
        <header style={{ textAlign: "center", marginTop: 52 }}>
          <h1 className="display" style={{ fontSize: "clamp(64px, 8vw, 112px)", lineHeight: 0.95, margin: 0 }}>Our Cards</h1>
        </header>
        <CardsLive initialCardId={card} nextEvent={upcomingEvents()[0]} />
      </div>
    </main>
  );
}
