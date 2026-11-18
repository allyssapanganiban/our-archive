import { TopBar } from "@/components/nav";
import { MemoryLive } from "./MemoryLive";

export default async function MemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="page tx-kraft">
      <div className="wrap">
        <TopBar onDark />
        <MemoryLive id={id} />
      </div>
    </main>
  );
}
