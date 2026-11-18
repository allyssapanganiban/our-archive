"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useScrapbook } from "@/lib/use-scrapbook";

/** "memories" in the nav: open the first memory folder on the desk. */
export default function FoldersIndex() {
  const router = useRouter();
  const { folders, ready } = useScrapbook();
  useEffect(() => {
    if (!ready) return;
    const first = folders.find((f) => f.kind === "memories");
    router.replace(first ? `/folders/${first.slug}` : "/folders/new");
  }, [ready, folders, router]);
  return <main className="page tx-kraft" aria-busy="true" />;
}
