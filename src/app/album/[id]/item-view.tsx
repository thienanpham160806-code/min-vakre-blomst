"use client";

import { useState } from "react";
import { StickerView } from "@/components/stickers";
import type { AlbumItem } from "@/lib/types";
import { normalizeDriveUrl } from "@/lib/drive";

export const FONT_CLASS = {
  hand: "font-hand",
  script: "font-script",
  round: "font-round",
  sans: "font-sans",
} as const;

/** Vẽ nội dung một món trên trang (không lo kéo thả). Kích thước theo đơn vị khung 1000px, nhân `scale`. */
export function ItemView({ item, url, scale, editing }: { item: AlbumItem; url?: string; scale: number; editing: boolean }) {
  const w = item.width * scale;

  if (item.kind === "drive") {
    let href: string | null = null;
    try { href = normalizeDriveUrl(item.drive_url ?? ""); } catch { /* Dữ liệu cũ không hợp lệ: không tạo link. */ }
    return <div className="paper-card bg-white p-4 text-center" style={{ width: w, fontSize: 36 * scale }}>
      <span aria-hidden="true">📁</span>
      <p className="break-words font-semibold">{item.drive_name || "File Google Drive"}</p>
      {!editing && href && <a className="mt-2 block underline" href={href} target="_blank" rel="noopener noreferrer">Mở trong Google Drive</a>}
    </div>;
  }

  if (item.kind === "text") {
    const size = (item.style.size ?? 56) * scale;
    return (
      <p
        className={`${FONT_CLASS[item.style.font ?? "hand"]} whitespace-pre-wrap text-center leading-tight`}
        style={{ width: w, fontSize: size, color: item.style.color ?? "#3d2b2b" }}
      >
        {item.content}
      </p>
    );
  }

  if (item.kind === "sticker") {
    if (item.storage_path) {
      // eslint-disable-next-line @next/next/no-img-element
      return url ? <img src={url} alt="" draggable={false} className="pointer-events-none block select-none" style={{ width: w }} /> : <Placeholder w={w} aspect={1} />;
    }
    return (
      <div className="pointer-events-none drop-shadow-sm" style={{ width: w, fontSize: w * 0.85 }}>
        <StickerView content={item.content ?? "builtin:heart"} />
      </div>
    );
  }

  // photo / video trong khung
  const aspect = item.style.aspect ?? 1;
  const frame = item.style.frame ?? (item.kind === "photo" ? "polaroid" : "plain");
  const media = url ? (
    item.kind === "photo" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={item.style.caption ?? ""} draggable={false} className="pointer-events-none block h-full w-full select-none object-cover" />
    ) : (
      <VideoBox url={url} editing={editing} />
    )
  ) : (
    <div className="h-full w-full animate-pulse bg-ink/10" />
  );

  if (frame === "round") {
    return (
      <div className="overflow-hidden rounded-full border-white shadow-lg" style={{ width: w, height: w, borderWidth: 8 * scale }}>
        {media}
      </div>
    );
  }

  const pad = frame === "plain" ? 0 : w * 0.05;
  return (
    <div
      className={`relative ${frame === "plain" ? "overflow-hidden rounded-[6px]" : "bg-white"} shadow-[0_6px_18px_-6px_rgba(0,0,0,0.35)]`}
      style={{ width: w, padding: pad, paddingBottom: frame === "polaroid" ? w * 0.17 : pad }}
    >
      {frame === "tape" && <span className="washi" />}
      <div className="overflow-hidden" style={{ height: (w - pad * 2) * aspect }}>{media}</div>
      {frame === "polaroid" && item.style.caption && (
        <p className="absolute inset-x-0 bottom-0 truncate px-2 text-center font-hand" style={{ fontSize: w * 0.075, lineHeight: `${w * 0.17}px` }}>
          {item.style.caption}
        </p>
      )}
      {item.kind === "video" && <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 text-xs text-white">▶︎</span>}
    </div>
  );
}

function VideoBox({ url, editing }: { url: string; editing: boolean }) {
  const [muted, setMuted] = useState(true);
  return (
    <video
      src={url}
      autoPlay
      loop
      muted={muted}
      playsInline
      preload="metadata"
      className={`h-full w-full object-cover ${editing ? "pointer-events-none" : ""}`}
      onClick={() => setMuted((m) => !m)}
    />
  );
}

function Placeholder({ w, aspect }: { w: number; aspect: number }) {
  return <div className="animate-pulse rounded bg-ink/10" style={{ width: w, height: w * aspect }} />;
}
