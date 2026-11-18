import { accents, color, shadow, space, type as typeScale } from "@/design/tokens";
import { OUTFITS } from "@/lib/avatars";
import { CARDS, FOLDERS, STAR_EXAMPLE, memoriesIn } from "@/lib/sample-data";
import { Avatar, HoloTilt, TradingCard, TradingCardSleeve } from "@/components/cards";
import { Cassette, LabelTag, PaperClip, Polaroid, Postmark, Stamp, Sticker, Tape, Ticket, TornEdge } from "@/components/ephemera";
import { Folder, FolderCover } from "@/components/folder";
import { TopBar } from "@/components/nav";
import { washi } from "@/design/tokens";

export const metadata = { title: "Design system · Our Scrapbook" };

const Section = ({ n, title, children }: { n: string; title: string; children: React.ReactNode }) => (
  <section style={{ marginTop: 76 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, borderBottom: "1.25px solid var(--ink)", paddingBottom: 10, marginBottom: 24 }}>
      <span className="label">{n}</span>
      <h2 className="display" style={{ fontSize: 44, lineHeight: 1, margin: 0 }}>{title}</h2>
    </div>
    {children}
  </section>
);
const Cell = ({ name, note, h = 220, children }: { name: string; note: string; h?: number; children: React.ReactNode }) => (
  <div>
    <div style={{ position: "relative", height: h, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    <code className="mono" style={{ color: "var(--kraft)", fontWeight: 700, fontSize: 12 }}>&lt;{name}&gt;</code>
    <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{note}</div>
  </div>
);

/** Living reference for tokens and every reusable piece. */
export default function DesignSystemPage() {
  const trips = FOLDERS.find((f) => f.slug === "trips")!;
  const pixel = CARDS.find((c) => c.frame === "standard" && !c.finishedImage)!;
  const prism = CARDS.find((c) => c.frame === "prism" && !c.finishedImage)!;
  const star = STAR_EXAMPLE;
  return (
    <main className="page tx-cream">
      <div className="wrap">
        <TopBar />
        <h1 className="display" style={{ fontSize: "clamp(64px, 9vw, 120px)", lineHeight: 0.9, margin: "56px 0 0" }}>
          Our <em>Scrapbook</em>
        </h1>
        <p className="hand" style={{ fontSize: 30, margin: "14px 0 0" }}>opening a keepsake box, not using software.</p>

        <Section n="01" title="Colour">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 22 }}>
            {(["cream", "kraft", "manila", "ink"] as const).map((k) => (
              <Swatch key={k} name={k} hex={color[k]} />
            ))}
            {(Object.keys(accents) as (keyof typeof accents)[]).map((k) => (
              <Swatch key={k} name={k} hex={accents[k].soft} deep={accents[k].deep} />
            ))}
          </div>
        </Section>

        <Section n="02" title="Type">
          {Object.entries(typeScale).map(([k, [size]]) => {
            const fam = k.startsWith("display") || k === "title" || k === "item" ? "display" : k === "pill" || k.startsWith("label") ? "mono" : "hand";
            return (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "baseline", gap: 20, padding: "10px 0", borderBottom: "1px dashed rgba(31,27,24,.2)" }}>
                <span className="label" style={{ fontSize: 12 }}>{k}</span>
                <span className={fam} style={{ fontSize: Math.min(size, 96), lineHeight: 1.1 }}>{fam === "mono" ? "NOVEMBER '26" : "our little archive"}</span>
              </div>
            );
          })}
        </Section>

        <Section n="03" title="Spacing & shadow">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 60 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {space.slice(1).map((v) => (
                <div key={v} className="mono" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
                  <span style={{ width: 30, textAlign: "right" }}>{v}</span>
                  <span style={{ height: 12, width: v * 2, background: "var(--kraft)" }} />
                </div>
              ))}
            </div>
            {(["rest", "lift", "page"] as const).map((k) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={{ width: 130, height: 96, background: "var(--white)", boxShadow: shadow[k] }} />
                <p className="mono" style={{ fontSize: 12 }}>{k}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section n="04" title="Ephemera">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "40px 50px" }}>
            <Cell name="Polaroid" note="alt text required" h={260}>
              <Polaroid src="/scenes/sunset.svg" alt="Sunset over the river" caption="the long way home" width={180} washi="pink" />
            </Cell>
            <Cell name="Tape" note={washi.join(", ")} h={200}>
              {washi.map((w, i) => (
                <Tape key={w} kind={w} width={150} height={24} rot={[-4, 3, -2, 5, -3][i]} style={{ left: 40 + (i % 2) * 20, top: 12 + i * 34 }} />
              ))}
            </Cell>
            <Cell name="Stamp" note="scalloped, photo or pixel art">
              <Stamp src="/scenes/lake.svg" value="04" label="LAKE" rot={-6} style={{ left: 30, top: 50 }} />
              <Stamp src="/backgrounds/pixel-dusk.svg" value="HP" label="OUR SET" rot={4} style={{ left: 130, top: 60 }} />
            </Cell>
            <Cell name="Postmark" note="place + date">
              <Postmark text="RIVERSIDE · 2026" date="11·11·26" size={100} style={{ left: 20, top: 60 }} />
            </Cell>
            <Cell name="Sticker" note="real button when it has onClick" h={150}>
              <Sticker background="var(--marigold)" size={78} style={{ left: 20, top: 30 }}>firsts!</Sticker>
              <Sticker background="var(--prism)" size={72} rot={12} style={{ left: 120, top: 40 }}>holo!</Sticker>
            </Cell>
            <Cell name="Ticket" note="notched, perforated stub" h={150}>
              <Ticket top="ADMIT TWO" title="Dinner for two" sub="NOV 11 · 7:30 PM" no="No. 001111" style={{ left: 0, top: 20 }} />
            </Cell>
            <Cell name="Cassette" note="playlist; pass href to link out" h={190}>
              <Cassette title="november, us" width={230} style={{ left: 10, top: 10 }} />
            </Cell>
            <Cell name="TornEdge" note="seeded so it never jitters" h={150}>
              <TornEdge edge="all" seed={30} rot={-2} surface="paper" style={{ width: 240 }}>
                <span className="hand" style={{ fontSize: 24 }}>a torn note, any edge</span>
              </TornEdge>
            </Cell>
            <Cell name="PaperClip · LabelTag" note="holds index cards" h={150}>
              <div style={{ position: "relative", width: 150, height: 100, background: "var(--white)", boxShadow: "var(--shadow-rest)", transform: "rotate(2deg)" }}>
                <PaperClip style={{ left: 20, top: -24 }} />
              </div>
              <LabelTag style={{ right: 10, bottom: 20 }}>binder 01</LabelTag>
            </Cell>
          </div>
        </Section>

        <Section n="05" title="Folder">
          <div style={{ width: 340 }}>
            <Folder folder={trips} count={memoriesIn("trips").length} href="/folders/trips" cover={<FolderCover folder={trips} memories={memoriesIn("trips")} />} />
          </div>
        </Section>

        <Section n="06" title="Avatars">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 34, alignItems: "flex-end" }}>
            {OUTFITS.map((o) => (
              <figure key={o.id} style={{ margin: 0, textAlign: "center" }}>
                <Avatar id={o.id} scale={4} />
                <figcaption className="mono" style={{ fontSize: 11, marginTop: 8 }}>{o.label}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section n="07" title="Trading cards">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 30 }}>
            {[pixel, prism, star].map((c) => (
              <HoloTilt key={c.id}>
                <TradingCardSleeve width={220}>
                  <TradingCard card={c} width={220} />
                </TradingCardSleeve>
              </HoloTilt>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}

function Swatch({ name, hex, deep }: { name: string; hex: string; deep?: string }) {
  return (
    <div style={{ background: "var(--white)", padding: "10px 10px 14px", boxShadow: "var(--shadow-rest)" }}>
      <div style={{ height: 96, background: hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.06)" }} />
      {deep && <div className="mono" style={{ height: 28, background: deep, color: "var(--cream)", fontSize: 11, display: "flex", alignItems: "center", padding: "0 8px" }}>{deep} · text</div>}
      <div className="hand" style={{ fontSize: 24, marginTop: 8 }}>{name}</div>
      <div className="mono" style={{ fontSize: 12 }}>{hex}</div>
    </div>
  );
}
