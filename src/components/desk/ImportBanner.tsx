"use client";

import { useEffect, useState } from "react";
import { manageStyles as m } from "@/components/manage";
import { importLocalEdits, localEditCount, saveFailedMessage } from "@/lib/store";

/** One-time offer to bring edits saved in this browser (before Supabase) into the shared scrapbook. */
export function ImportBanner() {
  const [count, setCount] = useState(0);
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");
  const [why, setWhy] = useState("");
  useEffect(() => setCount(localEditCount()), []);
  if (!count || state === "done") return null;
  return (
    <div role="status" className={m.confirm} style={{ margin: "28px 0 0", transform: "rotate(-.4deg)" }}>
      <p className={m.confirmText} style={{ maxWidth: "52ch" }}>
        {state === "failed" ? why : `this browser still has ${count} change${count === 1 ? "" : "s"} from before we moved to the shared scrapbook. bring ${count === 1 ? "it" : "them"} over?`}
      </p>
      <button type="button" className={`${m.pill} ${m.solid}`} disabled={state === "busy"}
        onClick={async () => {
          setState("busy");
          try {
            await importLocalEdits();
            setState("done");
          } catch (e) {
            console.error(e);
            setWhy(saveFailedMessage(e));
            setState("failed");
          }
        }}>
        {state === "busy" ? "bringing them over…" : state === "failed" ? "try again" : "bring them over"}
      </button>
    </div>
  );
}
