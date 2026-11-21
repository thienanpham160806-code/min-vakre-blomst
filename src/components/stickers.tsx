import type { ReactNode } from "react";
import { Flower } from "./Flower";

export type StickerCategoryId =
  | "hoa-la"
  | "bang-keo"
  | "hen-ho"
  | "sinh-nhat"
  | "du-lich";

export type StickerItemMeta = {
  key: string;
  label: string;
  category: StickerCategoryId;
  defaultWidth?: number;
  svg: ReactNode;
};

export const STICKER_CATEGORIES: { id: StickerCategoryId; label: string }[] = [
  { id: "hoa-la", label: "Hoa lá" },
  { id: "bang-keo", label: "Băng keo & nhãn" },
  { id: "hen-ho", label: "Hẹn hò" },
  { id: "sinh-nhat", label: "Sinh nhật" },
  { id: "du-lich", label: "Du lịch" },
];

/**
 * 27 sticker minh họa cùng phong cách sổ tay thủ công & thực vật.
 * Lưu trong DB dạng content = "builtin:<key>" hoặc "emoji:<ký tự>".
 * Giữ nguyên toàn bộ key cũ (heart, heart-outline, star, sparkle, bow, cloud, ticket, stamp,
 * tape-pink, tape-mint, bubble, arrow, flower-tulip, flower-daisy, flower-sunflower) để album cũ không lỗi.
 */
