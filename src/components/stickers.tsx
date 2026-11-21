import type { ReactNode } from "react";
import { Flower } from "./Flower";

/**
 * Sticker vẽ sẵn (SVG tự vẽ, không dính bản quyền).
 * Lưu trong DB dạng content = "builtin:<key>" hoặc "emoji:<ký tự>".
 */
export const BUILTIN_STICKERS: Record<string, { label: string; svg: ReactNode }> = {
  heart: {
    label: "Tim",
    svg: (
      <svg viewBox="0 0 100 90">
        <path d="M50 86 C 10 58, 0 34, 12 16 C 24 0, 44 4, 50 20 C 56 4, 76 0, 88 16 C 100 34, 90 58, 50 86 Z" fill="#e0708f" />
        <path d="M24 20 q 8 -8 16 0" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
  },
  "heart-outline": {
    label: "Tim viền",
    svg: (
      <svg viewBox="0 0 100 90">
        <path d="M50 82 C 14 56, 4 34, 15 18 C 26 4, 44 8, 50 22 C 56 8, 74 4, 85 18 C 96 34, 86 56, 50 82 Z" fill="none" stroke="#e0708f" strokeWidth="6" strokeLinejoin="round" />
      </svg>
    ),
  },
  star: {
    label: "Sao",
    svg: (
      <svg viewBox="0 0 100 100">
        <path d="M50 6 L62 38 L96 40 L69 61 L79 94 L50 75 L21 94 L31 61 L4 40 L38 38 Z" fill="#f6c453" stroke="#e0a92a" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    ),
  },
  sparkle: {
    label: "Lấp lánh",
    svg: (
      <svg viewBox="0 0 100 100">
        <path d="M50 4 C 54 38, 62 46, 96 50 C 62 54, 54 62, 50 96 C 46 62, 38 54, 4 50 C 38 46, 46 38, 50 4 Z" fill="#fff1a8" stroke="#f6c453" strokeWidth="3" />
      </svg>
    ),
  },
  bow: {
    label: "Nơ",
    svg: (
      <svg viewBox="0 0 120 80">
        <path d="M60 40 C 30 6, 4 10, 8 40 C 4 70, 30 74, 60 40 Z" fill="#f7a8c4" />
        <path d="M60 40 C 90 6, 116 10, 112 40 C 116 70, 90 74, 60 40 Z" fill="#f7a8c4" />
        <path d="M54 44 L 40 78 L 52 72 L 58 80 Z M66 44 L 80 78 L 68 72 L 62 80 Z" fill="#e0708f" />
        <circle cx="60" cy="40" r="10" fill="#e0708f" />
      </svg>
    ),
  },
  cloud: {
    label: "Mây",
    svg: (
      <svg viewBox="0 0 120 70">
        <path d="M24 62 C 4 62, 4 34, 24 34 C 24 14, 54 8, 62 26 C 72 12, 100 18, 96 38 C 116 38, 118 62, 98 62 Z" fill="white" stroke="#cfe3f2" strokeWidth="3" />
      </svg>
    ),
  },
  ticket: {
    label: "Vé",
    svg: (
      <svg viewBox="0 0 140 70">
        <path d="M6 8 H134 V26 A9 9 0 0 0 134 44 V62 H6 V44 A9 9 0 0 0 6 26 Z" fill="#ffe3a3" stroke="#e0a92a" strokeWidth="2.5" />
        <line x1="100" y1="10" x2="100" y2="60" stroke="#e0a92a" strokeWidth="2" strokeDasharray="4 4" />
        <text x="52" y="43" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="22" fill="#8a5a12">ADMIT 2</text>
        <text x="118" y="44" textAnchor="middle" fontSize="20">🎬</text>
      </svg>
    ),
  },
  stamp: {
    label: "Tem",
    svg: (
      <svg viewBox="0 0 100 110">
        <rect x="4" y="4" width="92" height="102" fill="white" stroke="#e0708f" strokeWidth="3" strokeDasharray="6 4" />
        <rect x="14" y="14" width="72" height="82" fill="#fde2ea" />
        <path d="M50 76 C 26 60, 22 46, 30 38 C 38 30, 48 34, 50 42 C 52 34, 62 30, 70 38 C 78 46, 74 60, 50 76 Z" fill="#e0708f" />
        <text x="50" y="30" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="14" fill="#a04060">LOVE</text>
      </svg>
    ),
  },
  "tape-pink": {
    label: "Băng keo",
    svg: (
      <svg viewBox="0 0 160 40">
        <defs>
          <pattern id="tp" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill="#f7a8c4" />
            <rect x="8" width="8" height="16" fill="#fde2ea" />
          </pattern>
        </defs>
        <path d="M4 6 L156 2 L152 20 L158 36 L6 38 L10 22 Z" fill="url(#tp)" opacity="0.85" />
      </svg>
    ),
  },
  "tape-mint": {
    label: "Băng keo xanh",
    svg: (
      <svg viewBox="0 0 160 40">
        <path d="M4 6 L156 2 L152 20 L158 36 L6 38 L10 22 Z" fill="#bfe3d0" opacity="0.85" />
        <path d="M20 10 h120 M20 20 h120 M20 30 h120" stroke="white" strokeWidth="3" opacity="0.6" />
      </svg>
    ),
  },
  bubble: {
    label: "Bóng thoại",
    svg: (
      <svg viewBox="0 0 120 90">
        <path d="M14 6 H106 A10 10 0 0 1 116 16 V58 A10 10 0 0 1 106 68 H44 L24 86 L28 68 H14 A10 10 0 0 1 4 58 V16 A10 10 0 0 1 14 6 Z" fill="white" stroke="#3d2b2b" strokeWidth="3" />
      </svg>
    ),
  },
  arrow: {
    label: "Mũi tên",
    svg: (
      <svg viewBox="0 0 120 60">
        <path d="M8 44 C 40 10, 76 10, 104 30" stroke="#3d2b2b" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="1 9" />
        <path d="M92 18 L106 31 L88 38" stroke="#3d2b2b" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  "flower-tulip": { label: "Tulip", svg: <Flower kind="tulip" color="#f7a8c4" stem={110} /> },
  "flower-daisy": { label: "Cúc", svg: <Flower kind="daisy" color="#f7a8c4" stem={110} /> },
  "flower-sunflower": { label: "Hướng dương", svg: <Flower kind="sunflower" color="#f6c453" stem={110} /> },
};

export const EMOJI_STICKERS = [
  "💗", "💕", "💌", "🌷", "🌸", "🌼", "🍓", "🍰", "🎂", "🧋", "🍜", "🍣",
  "🎈", "🎁", "🎀", "✨", "🌙", "☀️", "🌈", "📸", "🎬", "🎡", "🏖️", "✈️",
  "🐱", "🐶", "🐰", "🧸", "😘", "🥰", "😂", "🥺", "🤍", "💍", "📍", "🎶",
];

export function StickerView({ content }: { content: string }) {
  if (content.startsWith("emoji:")) {
    return (
      <span className="block select-none text-center leading-none" style={{ fontSize: "inherit" }}>
        {content.slice(6)}
      </span>
    );
  }
  const key = content.replace("builtin:", "");
  const s = BUILTIN_STICKERS[key];
  return <div className="[&>svg]:h-auto [&>svg]:w-full">{s?.svg ?? null}</div>;
}
