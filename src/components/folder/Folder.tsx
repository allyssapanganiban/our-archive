import type { ReactNode } from "react";
import { accents } from "@/design/tokens";
import type { Folder as FolderT } from "@/lib/types";
import { FitBox } from "./FitBox";
import { FolderOpenLink } from "./FolderOpenLink";
import s from "./folder.module.css";

type Props = {
  folder: FolderT;
  count: number;
  /** Leave out for a non-interactive preview. */
  href?: string;
  /** Stickers, stamps etc. on the front cover — a preview of what's inside. */
  cover?: ReactNode;
  /** Things peeking out of the top (e.g. trading cards). */
  peek?: ReactNode;
  size?: "md" | "sm";
  /** Things that pour out when the folder opens (polaroids, cards…). Up to 6 are used. */
  pour?: ReactNode[];
};

/** The whole folder (tab, sheets, cover) is laid out at this size — a desk folder on a laptop — and scaled to fit, so its cover never crowds on a phone. */
const DESIGN = { w: 392, h: 299 };

/** A manila file folder with a handwritten tab. On hover the tab lifts and the sheets slide up; clicking it opens with `FolderOpenLink`. */
export function Folder({ folder, count, href, cover, peek, size = "md", pour = [] }: Props) {
  const a = accents[folder.accent];
  const sm = size === "sm";
  const unit = count === 1 ? folder.unit.replace(/IES$/, "Y").replace(/S$/, "") : folder.unit;
  const shared = {
    className: `${s.folder} ${sm ? s.sm : ""} lift`,
    style: { ["--r" as string]: `${sm ? folder.rot * 0.6 : folder.rot}deg` } as React.CSSProperties,
  };
  const inner = (
    <>
      <div className={s.body} data-part="body">
       <FitBox width={DESIGN.w} height={DESIGN.h}>
        <div className={`${s.back} tx-manila-deep`} />
        <div data-part="tab" className={`${s.tab} tx-manila-deep`} style={folder.tab === "right" ? { right: sm ? 12 : 22 } : { left: sm ? 12 : 22 }}>
          <span aria-hidden="true" className={s.dot} style={{ background: a.soft }} />
          <span className={s.tabLabel} style={{ fontSize: sm ? 17 : 24 }}>{folder.title}</span>
        </div>
        <div aria-hidden="true" data-part="sheet1" className={s.sheet1} />
        <div aria-hidden="true" data-part="sheet2" className={s.sheet2} />
        {peek && <div aria-hidden="true" className={s.peek}>{peek}</div>}
        <div aria-hidden="true" data-part="front" className={`${s.front} tx-manila`}>{cover}</div>
       </FitBox>
      </div>
      <div className={s.caption}>
        <span className={`${s.title} ${sm ? s.titleSm : ""}`}>{folder.title}</span>
        <span className={s.count} style={{ fontSize: sm ? 10 : 12, color: a.deep }}>
          {count} {unit}
        </span>
      </div>
    </>
  );
  return href ? (
    <FolderOpenLink href={href} aria-label={`Open ${folder.title}, ${count} ${unit.toLowerCase()}`} {...shared} pour={pour}>
      {inner}
    </FolderOpenLink>
  ) : (
    <div {...shared}>{inner}</div>
  );
}
