# Our Scrapbook

A private digital scrapbook for Allyssa & Justin. Next.js (App Router) + TypeScript, no UI library. Every piece of paper, tape and stamp is a component.

```bash
npm install
npm run dev      # http://localhost:3000
npm run typecheck
npm run db:seed  # Supabase: add users to members, load starting content into an empty database
```

### Supabase setup (once)

1. Create a project; put `NEXT_PUBLIC_SUPABASE_URL` (base URL only, e.g. `https://<id>.supabase.co`), `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` in `.env.local`.
2. Run `supabase/migrations/0001_scrapbook.sql` in the SQL Editor.
3. Authentication: turn off new sign-ups; add both users (auto-confirm).
4. `npm run db:seed`, then sign in at `/login`.

Without `.env.local` the app still runs, saving to the browser only.

## Screens

| Route | What it is |
| --- | --- |
| `/` | **The desk.** Hero line, torn calendar page with the next dates and a countdown, the six folders, recent polaroids. |
| `/cards` | **Our Cards.** Binder page of sleeved cards, frame and year filters, click a card to open it large with tilt and holo shine. `?card=<id>` opens a specific card. |
| `/folders/[slug]` | **A memory folder.** File tabs to switch folders, memories shown as small journal spreads. |
| `/folders` | Opens the first memory folder (the "memories" pill). |
| `/folders/new` | Make a custom folder (name, accent, tab side) with a live preview. |
| `/folders/[slug]/edit` | Rename a folder, change its line, accent or tab side. Delete is on the folder page. |
| `/memories/[id]/edit` | Edit everything on a spread: title, dates, folder, diary, photos, tickets, checklist, playlist, tucked-in card. Delete is on the spread. |
| `/memories/[id]` | **Journal spread.** Two pages on desktop, one on phones. Diary in each person's ink, polaroids, ticket, cassette, checklist, the card tucked into a corner pocket. |
| `/memories/new` | **Add a memory.** Pick a template, then drag, rotate and resize anything. Drop photos onto the page. Defaults to the next monthversary. |
| `/studio` | **Card studio.** Occasion note, live card preview, options as stickers. Defaults to the next thing on the calendar. |
| `/design-system` | Living reference of tokens and components. |

## Design system in code

- `src/design/tokens.ts` holds the colours, accents, inks, type scale, spacing, shadows and motion. `src/app/globals.css` has the same values as CSS variables, plus paper textures (`.tx-cream`, `.tx-kraft`, `.tx-manila`, `.tx-grid`, `.tx-lined`, `.tx-mat`) and motion utilities (`.lift`, `.drop-in`, `.slide-out`, `.page-turn`). All motion turns off with `prefers-reduced-motion`.
- **Ephemera** (`src/components/ephemera`): `Polaroid`, `Tape`, `Stamp`, `Postmark`, `Sticker`, `Ticket`, `Cassette`, `TornEdge`, `PaperClip`, `LabelTag`, `HeartIcon`. They all take `rot` (degrees) plus `style`/`className` for placement. Anything with `.lift` eases its rotation to 0 and lifts on hover.
- **Navigation** (`src/components/nav`): `PillNav` (outlined pills, underlined text, the current page gets a tint), `TopBar` (brand, pills, "writing as" switch), `MobileTabBar`.
- **Folder** (`src/components/folder`): `Folder` (manila folder with a handwritten tab; the tab lifts on hover; clicking runs `FolderOpenLink`, which lifts the folder to the centre, swings the cover open, pours out the `pour` items (photos and tucked-in cards, or the newest cards for Our Cards), fills the screen with kraft from the folder's mouth and then navigates. Timings are in `FOLDER_OPEN_TIMING`; Cmd/Ctrl-click and reduced motion navigate normally), `FolderCover` (cover stickers built from what's inside), `CardsPeek`, `CardsCover`.
- **Cards** (`src/components/cards`): `TradingCard` draws a card from `CardData` JSON (standard, prism and star frames). Also `TradingCardSleeve`, `HoloTilt` (3D tilt and sheen that follow the cursor; off on touch and with reduced motion), `Avatar` (pixel-perfect scaling), `EnergyIcon`, `CardPocket`, `CardBinder`.
- **Journal** (`src/components/journal`): `JournalSpread`, `PageTurn`, `FolderTabs`, `MiniSpread`, `EmptyEntry`.
- **Desk**: `Desk`, `CalendarPage`, `CalendarStrip`. **Studio**: `CardStudio`. **Editor**: `MemoryEditor`, plus `templates.ts` (three layouts to start from).

## Data

- `src/lib/dates.ts` sets the start date (**June 11, 2026**) and both birthdays (**Allyssa Dec 9, 2003**, **Justin Jan 8, 2004**). Monthversary numbers, countdowns and the calendar page are all calculated from these.
- `src/lib/card-schema.ts` defines the card JSON shared with the card pipeline, along with text limits (`textProblems()` reports anything that won't fit) and print specs for later.
- `src/lib/types.ts` defines folders, memories and placed items. `src/lib/sample-data.ts` holds sample content. The dates are real; the diary text, trips and card wording are stand-ins to replace.
- `src/lib/store.ts` saves to the browser for now (edits override sample items by id; deletes are remembered as deleted ids). `src/lib/use-scrapbook.ts` merges sample data with saves and deletions; every page reads through it. Swap the store's functions for Supabase (Postgres rows plus storage uploads) and nothing else has to change. Photos you upload are kept as temporary in-browser URLs until then.
- `src/components/studio/actions.ts` (`StudioActions`) is where the card pipeline plugs in: Claude for the copy, the OpenAI image step for backgrounds and photo restyles, and the compositor for PNG export. `offlineActions` fills in simple text so the studio works before that's connected. Background generation and PNG export buttons only appear once those actions exist.

## Assets

- `public/avatars/` has the seven pixel avatars as transparent PNGs at their original pixel size. Always scale them by whole numbers with `image-rendering: pixelated`; `<Avatar>` does this for you.
- `public/scenes/*.svg` are placeholder drawings that stand in for real photos. `public/backgrounds/pixel-*.svg` are placeholder pixel backgrounds.
- `public/textures/` has the paper grain and kraft fibre tiles.

## Accessibility notes

Real `<button>`, `<a>` and `<input>` elements sit under every sticker-styled control. Photos need alt text: the editor asks for it, and `Polaroid` requires it. Handwriting is only used for short text. Accent colours are never used for body text; their `deep` shades are (all at least 4.5:1 on cream). In the editor, Tab moves between items, arrow keys move the selected item (Shift for bigger steps), `[` and `]` rotate it, and Delete removes it.
