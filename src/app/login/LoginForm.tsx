"use client";

import { useState } from "react";
import { PaperClip, Postmark, Tape } from "@/components/ephemera";
import { manageStyles as m } from "@/components/manage";
import { supabase } from "@/lib/supabase/client";

/** Email + password sign-in on a little index card. */
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div style={{ position: "relative", width: "min(440px, 100%)", marginTop: "8vh" }}>
      <Postmark text="OUR SCRAPBOOK" date="PRIVATE" size={110} rot={-14} style={{ right: -36, top: -54 }} />
      <Tape kind="pink" width={110} height={26} rot={-6} style={{ left: 30, top: -12, zIndex: 2 }} />
      <form
        className={`tx-lined ${m.form}`}
        style={{ position: "relative", padding: "40px 34px 34px", background: "#fdfbf6", boxShadow: "var(--shadow-rest)", transform: "rotate(-.8deg)", borderRadius: 3 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
          if (error) {
            setBusy(false);
            setError(error.message.toLowerCase().includes("invalid") ? "that email and password don’t match. try again?" : "couldn’t sign in right now. check your connection and try again.");
            return;
          }
          // Full navigation so the server sees the new session cookie.
          window.location.assign(next);
        }}
      >
        <PaperClip rot={-8} style={{ right: 40, top: -26 }} />
        <h1 className="display" style={{ fontSize: 54, lineHeight: 1, margin: 0 }}>our scrapbook</h1>
        <p className="hand" style={{ fontSize: 24, margin: "-6px 0 6px" }}>just for the two of us</p>
        <label className={m.field}>
          EMAIL
          <input className={m.input} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={m.field}>
          PASSWORD
          <input className={m.input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className={m.message} style={{ color: "var(--pink-deep)" }}>{error}</p>}
        <button type="submit" className={`${m.pill} ${m.solid}`} style={{ alignSelf: "flex-start", minHeight: 48, padding: "6px 24px" }} disabled={busy}>
          {busy ? "opening…" : "open the scrapbook"}
        </button>
      </form>
    </div>
  );
}
