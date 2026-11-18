"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { accents, type AccentName } from "@/design/tokens";
import { Folder } from "@/components/folder";
import { Sticker } from "@/components/ephemera";
import { SAVE_FAILED, saveFolder } from "@/lib/store";
import { useScrapbook } from "@/lib/use-scrapbook";
import type { Folder as FolderT } from "@/lib/types";

const slugify = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Name it, pick an accent and a tab side; the folder preview updates live.
 * Pass `existing` to edit a folder (its address stays the same when renamed).
 */
export function NewFolderForm({ existing }: { existing?: FolderT }) {
  const router = useRouter();
  const { folders, memories } = useScrapbook();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [tagline, setTagline] = useState(existing?.tagline ?? "");
  const [accent, setAccent] = useState<AccentName>(existing?.accent ?? "sage");
  const [tab, setTab] = useState<"left" | "right">(existing?.tab ?? "left");
  const [error, setError] = useState("");
  const uniqueSlug = (base: string) => {
    const taken = new Set(folders.map((f) => f.slug));
    let slug = base || "new-folder";
    for (let n = 2; taken.has(slug); n++) slug = `${base || "new-folder"}-${n}`;
    return slug;
  };
  const folder: FolderT = existing
    ? { ...existing, title: title || existing.title, tagline, accent, tab }
    : { slug: slugify(title) || "new-folder", title: title || "new folder", kind: "memories", accent, tagline, builtIn: false, unit: "MEMORIES", tab, rot: -1.2 };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 56, marginTop: 40, alignItems: "flex-start" }}>
      <form
        style={{ flex: "1 1 320px", maxWidth: 440, display: "flex", flexDirection: "column", gap: 18 }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          try {
            if (existing) {
              await saveFolder(folder);
              router.push(`/folders/${folder.slug}`);
            } else {
              await saveFolder({ ...folder, slug: uniqueSlug(folder.slug) });
              router.push("/");
            }
          } catch {
            setError(SAVE_FAILED);
          }
        }}
      >
        <label className="mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, letterSpacing: ".2em", fontWeight: 700 }}>
          NAME
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Concerts"
            style={{ minHeight: 52, border: "none", borderBottom: "1.25px solid var(--ink)", background: "transparent", fontFamily: "var(--font-serif)", fontSize: 36, color: "var(--ink)" }} />
        </label>
        <label className="mono" style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, letterSpacing: ".2em", fontWeight: 700 }}>
          A LITTLE LINE ABOUT IT
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="every show we went to"
            style={{ minHeight: 44, border: "1.25px solid var(--ink)", borderRadius: 999, background: "transparent", padding: "4px 14px", fontFamily: "var(--font-mono)", fontSize: 15 }} />
        </label>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend className="mono" style={{ fontSize: 12, letterSpacing: ".2em", fontWeight: 700, marginBottom: 12 }}>ACCENT</legend>
          <div style={{ display: "flex", gap: 18 }}>
            {(Object.keys(accents) as AccentName[]).map((a) => (
              <Sticker key={a} background={accents[a].soft} size={64} rot={accent === a ? 0 : -6} onClick={() => setAccent(a)} pressed={accent === a} label={a}
                style={{ boxShadow: accent === a ? "0 0 0 3px #FDFBF6, 0 0 0 6px var(--ink)" : undefined, fontSize: 18 }}>
                {a}
              </Sticker>
            ))}
          </div>
        </fieldset>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend className="mono" style={{ fontSize: 12, letterSpacing: ".2em", fontWeight: 700, marginBottom: 12 }}>TAB SIDE</legend>
          {(["left", "right"] as const).map((t) => (
            <label key={t} className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, marginRight: 22, fontSize: 14 }}>
              <input type="radio" name="tab" checked={tab === t} onChange={() => setTab(t)} style={{ width: 18, height: 18, accentColor: "var(--kraft)" }} /> {t}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="lift mono"
          style={{ alignSelf: "flex-start", minHeight: 52, padding: "6px 26px", border: "3px double var(--pink-deep)", borderRadius: 6, background: "var(--white)", color: "var(--pink-deep)", fontWeight: 700, letterSpacing: ".18em", cursor: "pointer", boxShadow: "var(--shadow-rest)" }}>
          {existing ? "SAVE CHANGES" : "ADD TO THE DESK"}
        </button>
        {error && <p role="alert" className="hand" style={{ margin: 0, fontSize: 22, color: "var(--pink-deep)" }}>{error}</p>}
        {existing && (
          <button type="button" onClick={() => router.back()} className="mono"
            style={{ alignSelf: "flex-start", background: "none", border: "none", padding: 0, minHeight: 44, fontSize: 14, color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}>
            cancel
          </button>
        )}
      </form>
      <div style={{ flex: "0 1 340px", width: 340 }} aria-hidden="true">
        <Folder folder={folder} count={memories.filter((m) => m.folder === folder.slug).length} />
      </div>
    </div>
  );
}