export const STICKER_CATALOG: StickerItemMeta[] = [
  // ───────── Hoa lá (6) ─────────
  {
    key: "flower-tulip",
    label: "Hoa tulip",
    category: "hoa-la",
    defaultWidth: 190,
    svg: <Flower kind="tulip" color="#d97a8c" stem={115} />,
  },
  {
    key: "flower-daisy",
    label: "Cúc họa mi",
    category: "hoa-la",
    defaultWidth: 190,
    svg: <Flower kind="daisy" color="#e6a4b4" stem={110} />,
  },
  {
    key: "flower-sunflower",
    label: "Hướng dương",
    category: "hoa-la",
    defaultWidth: 190,
    svg: <Flower kind="sunflower" color="#e7b244" stem={120} />,
  },
  {
    key: "flower-lavender",
    label: "Oải hương",
    category: "hoa-la",
    defaultWidth: 190,
    svg: <Flower kind="lavender" color="#9c85c9" stem={125} />,
  },
  {
    key: "botanical-sprig",
    label: "Nhánh lá xanh",
    category: "hoa-la",
    defaultWidth: 220,
    svg: (
      <svg viewBox="0 0 120 120">
        <path d="M22 104 C 42 74, 62 50, 96 18" stroke="#4f6f51" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path d="M40 78 C 22 68, 22 48, 34 38 C 46 48, 48 66, 40 78 Z" fill="#82a57f" stroke="#4f6f51" strokeWidth="1.5" />
        <path d="M58 58 C 76 56, 90 44, 92 28 C 76 30, 62 42, 58 58 Z" fill="#9bb896" stroke="#4f6f51" strokeWidth="1.5" />
        <path d="M72 42 C 62 28, 62 16, 72 10 C 82 18, 82 32, 72 42 Z" fill="#779a74" stroke="#4f6f51" strokeWidth="1.5" />
        <circle cx="48" cy="86" r="5" fill="#d97a8c" />
        <circle cx="62" cy="74" r="4" fill="#e6a4b4" />
      </svg>
    ),
  },
  {
    key: "pressed-leaf",
    label: "Lá ép khô",
    category: "hoa-la",
    defaultWidth: 210,
    svg: (
      <svg viewBox="0 0 120 120">
        <path d="M24 98 C 26 52, 56 22, 98 20 C 96 64, 66 96, 24 98 Z" fill="#c9a87c" stroke="#7d5f3e" strokeWidth="2.4" />
        <path d="M18 104 L 92 26" stroke="#7d5f3e" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M46 74 L 40 52 M62 58 L 56 38 M56 64 L 78 68 M40 80 L 62 84" stroke="#7d5f3e" strokeWidth="1.7" strokeLinecap="round" opacity="0.7" />
      </svg>
    ),
  },

  // ───────── Băng keo & nhãn (6) ─────────
  {
    key: "tape-pink",
    label: "Băng keo hồng",
    category: "bang-keo",
    defaultWidth: 340,
    svg: (
      <svg viewBox="0 0 180 46">
        <path d="M6 8 L174 4 L170 22 L176 39 L8 42 L12 24 Z" fill="#e6a9b6" opacity="0.86" />
        <path d="M26 7 L14 41 M48 6 L36 41 M70 6 L58 40 M92 5 L80 40 M114 5 L102 40 M136 4 L124 39 M158 4 L146 39" stroke="#fffaf6" strokeWidth="5" opacity="0.52" />
      </svg>
    ),
  },
  {
    key: "tape-mint",
    label: "Băng keo xanh lá",
    category: "bang-keo",
    defaultWidth: 340,
    svg: (
      <svg viewBox="0 0 180 46">
        <path d="M6 7 L174 4 L170 23 L176 39 L6 42 L11 23 Z" fill="#9bb898" opacity="0.86" />
        <path d="M22 14 H158 M22 24 H158 M22 33 H158" stroke="#fbf7ef" strokeWidth="2.4" opacity="0.62" strokeDasharray="6 6" />
      </svg>
    ),
  },
  {
    key: "tape-kraft",
    label: "Băng keo giấy kraft",
    category: "bang-keo",
    defaultWidth: 340,
    svg: (
      <svg viewBox="0 0 180 46">
        <path d="M5 8 L175 5 L171 22 L176 40 L6 41 L10 24 Z" fill="#cfa97e" opacity="0.9" />
        <circle cx="38" cy="23" r="3" fill="#fffaf2" opacity="0.6" />
        <circle cx="68" cy="22" r="3" fill="#fffaf2" opacity="0.6" />
        <circle cx="98" cy="23" r="3" fill="#fffaf2" opacity="0.6" />
        <circle cx="128" cy="22" r="3" fill="#fffaf2" opacity="0.6" />
        <circle cx="154" cy="23" r="3" fill="#fffaf2" opacity="0.6" />
      </svg>
    ),
  },
  {
    key: "label-memory",
    label: "Nhãn kỷ niệm",
    category: "bang-keo",
    defaultWidth: 270,
    svg: (
      <svg viewBox="0 0 170 76">
        <rect x="6" y="8" width="158" height="60" rx="10" fill="#fffcf5" stroke="#8a6e58" strokeWidth="2.4" />
        <rect x="13" y="15" width="144" height="46" rx="6" fill="none" stroke="#c87b87" strokeWidth="1.5" strokeDasharray="5 4" />
        <text x="85" y="45" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="22" fill="#5b433b">kỷ niệm đẹp</text>
      </svg>
    ),
  },
  {
    key: "stamp",
    label: "Tem thư",
    category: "bang-keo",
    defaultWidth: 200,
    svg: (
      <svg viewBox="0 0 104 118">
        <rect x="5" y="5" width="94" height="108" rx="4" fill="#fffcf6" stroke="#b35464" strokeWidth="3" strokeDasharray="6 4" />
        <rect x="14" y="14" width="76" height="90" rx="2" fill="#f6dde2" />
        <path d="M52 80 C 30 65, 26 52, 34 44 C 41 37, 50 41, 52 49 C 54 41, 63 37, 70 44 C 78 52, 74 65, 52 80 Z" fill="#b35464" />
        <text x="52" y="33" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="15" fill="#7d3744">GỬI THƯƠNG</text>
      </svg>
    ),
  },
  {
    key: "paperclip",
    label: "Kẹp giấy đồng",
    category: "bang-keo",
    defaultWidth: 150,
    svg: (
      <svg viewBox="0 0 70 130">
        <path
          d="M24 38 V96 A14 14 0 0 0 52 96 V26 A20 20 0 0 0 12 26 V88 A8 8 0 0 0 28 88 V36"
          fill="none"
          stroke="#9c7a4c"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },

  // ───────── Hẹn hò (5) ─────────
  {
    key: "heart",
    label: "Trái tim hồng đất",
    category: "hen-ho",
    defaultWidth: 180,
    svg: (
      <svg viewBox="0 0 100 92">
        <path d="M50 86 C 12 59, 2 35, 14 18 C 25 3, 44 7, 50 22 C 56 7, 75 3, 86 18 C 98 35, 88 59, 50 86 Z" fill="#c75d6d" />
        <path d="M25 22 q 7 -7 14 0" stroke="#fff6f4" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.65" />
      </svg>
    ),
  },
  {
    key: "heart-outline",
    label: "Tim nét vẽ tay",
    category: "hen-ho",
    defaultWidth: 180,
    svg: (
      <svg viewBox="0 0 100 92">
        <path d="M50 82 C 15 57, 6 35, 17 19 C 27 5, 44 9, 50 23 C 56 9, 73 5, 83 19 C 94 35, 85 57, 50 82 Z" fill="none" stroke="#b35464" strokeWidth="5.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "coffee-cup",
    label: "Ly cà phê hẹn hò",
    category: "hen-ho",
    defaultWidth: 200,
    svg: (
      <svg viewBox="0 0 120 110">
        <path d="M44 26 C 42 18, 49 16, 48 10 M62 24 C 60 16, 67 14, 66 8" stroke="#9b7b66" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M24 38 H84 V68 A26 26 0 0 1 58 94 H50 A26 26 0 0 1 24 68 Z" fill="#fffaf2" stroke="#6f5343" strokeWidth="3.2" />
        <path d="M84 46 H94 A11 11 0 0 1 94 68 H84" fill="none" stroke="#6f5343" strokeWidth="3.2" />
        <path d="M54 74 C 44 67, 42 60, 47 56 C 50 53, 53 55, 54 58 C 55 55, 58 53, 61 56 C 66 60, 64 67, 54 74 Z" fill="#c75d6d" />
        <ellipse cx="54" cy="96" rx="38" ry="6" fill="#d9c2a0" />
      </svg>
    ),
  },
  {
    key: "ticket",
    label: "Vé xem phim đôi",
    category: "hen-ho",
    defaultWidth: 280,
    svg: (
      <svg viewBox="0 0 160 76">
        <path d="M8 8 H152 V28 A10 10 0 0 0 152 48 V68 H8 V48 A10 10 0 0 0 8 28 Z" fill="#f6dfb0" stroke="#a67c3b" strokeWidth="2.6" />
        <line x1="112" y1="10" x2="112" y2="66" stroke="#a67c3b" strokeWidth="2" strokeDasharray="4 4" />
        <text x="60" y="45" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="22" fill="#6b4b1a">HAI ĐỨA</text>
        <path d="M132 49 C 122 42, 120 35, 125 31 C 128 28, 131 30, 132 33 C 133 30, 136 28, 139 31 C 144 35, 142 42, 132 49 Z" fill="#b35464" />
      </svg>
    ),
  },
  {
    key: "love-envelope",
    label: "Phong bì niêm phong",
    category: "hen-ho",
    defaultWidth: 230,
    svg: (
      <svg viewBox="0 0 140 96">
        <rect x="8" y="14" width="124" height="74" rx="10" fill="#fbf2e3" stroke="#8c6c56" strokeWidth="2.6" />
        <path d="M10 18 L70 58 L130 18" fill="#f2dfc4" stroke="#8c6c56" strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="70" cy="54" r="12" fill="#b35464" />
        <path d="M70 60 C 65 56, 64 52, 66.5 50 C 68 48.5, 69.5 49.5, 70 51 C 70.5 49.5, 72 48.5, 73.5 50 C 76 52, 75 56, 70 60 Z" fill="#fff5f3" />
      </svg>
    ),
  },

  // ───────── Sinh nhật (5) ─────────
  {
    key: "birthday-cake",
    label: "Bánh kem nhỏ",
    category: "sinh-nhat",
    defaultWidth: 220,
    svg: (
      <svg viewBox="0 0 120 120">
        <rect x="57" y="24" width="6" height="22" rx="3" fill="#e6a4b4" />
        <path d="M60 10 C 65 16, 65 22, 60 24 C 55 22, 55 16, 60 10 Z" fill="#f1b94c" />
        <rect x="24" y="46" width="72" height="50" rx="10" fill="#f7e3c6" stroke="#7d5c45" strokeWidth="2.8" />
        <path d="M24 58 Q 36 70 48 58 T 72 58 T 96 58 V46 H24 Z" fill="#fffaf4" />
        <circle cx="42" cy="52" r="4" fill="#c75d6d" />
        <circle cx="78" cy="52" r="4" fill="#c75d6d" />
        <path d="M16 98 H104" stroke="#7d5c45" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "candle-wish",
    label: "Nến ước nguyện",
    category: "sinh-nhat",
    defaultWidth: 160,
    svg: (
      <svg viewBox="0 0 80 130">
        <path d="M40 12 C 49 23, 49 34, 40 38 C 31 34, 31 23, 40 12 Z" fill="#f2bc4f" />
        <path d="M40 22 C 44 27, 44 33, 40 35 C 36 33, 36 27, 40 22 Z" fill="#fff5cc" />
        <rect x="28" y="40" width="24" height="74" rx="8" fill="#f3d6dc" stroke="#995160" strokeWidth="2.6" />
        <path d="M28 58 L52 48 M28 76 L52 66 M28 94 L52 84" stroke="#fffaf6" strokeWidth="4" opacity="0.7" />
      </svg>
    ),
  },
  {
    key: "gift-box",
    label: "Hộp quà buộc nơ",
    category: "sinh-nhat",
    defaultWidth: 210,
    svg: (
      <svg viewBox="0 0 120 116">
        <rect x="20" y="44" width="80" height="60" rx="8" fill="#e8c8b0" stroke="#7a5741" strokeWidth="2.6" />
        <rect x="14" y="32" width="92" height="18" rx="6" fill="#f2d9c4" stroke="#7a5741" strokeWidth="2.6" />
        <rect x="52" y="32" width="16" height="72" fill="#c75d6d" />
        <path d="M60 32 C 44 32, 34 22, 38 14 C 42 7, 54 14, 60 32 Z" fill="#c75d6d" />
        <path d="M60 32 C 76 32, 86 22, 82 14 C 78 7, 66 14, 60 32 Z" fill="#d97a8c" />
      </svg>
    ),
  },
  {
    key: "bow",
    label: "Nơ ruy băng",
    category: "sinh-nhat",
    defaultWidth: 220,
    svg: (
      <svg viewBox="0 0 130 86">
        <path d="M65 38 C 34 8, 8 12, 12 38 C 8 64, 34 68, 65 38 Z" fill="#e599ab" stroke="#9a4b5d" strokeWidth="2.2" />
        <path d="M65 38 C 96 8, 122 12, 118 38 C 122 64, 96 68, 65 38 Z" fill="#e599ab" stroke="#9a4b5d" strokeWidth="2.2" />
        <path d="M58 42 L 42 80 L 55 73 L 62 82 Z M72 42 L 88 80 L 75 73 L 68 82 Z" fill="#c75d6d" />
        <circle cx="65" cy="38" r="10" fill="#b35464" />
      </svg>
    ),
  },
  {
    key: "sparkle",
    label: "Ánh lấp lánh",
    category: "sinh-nhat",
    defaultWidth: 160,
    svg: (
      <svg viewBox="0 0 100 100">
        <path d="M50 6 C 54 38, 62 46, 94 50 C 62 54, 54 62, 50 94 C 46 62, 38 54, 6 50 C 38 46, 46 38, 50 6 Z" fill="#f7dc88" stroke="#c9962f" strokeWidth="2.6" />
        <circle cx="80" cy="22" r="5" fill="#e6a4b4" />
      </svg>
    ),
  },

  // ───────── Du lịch (5) ─────────
  {
    key: "film-camera",
    label: "Máy ảnh phim",
    category: "du-lich",
    defaultWidth: 230,
    svg: (
      <svg viewBox="0 0 140 104">
        <path d="M44 22 L52 12 H88 L96 22 Z" fill="#5e6b64" stroke="#36322f" strokeWidth="2.6" />
        <rect x="14" y="22" width="112" height="70" rx="12" fill="#f5ede0" stroke="#36322f" strokeWidth="2.8" />
        <rect x="14" y="38" width="112" height="36" fill="#465852" />
        <circle cx="70" cy="56" r="21" fill="#f5ede0" stroke="#36322f" strokeWidth="2.8" />
        <circle cx="70" cy="56" r="13" fill="#2d3b38" />
        <circle cx="65" cy="51" r="4" fill="#a7c4bc" opacity="0.7" />
        <circle cx="106" cy="30" r="4.5" fill="#c75d6d" />
      </svg>
    ),
  },
  {
    key: "compass-pin",
    label: "Ghim tọa độ",
    category: "du-lich",
    defaultWidth: 180,
    svg: (
      <svg viewBox="0 0 100 116">
        <path d="M50 108 C 50 108, 16 70, 16 44 A34 34 0 1 1 84 44 C 84 70, 50 108, 50 108 Z" fill="#5b7a5e" stroke="#334a35" strokeWidth="2.8" />
        <circle cx="50" cy="44" r="16" fill="#fbf7ee" />
        <path d="M50 51 C 43 46, 42 41, 45.5 38 C 47.5 36.5, 49.5 37.8, 50 39.5 C 50.5 37.8, 52.5 36.5, 54.5 38 C 58 41, 57 46, 50 51 Z" fill="#c75d6d" />
      </svg>
    ),
  },
  {
    key: "cloud",
    label: "Đám mây êm",
    category: "du-lich",
    defaultWidth: 230,
    svg: (
      <svg viewBox="0 0 128 74">
        <path d="M26 64 C 6 64, 6 36, 26 36 C 26 16, 56 10, 64 28 C 74 14, 102 20, 98 40 C 118 40, 120 64, 100 64 Z" fill="#fffdf8" stroke="#9eb8c7" strokeWidth="2.8" />
      </svg>
    ),
  },
  {
    key: "suitcase-tag",
    label: "Thẻ hành lý",
    category: "du-lich",
    defaultWidth: 250,
    svg: (
      <svg viewBox="0 0 160 84">
        <path d="M28 12 H144 A8 8 0 0 1 152 20 V64 A8 8 0 0 1 144 72 H28 L8 42 Z" fill="#e6cfa9" stroke="#7d5e3a" strokeWidth="2.6" />
        <circle cx="28" cy="42" r="6" fill="#fffaf0" stroke="#7d5e3a" strokeWidth="2.2" />
        <line x1="48" y1="34" x2="134" y2="34" stroke="#7d5e3a" strokeWidth="2" opacity="0.55" />
        <line x1="48" y1="52" x2="116" y2="52" stroke="#7d5e3a" strokeWidth="2" opacity="0.55" />
        <text x="92" y="29" textAnchor="middle" fontFamily="Patrick Hand, cursive" fontSize="16" fill="#5e4327">ĐI CÙNG NHAU</text>
      </svg>
    ),
  },
  {
    key: "star",
    label: "Ngôi sao nhỏ",
    category: "du-lich",
    defaultWidth: 170,
    svg: (
      <svg viewBox="0 0 100 100">
        <path d="M50 8 L62 37 L94 40 L69 60 L78 92 L50 74 L22 92 L31 60 L6 40 L38 37 Z" fill="#f1c662" stroke="#b98926" strokeWidth="2.8" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// Giữ tương thích tuyệt đối với 2 sticker cũ không nằm trong 5 nhóm chính (bubble, arrow)
const LEGACY_EXTRA_STICKERS: Record<string, { label: string; svg: ReactNode }> = {
  bubble: {
    label: "Bóng thoại",
    svg: (
      <svg viewBox="0 0 120 90">
        <path d="M14 6 H106 A10 10 0 0 1 116 16 V58 A10 10 0 0 1 106 68 H44 L24 86 L28 68 H14 A10 10 0 0 1 4 58 V16 A10 10 0 0 1 14 6 Z" fill="#fffcf6" stroke="#3d2b2b" strokeWidth="3" />
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
};

export const BUILTIN_STICKERS: Record<string, { label: string; svg: ReactNode; category?: StickerCategoryId; defaultWidth?: number }> = {
  ...Object.fromEntries(STICKER_CATALOG.map((s) => [s.key, s])),
  ...LEGACY_EXTRA_STICKERS,
};

export const EMOJI_STICKERS = [
  "💗", "💕", "💌", "🌷", "🌸", "🌼", "🍓", "🍰", "🎂", "🧋", "🍜", "🍣",
  "🎈", "🎁", "🎀", "✨", "🌙", "☀️", "🌈", "📸", "🎬", "🎡", "🏖️", "✈️",
  "🐱", "🐶", "🐰", "🧸", "😘", "🥰", "😂", "🥺", "🤍", "💍", "📍", "🎶",
];

export function StickerView({ content, fit = "width" }: { content: string; fit?: "width" | "contain" }) {
  if (content.startsWith("emoji:")) {
    return (
      <span className="block select-none text-center leading-none" style={{ fontSize: "inherit" }}>
        {content.slice(6)}
      </span>
    );
  }
  const key = content.replace("builtin:", "");
  const s = BUILTIN_STICKERS[key];
  if (fit === "contain") {
    return (
      <div className="flex h-full w-full items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:h-full [&>svg]:w-auto">
        {s?.svg ?? null}
      </div>
    );
  }
  return <div className="[&>svg]:h-auto [&>svg]:w-full">{s?.svg ?? null}</div>;
}
