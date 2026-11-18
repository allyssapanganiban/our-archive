/** Small seeded PRNG so torn edges look random but never change between renders. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Edge = "top" | "bottom" | "left" | "right" | "all";

/** CSS clip-path polygon with a ragged edge. depth in px, n = number of teeth. */
export function tornPolygon(seed = 1, edge: Edge = "bottom", depth = 7, n = 34): string {
  const r = seeded(seed);
  const j = () => (r() * depth).toFixed(1);
  const pts: string[] = [];
  const pct = (i: number, total: number) => ((100 * i) / total).toFixed(2);
  if (edge === "bottom") {
    pts.push("0 0", "100% 0");
    for (let i = n; i >= 0; i--) pts.push(`${pct(i, n)}% calc(100% - ${j()}px)`);
  } else if (edge === "top") {
    for (let i = 0; i <= n; i++) pts.push(`${pct(i, n)}% ${j()}px`);
    pts.push("100% 100%", "0 100%");
  } else if (edge === "right") {
    pts.push("0 0");
    for (let i = 0; i <= n; i++) pts.push(`calc(100% - ${j()}px) ${pct(i, n)}%`);
    pts.push("0 100%");
  } else if (edge === "left") {
    pts.push("100% 0", "100% 100%");
    for (let i = n; i >= 0; i--) pts.push(`${j()}px ${pct(i, n)}%`);
  } else {
    const half = Math.floor(n / 2);
    for (let i = 0; i <= n; i++) pts.push(`${pct(i, n)}% ${j()}px`);
    for (let i = 1; i < half; i++) pts.push(`calc(100% - ${j()}px) ${pct(i, half)}%`);
    for (let i = n; i >= 0; i--) pts.push(`${pct(i, n)}% calc(100% - ${j()}px)`);
    for (let i = half - 1; i > 0; i--) pts.push(`${j()}px ${pct(i, half)}%`);
  }
  return `polygon(${pts.join(",")})`;
}

/** Zig-zag ends for washi tape. */
export function zigzagEnds(n = 7, d = 3.5): string {
  const l = Array.from({ length: n + 1 }, (_, i) => `${d * (i % 2)}px ${((100 * i) / n).toFixed(1)}%`);
  const r = Array.from({ length: n + 1 }, (_, i) => `calc(100% - ${d * (i % 2)}px) ${(100 - (100 * i) / n).toFixed(1)}%`);
  return `polygon(${[...l, ...r].join(",")})`;
}

/** SVG path for a rectangle with scalloped (perforated) edges — postage stamps. */
export function scallopPath(w: number, h: number, r = 3.4, sides = "tblr"): string {
  const edge = (x0: number, y0: number, x1: number, y1: number, notched: boolean) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ux = (x1 - x0) / len;
    const uy = (y1 - y0) / len;
    const out: string[] = [];
    if (notched) {
      const count = Math.max(1, Math.round(len / (2.7 * r)));
      const step = len / count;
      for (let i = 0; i < count; i++) {
        const c = step * (i + 0.5);
        out.push(
          `L${(x0 + ux * (c - r)).toFixed(2)} ${(y0 + uy * (c - r)).toFixed(2)}`,
          `A${r} ${r} 0 0 0 ${(x0 + ux * (c + r)).toFixed(2)} ${(y0 + uy * (c + r)).toFixed(2)}`,
        );
      }
    }
    out.push(`L${x1} ${y1}`);
    return out.join(" ");
  };
  return [
    "M0 0",
    edge(0, 0, w, 0, sides.includes("t")),
    edge(w, 0, w, h, sides.includes("r")),
    edge(w, h, 0, h, sides.includes("b")),
    edge(0, h, 0, 0, sides.includes("l")),
    "Z",
  ].join(" ");
}

/** Ticket outline with half-circle notches on both sides. */
export function ticketPath(w: number, h: number, r = 11): string {
  return `M0 0 H${w} V${h / 2 - r} A${r} ${r} 0 0 0 ${w} ${h / 2 + r} V${h} H0 V${h / 2 + r} A${r} ${r} 0 0 0 0 ${h / 2 - r} Z`;
}
