"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ENERGY_TYPES,
  TEXT_LIMITS,
  TYPE_COLORS,
  textProblems,
  type CardData,
  type FrameType,
  type FullArt,
  type OutfitId,
  type PixelArt,
} from "@/lib/card-schema";
import { outfitsFor } from "@/lib/avatars";
import { PEOPLE, type Person } from "@/lib/dates";
import { imageToDataUrl } from "@/lib/images";
import { newId, saveFailedMessage, saveCard } from "@/lib/store";
import { Avatar } from "@/components/cards/Avatar";
import { TradingCard } from "@/components/cards/TradingCard";
import { PaperClip, Sticker } from "@/components/ephemera";
import { offlineActions, type StudioActions } from "./actions";
import s from "./studio.module.css";

type Props = {
  initial: CardData;
  /** Memories the card can be tucked into: [id, label]. */
  memories: [string, string][];
  actions?: StudioActions;
  writer?: Person;
};

const BACKGROUNDS = ["dusk", "day", "sea", "meadow"] as const;
const FRAME_TABS: { id: FrameType; label: string; hint: string }[] = [
  { id: "standard", label: "standard", hint: "" },
  { id: "prism", label: "prism", hint: "rainbow crystal border, extra shiny ✦" },
  { id: "star", label: "star", hint: "gold + rainbow full-art, with a subtitle line" },
];

