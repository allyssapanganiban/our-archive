import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page tx-cream" style={{ display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <p className="label">PAGE MISSING</p>
        <h1 className="display" style={{ fontSize: 72, margin: "10px 0" }}>this page fell out of the book</h1>
        <Link href="/" className="hand" style={{ fontSize: 28 }}>← back to the desk</Link>
      </div>
    </main>
  );
}
