import { TopBar } from "@/components/nav";
import { NewFolderForm } from "./NewFolderForm";

export default function NewFolderPage() {
  return (
    <main className="page tx-cream">
      <div className="wrap">
        <TopBar />
        <h1 className="display" style={{ fontSize: "clamp(52px, 6vw, 84px)", lineHeight: 1, margin: "48px 0 8px" }}>A new folder</h1>
        <p className="hand" style={{ fontSize: 28, margin: 0 }}>for whatever deserves its own spot</p>
        <NewFolderForm />
      </div>
    </main>
  );
}
