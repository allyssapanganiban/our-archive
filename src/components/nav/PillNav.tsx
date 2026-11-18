"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./nav.module.css";

export const SECTIONS = [
  { label: "desk", href: "/", match: (p: string) => p === "/" },
  { label: "our cards", href: "/cards", match: (p: string) => p.startsWith("/cards") },
  { label: "memories", href: "/folders", match: (p: string) => p.startsWith("/folders") || (p.startsWith("/memories") && p !== "/memories/new") },
  { label: "make a card", href: "/studio", match: (p: string) => p.startsWith("/studio") },
  { label: "add a memory", href: "/memories/new", match: (p: string) => p === "/memories/new" },
];

/** Outlined pills with underlined text; the current one gets a soft tint. */
export function PillNav({ onDark = false, tint }: { onDark?: boolean; tint?: string }) {
  const path = usePathname() ?? "/";
  return (
    <nav aria-label="Scrapbook sections" className={onDark ? s.onDark : undefined} style={tint ? ({ ["--pill-tint" as string]: tint } as React.CSSProperties) : undefined}>
      <ul className={s.list}>
        {SECTIONS.map((sec) => (
          <li key={sec.href}>
            <Link href={sec.href} className={s.pill} aria-current={sec.match(path) ? "page" : undefined}>
              {sec.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Phone navigation: four tabs and a big "+" sticker to add a memory. */
export function MobileTabBar() {
  const path = usePathname() ?? "/";
  const tabs = [SECTIONS[0], SECTIONS[1], null, SECTIONS[2], { label: "make", href: "/studio", match: (p: string) => p.startsWith("/studio") }];
  return (
    <nav aria-label="Sections" className={`${s.tabbar} ${s.mobileOnly} tx-paper`}>
      <ul>
        {tabs.map((t, i) =>
          t ? (
            <li key={t.href + i}>
              <Link href={t.href} className={s.tab} aria-current={t.match(path) ? "page" : undefined}>
                {t.label.replace("our ", "")}
              </Link>
            </li>
          ) : (
            <li key="fab">
              <Link href="/memories/new" aria-label="Add a memory" className={s.fab}>+</Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
