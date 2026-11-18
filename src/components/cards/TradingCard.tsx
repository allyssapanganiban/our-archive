import type { CardData, PixelArt, FullArt } from "@/lib/card-schema";
import { TYPE_COLORS } from "@/lib/card-schema";
import { slashDate } from "@/lib/dates";
import { HeartIcon } from "@/components/ephemera";
import { Avatar } from "./Avatar";
import { EnergyIcon } from "./EnergyIcon";
import s from "./cards.module.css";

type Props = {
  card: CardData;
  /** Rendered width in px. The whole card scales from this (font-size = width / 25). */
  width?: number;
  /** Hide from screen readers when a parent already labels the card (binder pockets). */
  decorative?: boolean;
};

/**
 * Draws a card from its JSON. Art comes from the image model or an upload;
 * frame, text and icons are always ours, drawn here.
 */
export function TradingCard({ card, width = 250, decorative = false }: Props) {
  const label = card.finishedImage?.alt ?? `${card.occasion.title} card: ${card.headlineMove} ${card.attack.name} ${card.attack.damage}.`;
  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      style={{ fontSize: width / 25, width: "25em" }}
    >
      {card.finishedImage ? (
        <div className={s.card}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.finishedImage.url} alt="" draggable={false} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
          <div className={s.holo} />
        </div>
      ) : card.frame === "star" && card.art.kind === "full-art" ? <StarFrame card={card} art={card.art} /> : <PixelFrame card={card} />}
    </div>
  );
}

function PixelFrame({ card }: { card: CardData }) {
  const t = TYPE_COLORS[card.type];
  const prism = card.frame === "prism";
  const art = card.art as PixelArt | FullArt;
  return (
    <div className={`${s.card} ${prism ? s.framePrism : s.frameStandard}`}>
      <div className={s.inner} style={{ background: `linear-gradient(165deg, ${t.light}, ${t.mid} 120%)` }}>
        {prism && <span className={s.prismBadge}>✦ PRISM</span>}
        <div className={s.row}>
          <span className={s.stage}>{card.stage}</span>
          <span className={s.name}>{card.name}</span>
          <span className={s.hpLabel} style={{ color: t.deep }}>HP</span>
          <span className={s.hp}>{card.hp}</span>
          <EnergyIcon type={card.type} size="1.5em" />
        </div>

        <div className={`${s.artWindow} ${prism ? s.prismWindow : ""}`}>
          {art.kind === "pixel" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={s.bg} src={art.background.url} alt="" />
              <div className={s.avatars}>
                {art.avatars.map((a) => (
                  <Avatar key={a.person} id={a.outfit} height="8.2em" alt="" />
                ))}
              </div>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={s.bg} src={art.illustration.url} alt="" style={{ imageRendering: "auto" }} />
          )}
        </div>

        <div className={s.infoStrip}>
          {card.occasion.title} · {slashDate(card.occasion.date, true)}
        </div>
        <div className={s.row} style={{ padding: ".2em 0" }}>
          <span className={s.moveLabel} style={{ color: t.deep }}>MOVE</span>
          <span className={s.move} style={{ color: t.deep }}>{card.headlineMove}</span>
        </div>
        <div className={s.row} style={{ gap: ".4em" }}>
          {card.attack.cost.map((c, i) => (
            <EnergyIcon key={i} type={c} size="1.35em" />
          ))}
          <span className={s.attackName}>{card.attack.name}</span>
          <span className={s.damage}>{card.attack.damage}</span>
        </div>
        <div className={s.attackText}>{card.attackText}</div>
        <div className={s.stats}>
          <span>weakness: {card.weakness}</span>
          <span>resist: {card.resistance}</span>
          <span>retreat: {card.retreat}</span>
        </div>
        <div className={s.flavor}>{card.flavorText}</div>
        <div className={s.foot}>
          <span>
            A♥J · {String(card.setNumber.no).padStart(3, "0")}/{String(card.setNumber.total).padStart(3, "0")} · our own set
          </span>
          <span className={s.corner}>
            <HeartIcon size="70%" fill={t.light} />
          </span>
        </div>
      </div>
      <div className={s.holo} />
    </div>
  );
}

function StarFrame({ card, art }: { card: CardData; art: FullArt }) {
  const deep = "#94474F";
  return (
    <div className={`${s.card} ${s.frameStar}`}>
      <div className={s.starArt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art.illustration.url} alt="" />
        <div className={s.starTop}>
          <span className={s.starStage}>STAGE ★</span>
          <span className={s.name}>{card.name}</span>
          <span className={s.starBadge}>★</span>
          <span className={s.hpLabel} style={{ color: deep }}>HP</span>
          <span className={s.hp}>{card.hp}</span>
          <EnergyIcon type={card.type} size="1.5em" color="#C2566A" />
        </div>
        <div className={s.starPanel}>
          {card.subtitle && <div className={s.subtitle}>{card.subtitle}</div>}
          <div className={s.row} style={{ gap: ".45em" }}>
            <span className={s.moveLabel} style={{ color: deep }}>STAR MOVE</span>
            <span className={s.move} style={{ color: deep }}>{card.headlineMove}</span>
          </div>
          <div className={s.row} style={{ gap: ".4em" }}>
            {card.attack.cost.map((c, i) => (
              <EnergyIcon key={i} type={c} size="1.3em" color="#C2566A" />
            ))}
            <span className={s.attackName}>{card.attack.name}</span>
            <span className={s.damage}>{card.attack.damage}</span>
          </div>
          <div className={s.foot}>
            <span>
              A♥J · {String(card.setNumber.no).padStart(3, "0")}/{String(card.setNumber.total).padStart(3, "0")} · our own set
            </span>
            <span>retreat: {card.retreat}</span>
          </div>
        </div>
      </div>
      <div className={s.holo} />
    </div>
  );
}
