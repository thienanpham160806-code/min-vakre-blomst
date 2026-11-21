"use client";

import { useState } from "react";
import { IconDrive, IconExternal } from "@/components/icons";
import { StickerView } from "@/components/stickers";
import { normalizeDriveUrl } from "@/lib/drive";
import type { AlbumItem, FrameKind } from "@/lib/types";

export const FONT_CLASS = {
  hand: "font-hand",
  script: "font-script",
  round: "font-round",
  sans: "font-sans",
} as const;

/** Thumbnail minh họa trực quan 6 kiểu khung ảnh để chọn dễ dàng. */
export function FrameThumb({ frame }: { frame: FrameKind }) {
  if (frame === "round") {
    return (
      <div className="flex h-12 w-full items-center justify-center">
        <div className="h-10 w-10 rounded-full border-[3px] border-[#fffcf6] bg-gradient-to-br from-[#d99aa6] to-[#87a885] shadow" />
      </div>
    );
  }
  if (frame === "film") {
    return (
      <div className="mx-auto flex h-12 w-14 flex-col justify-between rounded-[3px] bg-[#262221] px-1.5 py-1 shadow">
        <div className="flex justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-1 w-1.5 rounded-[1px] bg-[#f7f1e5]/85" />
          ))}
        </div>
        <div className="h-6 w-full rounded-[1px] bg-gradient-to-br from-[#d99aa6] to-[#87a885]" />
        <div className="flex justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-1 w-1.5 rounded-[1px] bg-[#f7f1e5]/85" />
          ))}
        </div>
      </div>
    );
  }
  if (frame === "paper") {
    return (
      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-[2px] border border-[#c7b394] bg-[#f6ebd7] p-1.5 shadow">
        <div className="h-full w-full bg-gradient-to-br from-[#d99aa6] to-[#87a885]" />
        <span className="absolute left-1 top-1 h-2 w-2 border-l-2 border-t-2 border-[#7b5d3f]" />
        <span className="absolute right-1 top-1 h-2 w-2 border-r-2 border-t-2 border-[#7b5d3f]" />
        <span className="absolute bottom-1 left-1 h-2 w-2 border-b-2 border-l-2 border-[#7b5d3f]" />
        <span className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-[#7b5d3f]" />
      </div>
    );
  }
  if (frame === "tape") {
    return (
      <div className="relative mx-auto flex h-12 w-12 items-center justify-center bg-[#fffcf6] p-1 shadow">
        <span className="absolute -top-1 left-1/2 h-2 w-6 -translate-x-1/2 -rotate-3 bg-[#dca0ac]/80" />
        <div className="h-full w-full bg-gradient-to-br from-[#d99aa6] to-[#87a885]" />
      </div>
    );
  }
  if (frame === "plain") {
    return (
      <div className="mx-auto h-12 w-12 overflow-hidden rounded-lg bg-gradient-to-br from-[#d99aa6] to-[#87a885] shadow" />
    );
  }
  // polaroid
  return (
    <div className="mx-auto flex h-12 w-11 flex-col bg-[#fffcf6] p-1 pb-2.5 shadow">
      <div className="flex-1 bg-gradient-to-br from-[#d99aa6] to-[#87a885]" />
    </div>
  );
}

/** Vẽ nội dung một món trên trang (không lo kéo thả). Kích thước theo đơn vị khung 1000px, nhân `scale`. */
export function ItemView({
  item,
  url,
  scale,
  editing,
}: {
  item: AlbumItem;
  url?: string;
  scale: number;
  editing: boolean;
}) {
  const w = item.width * scale;

  if (item.kind === "drive") {
    let href: string | null = null;
    try {
      href = normalizeDriveUrl(item.drive_url ?? "");
    } catch {
      /* Dữ liệu cũ không hợp lệ: không tạo link. */
    }
    const padX = Math.max(8, 22 * scale);
    const padY = Math.max(8, 20 * scale);
    return (
      <div
        className="relative rounded-[10px] border border-[#b99f7c]/70 bg-[#fbf5e7] text-[#352824] shadow-[0_8px_20px_-8px_rgba(51,39,35,0.34)]"
        style={{ width: w, padding: `${padY}px ${padX}px` }}
      >
        <span className="washi washi-sage" aria-hidden />
        <div
          className="rounded-[6px] border border-dashed border-[#8a7054]/45 text-center"
          style={{ padding: `${Math.max(6, 14 * scale)}px ${Math.max(6, 12 * scale)}px` }}
        >
          <div className="mx-auto flex items-center justify-center rounded-full bg-[#dce7d8] text-[#456347]" style={{ width: Math.max(22, 54 * scale), height: Math.max(22, 54 * scale) }}>
            <IconDrive style={{ width: Math.max(12, 28 * scale), height: Math.max(12, 28 * scale) }} />
          </div>
          <p
            className="mt-1 break-words font-hand font-normal leading-tight text-[#332723]"
            style={{ fontSize: Math.max(11, 36 * scale) }}
          >
            {item.drive_name || "File Google Drive"}
          </p>
          <p className="mt-0.5 font-sans text-[#685a53]" style={{ fontSize: Math.max(8, 19 * scale) }}>
            Tệp đính kèm Google Drive
          </p>
          {!editing && href && (
            <a
              className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#537255] font-sans font-semibold text-[#fffcf6] no-underline shadow-xs transition hover:bg-[#415c43]"
              style={{
                fontSize: Math.max(9, 21 * scale),
                padding: `${Math.max(3, 7 * scale)}px ${Math.max(7, 16 * scale)}px`,
              }}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Mở trong Google Drive</span>
              <IconExternal style={{ width: Math.max(9, 18 * scale), height: Math.max(9, 18 * scale) }} />
            </a>
          )}
        </div>
      </div>
    );
  }

  if (item.kind === "text") {
    const size = (item.style.size ?? 56) * scale;
    return (
      <p
        className={`${FONT_CLASS[item.style.font ?? "hand"]} whitespace-pre-wrap break-words text-center leading-tight`}
        style={{ width: w, fontSize: size, color: item.style.color ?? "#332723" }}
      >
        {item.content}
      </p>
    );
  }

  if (item.kind === "sticker") {
    if (item.storage_path) {
      return url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          draggable={false}
          className="pointer-events-none block select-none drop-shadow-[0_4px_8px_rgba(51,39,35,0.18)]"
          style={{ width: w }}
        />
      ) : (
        <Placeholder w={w} aspect={1} />
      );
    }
    return (
      <div className="pointer-events-none drop-shadow-[0_4px_6px_rgba(51,39,35,0.15)]" style={{ width: w, fontSize: w * 0.84 }}>
        <StickerView content={item.content ?? "builtin:heart"} />
      </div>
    );
  }

  // photo / video trong 6 kiểu khung
  const aspect = item.style.aspect ?? 1;
  const frame: FrameKind = item.style.frame ?? (item.kind === "photo" ? "polaroid" : "plain");
  const media = url ? (
    item.kind === "photo" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={item.style.caption ?? ""}
        draggable={false}
        className="pointer-events-none block h-full w-full select-none object-cover"
      />
    ) : (
      <VideoBox url={url} editing={editing} />
    )
  ) : (
    <div className="h-full w-full animate-pulse bg-[#7a6461]/15" />
  );

  if (frame === "round") {
    return (
      <div
        className="relative overflow-hidden rounded-full border-[#fffcf6] bg-[#fffcf6] shadow-[0_10px_24px_-10px_rgba(40,30,26,0.42)]"
        style={{ width: w, height: w, borderWidth: Math.max(3, 10 * scale) }}
      >
        {media}
        {item.kind === "video" && <VideoBadge scale={scale} />}
      </div>
    );
  }

  if (frame === "film") {
    const sidePad = w * 0.055;
    const railH = Math.max(8, w * 0.09);
    const innerH = (w - sidePad * 2) * aspect;
    const holeW = Math.max(4, w * 0.055);
    const holeH = Math.max(3, railH * 0.48);
    return (
      <div
        className="relative rounded-[4px] bg-[#231f1e] shadow-[0_10px_26px_-10px_rgba(20,16,15,0.58)]"
        style={{ width: w, paddingLeft: sidePad, paddingRight: sidePad, paddingTop: railH, paddingBottom: railH }}
      >
        {/* Hàng lỗ phim trên */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-around px-2"
          style={{ height: railH }}
          aria-hidden
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="rounded-[2px] bg-[#f7f1e5]/85" style={{ width: holeW, height: holeH }} />
          ))}
        </div>
        <div className="overflow-hidden rounded-[2px] bg-black" style={{ height: innerH }}>
          {media}
        </div>
        {/* Hàng lỗ phim dưới */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-around px-2"
          style={{ height: railH }}
          aria-hidden
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="rounded-[2px] bg-[#f7f1e5]/85" style={{ width: holeW, height: holeH }} />
          ))}
        </div>
        {item.kind === "video" && <VideoBadge scale={scale} />}
      </div>
    );
  }

  if (frame === "paper") {
    const pad = w * 0.068;
    const corner = Math.max(10, w * 0.095);
    const innerH = (w - pad * 2) * aspect;
    return (
      <div
        className="relative rounded-[3px] border border-[#ccb798] bg-[#f7ecd7] shadow-[0_10px_24px_-10px_rgba(51,39,35,0.38)]"
        style={{ width: w, padding: pad }}
      >
        <div className="relative overflow-hidden bg-white shadow-inner" style={{ height: innerH }}>
          {media}
        </div>
        {/* 4 góc cài ảnh kiểu sổ ảnh cổ điển */}
        <span
          className="pointer-events-none absolute"
          style={{
            top: pad * 0.65,
            left: pad * 0.65,
            width: corner,
            height: corner,
            background: "linear-gradient(135deg, #6e523a 50%, transparent 50%)",
            opacity: 0.85,
          }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute"
          style={{
            top: pad * 0.65,
            right: pad * 0.65,
            width: corner,
            height: corner,
            background: "linear-gradient(225deg, #6e523a 50%, transparent 50%)",
            opacity: 0.85,
          }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute"
          style={{
            bottom: pad * 0.65,
            left: pad * 0.65,
            width: corner,
            height: corner,
            background: "linear-gradient(45deg, #6e523a 50%, transparent 50%)",
            opacity: 0.85,
          }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute"
          style={{
            bottom: pad * 0.65,
            right: pad * 0.65,
            width: corner,
            height: corner,
            background: "linear-gradient(315deg, #6e523a 50%, transparent 50%)",
            opacity: 0.85,
          }}
          aria-hidden
        />
        {item.kind === "video" && <VideoBadge scale={scale} />}
      </div>
    );
  }

  const pad = frame === "plain" ? 0 : w * 0.052;
  const bottomPad = frame === "polaroid" ? w * 0.19 : pad;
  return (
    <div
      className={`relative ${
        frame === "plain"
          ? "overflow-hidden"
          : "rounded-[4px] border border-black/5 bg-[#fffdf8]"
      } shadow-[0_8px_22px_-8px_rgba(45,34,29,0.4)]`}
      style={{
        width: w,
        padding: pad,
        paddingBottom: bottomPad,
        borderRadius: frame === "plain" ? Math.max(6, 18 * scale) : undefined,
      }}
    >
      {frame === "tape" && <span className="washi" aria-hidden />}
      <div className="overflow-hidden" style={{ height: (w - pad * 2) * aspect }}>
        {media}
      </div>
      {frame === "polaroid" && item.style.caption && (
        <p
          className="absolute inset-x-0 bottom-0 truncate px-2 text-center font-hand text-[#352824]"
          style={{ fontSize: Math.max(9, w * 0.078), lineHeight: `${bottomPad}px` }}
        >
          {item.style.caption}
        </p>
      )}
      {item.kind === "video" && <VideoBadge scale={scale} />}
    </div>
  );
}

function VideoBadge({ scale }: { scale: number }) {
  return (
    <span
      className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 font-sans text-white"
      style={{ fontSize: Math.max(9, 22 * scale), padding: `${Math.max(1, 3 * scale)}px ${Math.max(5, 10 * scale)}px` }}
    >
      ▶︎
    </span>
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
      className={`h-full w-full object-cover ${editing ? "pointer-events-none" : "cursor-pointer"}`}
      onClick={() => setMuted((m) => !m)}
    />
  );
}

function Placeholder({ w, aspect }: { w: number; aspect: number }) {
  return <div className="animate-pulse rounded bg-[#7a6461]/15" style={{ width: w, height: w * aspect }} />;
}
