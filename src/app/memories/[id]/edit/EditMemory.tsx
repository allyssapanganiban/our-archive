"use client";

import Link from "next/link";
import { MemoryEditor } from "@/components/editor/MemoryEditor";
import { useScrapbook } from "@/lib/use-scrapbook";

/** Opens a saved page in the same visual editor used to make one. */
export function EditMemory({ id }: { id: string }) {
  const { memories, ready } = useScrapbook();
  const memory = memories.find((m) => m.id === id);
  if (!ready) return <p className="hand" style={{ fontSize: 28, marginTop: 40 }}>opening the page…</p>;
  if (!memory)
    return (
      <p className="hand" style={{ fontSize: 28, marginTop: 40 }}>
        this page isn&rsquo;t in the scrapbook anymore. <Link href="/">back to the desk</Link>
      </p>
    );
  return <MemoryEditor key={memory.id} existing={memory} />;
}
