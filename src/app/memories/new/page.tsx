import { MemoryEditor } from "@/components/editor/MemoryEditor";
import { TopBar } from "@/components/nav";
import { nextMonthversary, ordinal, toISODay } from "@/lib/dates";
import type { Memory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewMemoryPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const { folder } = await searchParams;
  // Default draft: the next monthversary page, unless we came from a specific folder.
  const next = nextMonthversary();
  const draft: Partial<Memory> =
    !folder || folder === "anniversaries"
      ? { title: `${ordinal(next.n)} monthversary`.replace(/^\w/, (c) => c.toUpperCase()), date: toISODay(next.date), folder: "anniversaries", pageType: "monthversary", number: next.n }
      : { folder, pageType: folder === "trips" ? "trip" : folder === "firsts" ? "first" : folder === "little-things" ? "little-thing" : "date" };
  return (
    <main className="page tx-cream">
      <div className="wrap">
        <TopBar />
        <MemoryEditor draft={draft} />
      </div>
    </main>
  );
}
