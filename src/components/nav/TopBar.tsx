"use client";

import Link from "next/link";
import { useState } from "react";
import { PEOPLE, START_DATE, dotDate, type Person } from "@/lib/dates";
import { signOut, usingSupabase } from "@/lib/store";
import { useScrapbook } from "@/lib/use-scrapbook";
import { MobileTabBar, PillNav } from "./PillNav";
import s from "./nav.module.css";

/**
 * Brand, section pills and "writing as" switch. Whose ink new notes use
 * comes from `writer`; wire `onWriterChange` to the signed-in session.
 */
export function TopBar({ onDark = false, writer: initial = "allyssa", onWriterChange }: { onDark?: boolean; writer?: Person; onWriterChange?: (p: Person) => void }) {
  const [writer, setWriter] = useState<Person>(initial);
  const other: Person = writer === "allyssa" ? "justin" : "allyssa";
  const bg = (p: Person) => (p === "allyssa" ? "var(--pink)" : "var(--sky)");
  const { error } = useScrapbook();
  return (
    <>
      <header className={s.bar} style={{ color: onDark ? "var(--cream)" : "var(--ink)" }}>
        <Link href="/" className={s.brand}>
          <span className={s.brandName}>our scrapbook</span>
          <span className={s.brandSub}>A + J · SINCE {dotDate(START_DATE).replace(/·/g, ".")}</span>
        </Link>
        <div className={s.desktopOnly}>
          <PillNav onDark={onDark} />
        </div>
        <div className={s.writer}>
          <span className={s.writerLabel}>WRITING AS</span>
          <button
            type="button"
            className={s.me}
            style={{ background: bg(writer) }}
            aria-label={`Writing as ${PEOPLE[writer].name}. Switch to ${PEOPLE[other].name}`}
            onClick={() => {
              setWriter(other);
              onWriterChange?.(other);
            }}
          >
            {PEOPLE[writer].initial}
          </button>
          <span aria-hidden="true" className={s.other} style={{ background: bg(other) }}>
            {PEOPLE[other].initial}
          </span>
          {usingSupabase && (
            <button type="button" className={s.signOut} onClick={() => void signOut()}>
              sign out
            </button>
          )}
        </div>
      </header>
      {error && (
        <p role="status" className={s.syncNotice}>
          {error}
        </p>
      )}
      <MobileTabBar />
    </>
  );
}
