"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import s from "./cards.module.css";

/**
 * 3D tilt + holo sheen that follows the cursor. Writes CSS variables directly
 * (no re-render per mouse move). Turns itself off on touch screens and when
 * the person prefers reduced motion.
 */
export function HoloTilt({ children, maxX = 8, maxY = 10, className }: { children: ReactNode; maxX?: number; maxY?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => setEnabled(!reduce.matches && !coarse.matches);
    update();
    reduce.addEventListener("change", update);
    coarse.addEventListener("change", update);
    return () => {
      reduce.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
    };
  }, []);

  const set = (vars: Record<string, string>) => {
    const el = ref.current;
    if (!el) return;
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
  };

  return (
    <div
      ref={ref}
      className={`${enabled ? s.tilt : ""} ${className ?? ""}`}
      onPointerMove={(e) => {
        if (!enabled) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        set({
          "--rx": `${((0.5 - y) * 2 * maxX).toFixed(2)}deg`,
          "--ry": `${((x - 0.5) * 2 * maxY).toFixed(2)}deg`,
          "--hx": `${(x * 100).toFixed(1)}%`,
          "--hy": `${(y * 100).toFixed(1)}%`,
          "--ho": "0.85",
        });
      }}
      onPointerLeave={() => set({ "--rx": "0deg", "--ry": "0deg", "--hx": "30%", "--hy": "30%", "--ho": "0.35" })}
    >
      {children}
    </div>
  );
}
