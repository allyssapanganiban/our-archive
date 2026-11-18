"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Lays its contents out at a fixed design size and scales them to the space
 * available, so a folder cover keeps the same arrangement (and nothing collides)
 * on a phone as on a laptop.
 */
export function FitBox({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / width || 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "relative", width, height, transform: `scale(${k})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}