/** The crafting desk: occasion note on the left, live card in the middle, options as stickers on the right. */
export function CardStudio({ initial, memories, actions = offlineActions, writer = "allyssa" }: Props) {
  const router = useRouter();
  const [card, setCard] = useState<CardData>(initial);
  const [pixelArt, setPixelArt] = useState<PixelArt>(
    initial.art.kind === "pixel"
      ? initial.art
      : { kind: "pixel", background: { source: "upload", url: "/backgrounds/pixel-dusk.svg" }, avatars: [{ person: "allyssa", outfit: "allyssa-pink-dress-braid" }, { person: "justin", outfit: "justin-leather-jacket" }] },
  );
  const [fullArt, setFullArt] = useState<FullArt>(
    initial.art.kind === "full-art" ? initial.art : { kind: "full-art", illustration: { source: "upload", url: "/scenes/sunset.svg", from: "finished-art" }, alt: "Full-art illustration of us" },
  );
  const [bgMode, setBgMode] = useState<"generate" | "upload">(initial.art.kind === "pixel" && initial.art.background.source === "generated" ? "generate" : "upload");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<null | "text" | "background" | "save">(null);
  const [message, setMessage] = useState<string>("");
  const [tuckInto, setTuckInto] = useState(initial.memoryId ?? "");

  const full = card.frame === "star";
  const preview: CardData = useMemo(() => ({ ...card, style: full ? "full-art" : "pixel", art: full ? fullArt : pixelArt }), [card, full, fullArt, pixelArt]);
  const problems = textProblems(preview);

  const update = (patch: Partial<CardData>) => setCard((c) => ({ ...c, ...patch }));
  const updateOccasion = (patch: Partial<CardData["occasion"]>) => setCard((c) => ({ ...c, occasion: { ...c.occasion, ...patch } }));
  const setFrame = (frame: FrameType) => update({ frame, stage: frame === "star" ? "STAR" : "BASIC" });

  const upload = async (file: File | undefined, target: "background" | "illustration") => {
    if (!file) return;
    // Kept as a data URL so the saved card still has its art after a reload (until real uploads exist).
    let url: string;
    try {
      url = await imageToDataUrl(file, target === "background" ? { max: 1600, keepUnder: 1_500_000 } : { max: 1500 });
    } catch {
      setMessage("that file didn’t open as an image. try a PNG or JPG?");
      return;
    }
    if (target === "background") setPixelArt((a) => ({ ...a, background: { source: "upload", url } }));
    else setFullArt((a) => ({ ...a, illustration: { source: "upload", url, from: "finished-art" } }));
  };

  const writeText = async () => {
    setBusy("text");
    setMessage("");
    try {
      const patch = await actions.writeText({ occasion: card.occasion, frame: card.frame, type: card.type });
      update(patch);
      setMessage("new card text written ✦");
    } catch {
      setMessage("couldn’t write the text this time. try again?");
    } finally {
      setBusy(null);
    }
  };

  const makeBackground = async () => {
    if (!actions.makeBackground) return;
    setBusy("background");
    try {
      const background = await actions.makeBackground({ occasion: card.occasion });
      setPixelArt((a) => ({ ...a, background }));
    } catch {
      setMessage("the background didn’t come out. try again, or upload one.");
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy("save");
    let saved: CardData;
    try {
      saved = await saveCard({ ...preview, id: card.id || newId("card"), memoryId: tuckInto || undefined, createdBy: card.id ? card.createdBy : writer, createdAt: card.id ? card.createdAt : new Date().toISOString() });
    } catch (e) {
      setBusy(null);
      setMessage(saveFailedMessage(e));
      return;
    }
    setBusy(null);
    router.push(`/cards?card=${saved.id}`);
  };

  const exportPng = async () => {
    if (!actions.exportPng) return;
    const blob = await actions.exportPng(preview);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${preview.occasion.title.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const setOutfit = (person: Person, outfit: OutfitId) =>
    setPixelArt((a) => ({ ...a, avatars: a.avatars.map((av) => (av.person === person ? { ...av, outfit } : av)) }));

  return (
    <div className={s.desk}>
      {/* ---------- occasion note card ---------- */}
      <section aria-label="Occasion" className={s.noteCard}>
        <PaperClip rot={-4} style={{ left: 40, top: -26 }} />
        <div className={`tx-lined ${s.noteInner}`}>
          <label htmlFor="occ-title" className={s.label}>OCCASION</label>
          <input id="occ-title" className={s.input} value={card.occasion.title} onChange={(e) => updateOccasion({ title: e.target.value })} />
          <label htmlFor="occ-note" className={s.label}>WHAT&rsquo;S IT ABOUT?</label>
          <textarea
            id="occ-note"
            rows={6}
            className={s.textarea}
            value={card.occasion.note}
            onChange={(e) => updateOccasion({ note: e.target.value })}
            placeholder="what it is, the date, memories, inside jokes…"
          />
          <div className={s.twoCol}>
            <label className={s.field}>
              <span className={s.label}>DATE</span>
              <input type="date" className={s.input} value={card.occasion.date} onChange={(e) => updateOccasion({ date: e.target.value })} />
            </label>
            <label className={s.field}>
              <span className={s.label}>KIND</span>
              <select className={s.input} value={card.occasion.kind} onChange={(e) => updateOccasion({ kind: e.target.value as CardData["occasion"]["kind"] })}>
                {(["monthversary", "anniversary", "birthday", "trip", "date", "other"] as const).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </label>
          </div>
          <label className={s.field}>
            <span className={s.label}>TUCK INTO A MEMORY</span>
            <select className={s.input} value={tuckInto} onChange={(e) => setTuckInto(e.target.value)}>
              <option value="">not yet</option>
              {memories.map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </label>
          <button type="button" className={s.inkButton} onClick={writeText} disabled={busy !== null}>
            {busy === "text" ? "writing…" : "✦ write the card text"}
          </button>
        </div>
      </section>

      {/* ---------- live preview ---------- */}
      <section aria-label="Live preview" className={s.center}>
        <div className={`tx-mat ${s.mat}`}>
          <div aria-hidden="true" className={s.ruler}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i}>{i}</span>
            ))}
          </div>
          <span aria-hidden="true" className={s.matNote}>63 × 88 MM · PRINT LATER</span>
          <div className="drop-in" key={`${card.frame}-${card.type}`}>
            <TradingCard card={preview} width={320} />
          </div>
        </div>
        <p role="status" className={s.status}>{busy === "background" ? "painting a background…" : message}</p>
        {problems.length > 0 && (
          <ul className={s.problems} aria-label="Text that won’t fit">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <div role="group" aria-label="Regenerate or edit" className={s.regen}>
          <button type="button" className={s.dashed} onClick={writeText} disabled={busy !== null}>↻ text</button>
          {!full && actions.makeBackground && (
            <button type="button" className={s.dashed} onClick={makeBackground} disabled={busy !== null}>↻ background</button>
          )}
          <button type="button" className={s.dashed} aria-expanded={editing} onClick={() => setEditing((v) => !v)}>✎ edit fields</button>
          {actions.exportPng && <button type="button" className={s.dashed} onClick={exportPng}>⤓ export png</button>}
        </div>
        {editing && <FieldEditor card={card} update={update} />}
        <button type="button" className={`${s.saveStamp} lift`} onClick={save} disabled={busy !== null || problems.length > 0}>
          {busy === "save" ? "SAVING…" : "SAVE TO SCRAPBOOK"}
        </button>
      </section>

      {/* ---------- options ---------- */}
      <section aria-label="Card options" className={s.options}>
        <div>
          <p className={s.groupLabel}>STYLE</p>
          <div className={s.stickers}>
            <Sticker background="var(--sky)" size={96} rot={full ? -6 : 0} pressed={!full} onClick={() => setFrame(card.frame === "star" ? "standard" : card.frame)}
              style={{ boxShadow: !full ? "0 0 0 4px #FDFBF6, 0 0 0 7px var(--ink)" : undefined }}>
              <span className={s.stickerText}>pixel<small>AVATARS</small></span>
            </Sticker>
            <Sticker background="var(--pink)" size={96} rot={full ? 0 : 5} pressed={full} onClick={() => setFrame("star")}
              style={{ boxShadow: full ? "0 0 0 4px #FDFBF6, 0 0 0 7px var(--ink)" : undefined }}>
              <span className={s.stickerText}>full-art<small>ILLUSTRATED</small></span>
            </Sticker>
          </div>
        </div>

        <div>
          <p className={s.groupLabel}>FRAME</p>
          <div role="group" aria-label="Frame" className={s.tabs}>
            {FRAME_TABS.map((f) => (
              <button key={f.id} type="button" aria-pressed={card.frame === f.id} className={`${s.tab} ${card.frame === f.id ? "tx-manila" : "tx-manila-deep"}`} onClick={() => setFrame(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className={`tx-manila ${s.tabPanel}`}>
            {card.frame === "standard" ? (
              <>
                <p className={s.panelLabel}>TYPE COLOR · {TYPE_COLORS[card.type].label}</p>
                <div role="group" aria-label="Type color" className={s.swatches}>
                  {ENERGY_TYPES.map((t) => (
                    <button key={t} type="button" aria-label={`${t} type`} aria-pressed={card.type === t} className={s.swatch} style={{ background: TYPE_COLORS[t].mid }}
                      onClick={() => update({ type: t, attack: { ...card.attack, cost: card.attack.cost.map(() => t) } })} />
                  ))}
                </div>
              </>
            ) : (
              <p className="hand" style={{ fontSize: 22, margin: 0 }}>{FRAME_TABS.find((f) => f.id === card.frame)?.hint}</p>
            )}
          </div>
        </div>

        {full ? (
          <div>
            <p className={s.groupLabel}>ILLUSTRATION</p>
            <label className={s.uploadSticker}>
              <input type="file" accept="image/*,.heic,.heif" className="sr-only" onChange={(e) => upload(e.target.files?.[0], "illustration")} />
              <span className="hand">upload finished art</span>
            </label>
            <p className={s.small}>Photo restyling (your selfie → anime card art) plugs in here once the image step is connected.</p>
            <label className={s.field} style={{ marginTop: 10 }}>
              <span className={s.labelLight}>SUBTITLE LINE</span>
              <input className={s.inputLight} maxLength={TEXT_LIMITS.subtitle} value={card.subtitle ?? ""} onChange={(e) => update({ subtitle: e.target.value })} />
            </label>
          </div>
        ) : (
          <>
            <div>
              <p className={s.groupLabel}>BACKGROUND</p>
              <div className={s.stickers}>
                <Sticker background="var(--marigold)" size={88} rot={bgMode === "generate" ? 0 : -4} pressed={bgMode === "generate"} onClick={() => setBgMode("generate")}
                  style={{ boxShadow: bgMode === "generate" ? "0 0 0 4px #FDFBF6, 0 0 0 7px var(--ink)" : undefined }}>
                  <span className={s.stickerText}>✦ make<small>GENERATE</small></span>
                </Sticker>
                <Sticker background="var(--sage)" size={88} rot={bgMode === "upload" ? 0 : 6} pressed={bgMode === "upload"} onClick={() => setBgMode("upload")}
                  style={{ boxShadow: bgMode === "upload" ? "0 0 0 4px #FDFBF6, 0 0 0 7px var(--ink)" : undefined }}>
                  <span className={s.stickerText}>upload<small>MY OWN</small></span>
                </Sticker>
              </div>
              {bgMode === "upload" ? (
                <div className={s.bgRow}>
                  {BACKGROUNDS.map((b) => {
                    const url = `/backgrounds/pixel-${b}.svg`;
                    return (
                      <button key={b} type="button" aria-label={`Use the ${b} background`} aria-pressed={pixelArt.background.url === url} className={s.bgThumb}
                        style={{ backgroundImage: `url(${url})` }} onClick={() => setPixelArt((a) => ({ ...a, background: { source: "upload", url } }))} />
                    );
                  })}
                  <label className={s.bgThumb} style={{ display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Upload a background">
                    <input type="file" accept="image/*,.heic,.heif" className="sr-only" onChange={(e) => upload(e.target.files?.[0], "background")} />
                    <span className="hand" style={{ fontSize: 28, color: "var(--cream)" }}>+</span>
                  </label>
                </div>
              ) : actions.makeBackground ? (
                <button type="button" className={s.lightButton} onClick={makeBackground} disabled={busy !== null}>
                  {busy === "background" ? "painting…" : "paint a pixel background"}
                </button>
              ) : (
                <p className={s.small}>Generating backgrounds turns on once the OpenAI image step is connected. Upload one for now.</p>
              )}
            </div>
            <div>
              <p className={s.groupLabel}>AVATARS</p>
              <div className={s.avatarRows}>
                {pixelArt.avatars.map((av) => (
                  <label key={av.person} className={s.avatarRow}>
                    <span className={s.avatarChip}>
                      <Avatar id={av.outfit} height={50} alt="" />
                    </span>
                    <span className="sr-only">{PEOPLE[av.person].name}&rsquo;s outfit</span>
                    <span aria-hidden="true">{PEOPLE[av.person].initial} ·</span>
                    <select className={s.inputLight} value={av.outfit} onChange={(e) => setOutfit(av.person, e.target.value as OutfitId)}>
                      {outfitsFor(av.person).map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function FieldEditor({ card, update }: { card: CardData; update: (p: Partial<CardData>) => void }) {
  const text = (label: string, value: string, limit: number, onChange: (v: string) => void) => (
    <label className={s.field}>
      <span className={s.labelLight}>
        {label} <span style={{ opacity: 0.7 }}>{value.length}/{limit}</span>
      </span>
      <input className={s.inputLight} value={value} maxLength={limit} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
  return (
    <div className={s.fields}>
      {text("NAME", card.name, TEXT_LIMITS.name, (v) => update({ name: v }))}
      {text("HP", card.hp, 6, (v) => update({ hp: v }))}
      {text("HEADLINE MOVE", card.headlineMove, TEXT_LIMITS.headlineMove, (v) => update({ headlineMove: v }))}
      {text("ATTACK", card.attack.name, TEXT_LIMITS.attackName, (v) => update({ attack: { ...card.attack, name: v } }))}
      {text("DAMAGE", card.attack.damage, 6, (v) => update({ attack: { ...card.attack, damage: v } }))}
      {text("WHAT IT DOES", card.attackText, TEXT_LIMITS.attackText, (v) => update({ attackText: v }))}
      {text("FLAVOR TEXT", card.flavorText, TEXT_LIMITS.flavorText, (v) => update({ flavorText: v }))}
      {text("WEAKNESS", card.weakness, TEXT_LIMITS.weakness, (v) => update({ weakness: v }))}
      {text("RESIST", card.resistance, TEXT_LIMITS.resistance, (v) => update({ resistance: v }))}
      {text("RETREAT", card.retreat, TEXT_LIMITS.retreat, (v) => update({ retreat: v }))}
    </div>
  );
}
