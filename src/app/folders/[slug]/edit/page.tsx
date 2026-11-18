import { redirect } from "next/navigation";
import { TopBar } from "@/components/nav";
import { EditFolder } from "./EditFolder";

export default async function EditFolderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "cards") redirect("/cards");
  return (
    <main className="page tx-cream">
      <div className="wrap">
        <TopBar />
        <h1 className="display" style={{ fontSize: "clamp(52px, 6vw, 84px)", lineHeight: 1, margin: "48px 0 8px" }}>Edit folder</h1>
        <p className="hand" style={{ fontSize: 28, margin: 0 }}>rename it, give it a new line or a new color</p>
        <EditFolder slug={slug} />
      </div>
    </main>
  );
}
