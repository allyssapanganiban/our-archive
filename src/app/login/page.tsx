import { LoginForm } from "./LoginForm";

export const metadata = { title: "our scrapbook · sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Only same-site paths, so the link can't bounce you somewhere else.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <main className="page tx-cream" style={{ display: "grid", placeItems: "center" }}>
      <LoginForm next={safeNext} />
    </main>
  );
}
