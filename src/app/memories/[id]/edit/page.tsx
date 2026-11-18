import { TopBar } from "@/components/nav";
import { EditMemory } from "./EditMemory";

export default async function EditMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="page tx-cream">
      <div className="wrap">
        <TopBar />
        <EditMemory id={id} />
      </div>
    </main>
  );
}
