/**
 * How many lines a piece of text wraps to at a width, measured with the real
 * page fonts (falls back to an estimate before fonts/DOM are available).
 */
let ctx: CanvasRenderingContext2D | null = null;

function fontFamily(cssVar: string): string | null {
  if (typeof document === "undefined") return null;
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return v || null;
}

export function lineCount(text: string, opts: { fontVar: "--font-serif" | "--font-hand" | "--font-mono"; size: number; width: number; avgChar: number }): number {
  const family = fontFamily(opts.fontVar);
  if (family && typeof document !== "undefined") {
    ctx ??= document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.font = `${opts.size}px ${family}`;
      let lines = 0;
      for (const para of text.split("\n")) {
        let line = "";
        let n = 1;
        for (const word of para.split(/\s+/).filter(Boolean)) {
          const next = line ? `${line} ${word}` : word;
          if (line && ctx.measureText(next).width > opts.width) {
            n++;
            line = word;
          } else line = next;
        }
        lines += n;
      }
      return lines;
    }
  }
  const perLine = Math.max(8, Math.floor(opts.width / (opts.size * opts.avgChar)));
  return text.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
}
