"use client";

import { useState } from "react";
import s from "./manage.module.css";

type Props = {
  /** What gets deleted, e.g. "this card". */
  what: string;
  /** Extra line in the confirm slip, e.g. "its 3 pages go too." */
  detail?: string;
  onConfirm: () => void | Promise<void>;
  label?: string;
};

/** A delete pill that asks first, inline (no browser dialogs). */
export function ConfirmDelete({ what, detail, onConfirm, label = "delete" }: Props) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!asking)
    return (
      <button type="button" className={s.pill} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  return (
    <div role="alertdialog" aria-label={`Delete ${what}?`} className={s.confirm}>
      <p className={s.confirmText}>
        {failed ? "that didn’t go through. check your connection and try again?" : <>delete {what}? {detail} this can&rsquo;t be undone.</>}
      </p>
      <button
        type="button"
        className={`${s.pill} ${s.danger}`}
        disabled={busy}
        autoFocus
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          try {
            await onConfirm();
            setAsking(false);
          } catch {
            setFailed(true);
          }
          setBusy(false);
        }}
      >
        yes, delete
      </button>
      <button type="button" className={s.pill} onClick={() => setAsking(false)}>
        keep it
      </button>
    </div>
  );
}
