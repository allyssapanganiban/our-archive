"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import o from "./folderOpen.module.css";

type Stage = "idle" | "pre" | "lift" | "open" | "pour" | "fill";

/** Base timings in ms; all scaled by `speed` (2 = twice as slow). */
export const FOLDER_OPEN_TIMING = { lift: 460, open: 380, pourEach: 680, stagger: 75, hold: 250, fill: 650 } as const;

type Geometry = { left: number; top: number; width: number; tx: number; ty: number; scale: number; mx: number; my: number; targets: [number, number, number][] };

type Props = {
  href: string;
  children: ReactNode;
  /** Items that pour out of the folder. */
  pour?: ReactNode[];
  speed?: number;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
};

const ROT = [-12, 7, -4, 5, -8, 10];
const DX = [-0.9, -0.55, -0.18, 0.2, 0.56, 0.92];
const DY = [-0.3, -0.62, -0.78, -0.76, -0.6, -0.28];

/**
 * A folder link that opens with a little show: the folder lifts to the centre,
 * its cover swings open, the contents pour out, the page fills in from the
 * folder's mouth, then we navigate. Cmd/Ctrl-click, middle-click and reduced
 * motion all skip straight to normal navigation.
 */
export function FolderOpenLink({ href, children, pour = [], speed = 1, className, style, ...rest }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [geo, setGeo] = useState<Geometry | null>(null);
  const timers = useRef<number[]>([]);
  const items = pour.slice(0, 6);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      document.documentElement.style.overflow = "";
    },
    [],
  );

  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // plain navigation
    if (stage !== "idle") return e.preventDefault();
    e.preventDefault();

    const body = (e.currentTarget.querySelector('[data-part="body"]') as HTMLElement | null) ?? e.currentTarget;
    const r = body.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.max(1, Math.min(Math.min(440, vw * 0.82) / r.width, 1.8));
    const cy = vh * 0.6;
    const tx = vw / 2 - (r.left + r.width / 2);
    const ty = cy - (r.top + r.height / 2);
    const mx = vw / 2;
    const my = cy - (r.height * scale) / 2 + 58 * scale;
    const spread = Math.min(vw * 0.42, 560);
    const lift = Math.min(my - 130, 420);
    setGeo({ left: r.left, top: r.top, width: r.width, tx, ty, scale, mx, my, targets: DX.map((dx, i) => [dx * spread, DY[i] * lift, ROT[i]]) });

    router.prefetch(href);
    document.documentElement.style.overflow = "hidden";
    const k = speed;
    const T = FOLDER_OPEN_TIMING;
    setStage("pre");
    requestAnimationFrame(() => requestAnimationFrame(() => setStage("lift")));
    let t = T.lift * k;
    at(t, () => setStage("open"));
    t += T.open * k;
    if (items.length) {
      at(t, () => setStage("pour"));
      t += (T.pourEach + T.stagger * (items.length - 1) + T.hold) * k;
    }
    at(t, () => setStage("fill"));
    t += T.fill * k;
    at(t, () => router.push(href));
    // If navigation stalls, don't leave the page covered.
    at(t + 6000, () => {
      setStage("idle");
      document.documentElement.style.overflow = "";
    });
  };

  const overlay =
    stage !== "idle" && geo
      ? createPortal(
          <div
            className={o.overlay}
            data-stage={stage}
            aria-hidden="true"
            style={{ ["--k" as string]: speed, ["--mx" as string]: `${geo.mx}px`, ["--my" as string]: `${geo.my}px` } as CSSProperties}
          >
            <div className={o.backdrop} />
            <div
              className={o.clone}
              style={{ left: geo.left, top: geo.top, width: geo.width, transform: stage === "pre" ? "none" : `translate(${geo.tx}px, ${geo.ty}px) scale(${geo.scale})` }}
            >
              {children}
            </div>
            {items.map((node, i) => {
              const [tx, ty, tr] = geo.targets[i];
              return (
                <div key={i} className={o.px} style={{ left: geo.mx, top: geo.my, ["--i" as string]: i, ["--tx" as string]: `${tx}px` } as CSSProperties}>
                  <div className={o.py} style={{ ["--i" as string]: i, ["--ty" as string]: `${ty}px` } as CSSProperties}>
                    <div className={o.pi} style={{ ["--i" as string]: i, ["--tr" as string]: `${tr}deg` } as CSSProperties}>{node}</div>
                  </div>
                </div>
              );
            })}
            <div className={o.fill} />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Link href={href} onClick={onClick} className={className} style={{ ...style, visibility: stage === "idle" ? undefined : "hidden" }} {...rest}>
        {children}
      </Link>
      {overlay}
    </>
  );
}
