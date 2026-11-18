# Our Scrapbook: context for Claude

Private web app for Allyssa and Justin: a digital scrapbook of their relationship. One folder holds custom trading cards (a "Card Studio" that generates Pokémon-inspired cards), and the other folders hold memories shown as journal spreads. It should feel like opening a keepsake box, not using software.

## Locked decisions
- Stack: Next.js 16 (App Router) + TypeScript, CSS Modules + CSS variables, no UI library. Supabase for login (email + password, sign-ups off), Postgres and private image storage. Next 16 calls middleware `proxy` (src/proxy.ts).
- Visual language: cream paper, kraft, manila folders, polaroids, washi tape, scalloped stamps, postmarks, tickets, cassettes, torn edges. Items rotated ±2–6° with soft shadows. Lots of breathing room.
- Palette: cream #F3EEE4, kraft #7A3E2E, manila #E8CF9E, ink #1F1B18. One accent per folder: pink, sage, sky, marigold. Text in an accent uses its deep shade only. Only trading cards are bright/holo.
- Type: Instrument Serif for display, Caveat for short handwritten text, Courier Prime for labels and UI, Archivo on card faces only.
- Allyssa writes in pink ink (#94474F), Justin in sky ink (#3B6079). Both of you edit.
- Memory pages start from templates, then free drag/rotate/resize. Folders: built-in plus custom.
- Motion 150–400 ms; tilt and holo off on touch screens and with prefers-reduced-motion. Real buttons/inputs under sticker styling, alt text on photos, WCAG AA text.

## Dates (all UI dates are calculated from these, in src/lib/dates.ts)
- Start date: June 11, 2026, so monthversaries fall on the 11th.
- Allyssa's birthday: December 9, 2003. Justin's birthday: January 8, 2004.
- The 6th-monthversary card (12/11/2026) was made early.

## Trading card rules (from the Card Studio brief)
- Never say "Pokémon" or name characters in any image-model prompt; describe the look instead.
- The image model makes only the art (pixel background or full-art illustration). Frames, text and icons are drawn in code from `CardData` (src/lib/card-schema.ts).
- Frames: standard (colored by type), prism (rainbow "Tera-style" border), star (gold + rainbow full-art with a subtitle line).
- Pipeline plugs in through `StudioActions` (src/components/studio/actions.ts). It runs Claude for the copywriting and art direction, OpenAI's current GPT Image model for backgrounds and photo restyles (keep the image provider swappable), and code to composite the card and check it (QA). PNG export first; print layout later (63×88 mm, 300 DPI, bleed).
- API keys stay server-side only. Log the cost of each card.
- Ask before making decisions the briefs don't cover.

## Where things are
- Tokens: src/design/tokens.ts and src/app/globals.css
- Components: src/components/{ephemera,nav,folder,cards,journal,desk,studio,editor}
- Sample content: src/lib/sample-data.ts (dates are real; the diary text, trips and card wording are stand-ins)
- Saving: src/lib/store.ts. With .env.local set it uses Supabase: tables folders/memories/cards each hold `{ id, data jsonb }` in the exact app shapes; only users in `members` can read/write (RLS, supabase/migrations/0001_scrapbook.sql). Images in data are `sb://<path>` refs in the private `scrapbook` bucket, swapped for signed links on load; data: URLs from the editors are uploaded on save. Without .env.local it falls back to localStorage over the sample data. Pages read through `useScrapbook()` (one shared copy, refreshes on change and on tab focus). `npm run db:seed` adds users to members and loads the starting content into an empty database.
- Edit/delete: folders (`/folders/[slug]/edit`, delete on the folder page; deleting removes its pages, cards stay; Our Cards can't be edited or deleted), memories (`/memories/[id]/edit`, delete on the spread), cards (edit details + delete on the binder index card; drawn cards also open in the studio). Deletes confirm inline with `ConfirmDelete` (src/components/manage). Folders have a "rearrange" mode: drag pages (pointer events, so touch works) or use ← → buttons; the order saves to `Folder.order` on every move, and dropping a page on another folder's tab moves it there. `folderMemories()` gives the display order: by date, earliest first; a hand-arranged order (from rearrange) is kept and new pages slot in by date. Page turning follows the same order. Memory pages are a two-page journal spread, and the editor IS that spread (what you arrange is what the page shows). Both use `SpreadFrame`/`ItemView` in src/components/journal/Spread.tsx: pages are 640 px wide, grow to fit, scale to the screen and stack on phones. `Memory.stickers` holds the arranged items (`page`, top-left `x`/`y` in page px). Pages never arranged are laid out like the classic spread by `layoutFromMemory()` (src/components/journal/spread-layout.ts), which also holds the new-page templates. Details not drawn on the page (until-date, summary, songs, checklist contents, which card) are fields under the editor; the checklist, cassette songs and card pocket show on the page.
- Pixel avatars: public/avatars (transparent, 1 pixel = 1 art pixel; always scale by whole numbers with image-rendering: pixelated)

## Motion
- Desk folders open with `FolderOpenLink` (src/components/folder): lift → cover swings open → contents pour out → kraft fills the screen → navigate. Built from Claude Design's folder-open draft; the front cover sits inside `FitBox`, so its 3D swing uses `perspective()` in the transform. Binder pockets and folder-page entries drop in with a stagger. All of it is skipped with prefers-reduced-motion and on Cmd/Ctrl-click.

## Not done yet
1. (Done 2026-11-12) Supabase: login, tables, private photo storage, one-time import of browser edits.
2. Card pipeline API routes (copywriter, art director, image step, compositor, QA, PNG export).
3. Timeline/calendar view (monthly pages with tiny photo stickers on dates).
4. (Done 2026-11-12: `npm run build` and `npm run typecheck` pass on Next 16.4.6; every route renders with no console errors.)
