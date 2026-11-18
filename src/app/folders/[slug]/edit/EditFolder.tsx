"use client";

import Link from "next/link";
import { useScrapbook } from "@/lib/use-scrapbook";
import { NewFolderForm } from "../../new/NewFolderForm";

export function EditFolder({ slug }: { slug: string }) {
  const { folders, ready } = useScrapbook();
  const folder = folders.find((f) => f.slug === slug && f.kind === "memories");
  if (!ready) return null;
  if (!folder)
    return (
      <p className="hand" style={{ fontSize: 28, marginTop: 40 }}>
        that folder isn&rsquo;t on the desk anymore. <Link href="/">back to the desk</Link>
      </p>
    );
  return <NewFolderForm key={folder.slug} existing={folder} />;
}
