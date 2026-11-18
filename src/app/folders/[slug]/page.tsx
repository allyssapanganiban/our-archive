import { redirect } from "next/navigation";
import { TopBar } from "@/components/nav";
import { FolderLive } from "./FolderLive";

export default async function FolderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "cards") redirect("/cards");
  return (
    <main className="page tx-kraft">
      <div className="wrap">
        <TopBar onDark />
        <FolderLive slug={slug} />
      </div>
    </main>
  );
}
