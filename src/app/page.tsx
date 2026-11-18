import { DeskLive } from "@/components/desk";
import { TopBar } from "@/components/nav";

// Countdown and calendar depend on today's date.
export const dynamic = "force-dynamic";

export default function DeskPage() {
  return (
    <main className="page tx-cream">
      <div className="wrap">
        <TopBar />
        <DeskLive />
      </div>
    </main>
  );
}
