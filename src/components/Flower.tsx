import type { ReactNode } from "react";
import type { FlowerKind } from "@/lib/types";

export type FlowerMeta = {
  kind: FlowerKind;
  label: string;
  defaultStem: number;
  defaultColor: string;
  note: string;
};

export const FLOWER_KINDS: FlowerMeta[] = [
  { kind: "tulip", label: "Tulip", defaultStem: 118, defaultColor: "#d97a8c", note: "Cánh úp thanh mảnh" },
  { kind: "daisy", label: "Cúc họa mi", defaultStem: 108, defaultColor: "#e6a4b4", note: "Cánh trắng nhụy vàng" },
  { kind: "rose", label: "Hoa hồng", defaultStem: 124, defaultColor: "#b84b5c", note: "Cánh xoắn cổ điển" },
  { kind: "sunflower", label: "Hướng dương", defaultStem: 142, defaultColor: "#e7b244", note: "Thân cao rực nắng" },
  { kind: "lavender", label: "Oải hương", defaultStem: 136, defaultColor: "#9c85c9", note: "Nhánh mảnh xếp tầng" },
  { kind: "peony", label: "Mẫu đơn", defaultStem: 114, defaultColor: "#e498ab", note: "Cánh xòe dày dịu dàng" },
  { kind: "camellia", label: "Trà mi", defaultStem: 104, defaultColor: "#c85b6d", note: "Cánh tròn cân đối" },
  { kind: "poppy", label: "Anh túc", defaultStem: 128, defaultColor: "#df785b", note: "Cánh mềm uốn nhẹ" },
];

export type FlowerColorOption = {
  hex: string;
  label: string;
};

export const FLOWER_COLOR_PALETTE: FlowerColorOption[] = [
  { hex: "#d97a8c", label: "Hồng đất" },
  { hex: "#f2a7bc", label: "Hồng phấn" },
  { hex: "#b84b5c", label: "Đỏ rượu" },
  { hex: "#df785b", label: "Đào chín" },
  { hex: "#e7b244", label: "Nắng mật" },
  { hex: "#9c85c9", label: "Oải hương" },
  { hex: "#7daec8", label: "Xanh mưa" },
  { hex: "#efe3ce", label: "Kem sữa" },
];

/** Giữ xuất mảng hex để tương thích code cũ nếu cần. */
export const FLOWER_COLORS = FLOWER_COLOR_PALETTE.map((c) => c.hex);

const KIND_MAP = new Map(FLOWER_KINDS.map((f) => [f.kind, f]));

export function getFlowerMeta(kind: string | null | undefined): FlowerMeta {
  if (kind && KIND_MAP.has(kind as FlowerKind)) return KIND_MAP.get(kind as FlowerKind)!;
  return KIND_MAP.get("tulip")!;
}

/**
 * Minh họa 8 loài hoa cùng bộ nét thực vật thủ công.
 * viewBox 0 0 110 210: bông ở trên, cuống và lá riêng từng loài kéo xuống đáy.
 */
export function Flower({
  kind,
  color,
  className,
  stem,
}: {
  kind: FlowerKind | string;
  color: string;
  className?: string;
  stem?: number;
}) {
  const meta = getFlowerMeta(kind);
  const s = stem ?? meta.defaultStem;
  const top = 205 - s;
  const spec = SPECIES[meta.kind];

  return (
    <svg viewBox="0 0 110 210" className={className} aria-hidden>
      {spec.stem(top, s)}
      <g transform={`translate(55 ${top + 10})`}>{spec.head(color)}</g>
    </svg>
  );
}

type SpeciesRenderer = {
  stem: (top: number, s: number) => ReactNode;
  head: (color: string) => ReactNode;
};

const SPECIES: Record<FlowerKind, SpeciesRenderer> = {
  tulip: {
    stem: (top, s) => (
      <g>
        <path d={`M55 205 C 52 ${top + s * 0.6}, 58 ${top + s * 0.3}, 55 ${top + 16}`} stroke="#577a56" strokeWidth="3.6" fill="none" strokeLinecap="round" />
        {/* Lá tulip dài vươn cao ôm thân */}
        <path d={`M54 ${top + s * 0.86} C 32 ${top + s * 0.65}, 24 ${top + s * 0.36}, 33 ${top + s * 0.18} C 41 ${top + s * 0.36}, 45 ${top + s * 0.62}, 54 ${top + s * 0.78} Z`} fill="#7da077" />
        <path d={`M56 ${top + s * 0.82} C 74 ${top + s * 0.64}, 82 ${top + s * 0.4}, 76 ${top + s * 0.24} C 68 ${top + s * 0.42}, 63 ${top + s * 0.62}, 56 ${top + s * 0.75} Z`} fill="#93b58c" />
      </g>
    ),
    head: (c) => (
      <g>
        {/* Cánh giữa phía sau */}
        <path d="M-9 -6 C -11 -26, -3 -37, 0 -37 C 3 -37, 11 -26, 9 -6 Z" fill={c} opacity="0.82" />
        {/* Hai cánh ôm ngoài */}
        <path d="M-2 8 C -19 7, -23 -12, -16 -30 C -6 -25, -1 -14, 0 -2 Z" fill={c} stroke="rgba(51,39,35,0.16)" strokeWidth="1" />
        <path d="M2 8 C 19 7, 23 -12, 16 -30 C 6 -25, 1 -14, 0 -2 Z" fill={c} stroke="rgba(51,39,35,0.16)" strokeWidth="1" />
        {/* Ánh sáng nhẹ trên cánh */}
        <path d="M-11 -21 C -13 -12, -10 -3, -5 2" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M-6 8 Q 0 12 6 8" stroke="#577a56" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    ),
  },

  daisy: {
    stem: (top, s) => (
      <g>
        <path d={`M55 205 C 58 ${top + s * 0.62}, 51 ${top + s * 0.34}, 55 ${top + 14}`} stroke="#5d8359" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        {/* Lá xẻ nhẹ đặc trưng hoa cúc */}
        <path d={`M54 ${top + s * 0.68} C 38 ${top + s * 0.64}, 27 ${top + s * 0.56}, 23 ${top + s * 0.45} C 35 ${top + s * 0.47}, 45 ${top + s * 0.54}, 54 ${top + s * 0.63} Z`} fill="#84a87d" />
        <path d={`M56 ${top + s * 0.52} C 70 ${top + s * 0.49}, 80 ${top + s * 0.42}, 84 ${top + s * 0.33} C 72 ${top + s * 0.35}, 64 ${top + s * 0.42}, 56 ${top + s * 0.48} Z`} fill="#98ba90" />
      </g>
    ),
    head: (c) => (
      <g>
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-16"
            rx="4.6"
            ry="13.5"
            fill="#fffdf8"
            stroke={c}
            strokeWidth="1.5"
            transform={`rotate(${i * 30})`}
          />
        ))}
        <circle r="8.5" fill="#e9b84a" stroke="#c89228" strokeWidth="1.2" />
        <circle cx="-2.2" cy="-2" r="1.1" fill="#fff3c4" />
        <circle cx="2.6" cy="-1.2" r="1" fill="#c89228" opacity="0.6" />
        <circle cx="0" cy="2.6" r="1.1" fill="#c89228" opacity="0.55" />
      </g>
    ),
  },

  rose: {
    stem: (top, s) => (
      <g>
        <path d={`M55 205 C 52 ${top + s * 0.65}, 56 ${top + s * 0.32}, 55 ${top + 16}`} stroke="#4a6b4a" strokeWidth="3.6" fill="none" strokeLinecap="round" />
        {/* Gai nhỏ thanh lịch */}
        <path d={`M54 ${top + s * 0.72} l -5 -3 l 4 -2`} fill="#4a6b4a" />
        <path d={`M56 ${top + s * 0.42} l 5 -3 l -4 -2`} fill="#4a6b4a" />
        {/* Lá hoa hồng bầu dục đôi */}
        <path d={`M54 ${top + s * 0.58} C 38 ${top + s * 0.58}, 27 ${top + s * 0.5}, 25 ${top + s * 0.39} C 38 ${top + s * 0.39}, 48 ${top + s * 0.47}, 54 ${top + s * 0.56} Z`} fill="#6b8f68" />
        <path d={`M56 ${top + s * 0.46} C 70 ${top + s * 0.46}, 80 ${top + s * 0.39}, 83 ${top + s * 0.28} C 71 ${top + s * 0.29}, 61 ${top + s * 0.37}, 56 ${top + s * 0.44} Z`} fill="#7fa37b" />
      </g>
    ),
    head: (c) => (
      <g>
        {/* Đài xanh dưới nụ */}
        <path d="M-10 10 Q -17 14 -14 4 M10 10 Q 17 14 14 4" stroke="#4a6b4a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {/* Cánh ngoài */}
        <circle cx="-8" cy="-4" r="14" fill={c} opacity="0.92" />
        <circle cx="8" cy="-4" r="14" fill={c} opacity="0.92" />
        <circle cx="0" cy="-11" r="14" fill={c} />
        <circle cx="0" cy="-2" r="16.5" fill={c} stroke="rgba(51,39,35,0.14)" strokeWidth="1" />
        {/* Đường xoắn hoa hồng */}
        <path
          d="M-11 -4 C -12 -14, 0 -18, 9 -11 C 15 -4, 9 7, -1 6 C -8 5, -9 -4, -2 -7 C 4 -9, 7 -3, 3 1 C 0 3, -3 0, -1 -2"
          stroke="rgba(255,250,246,0.52)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M-9 -2 C -9 -10, 0 -13, 6 -8 C 11 -3, 7 4, 0 4"
          stroke="rgba(51,39,35,0.2)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    ),
  },

  sunflower: {
    stem: (top, s) => (
      <g>
        <path d={`M55 205 C 53 ${top + s * 0.6}, 57 ${top + s * 0.3}, 55 ${top + 18}`} stroke="#52764c" strokeWidth="4.4" fill="none" strokeLinecap="round" />
        {/* Lá hướng dương to bản */}
        <path d={`M54 ${top + s * 0.66} C 30 ${top + s * 0.68}, 18 ${top + s * 0.56}, 17 ${top + s * 0.42} C 33 ${top + s * 0.41}, 46 ${top + s * 0.5}, 54 ${top + s * 0.62} Z`} fill="#6f9766" />
        <path d={`M56 ${top + s * 0.48} C 78 ${top + s * 0.5}, 88 ${top + s * 0.39}, 90 ${top + s * 0.27} C 75 ${top + s * 0.27}, 63 ${top + s * 0.36}, 56 ${top + s * 0.45} Z`} fill="#84aa7a" />
      </g>
    ),
    head: (c) => (
      <g>
        {/* Vòng cánh sau */}
        {Array.from({ length: 14 }).map((_, i) => (
          <ellipse
            key={`b-${i}`}
            cx="0"
            cy="-20"
            rx="4.4"
            ry="11"
            fill={c}
            opacity="0.72"
            transform={`rotate(${i * (360 / 14) + 12})`}
          />
        ))}
        {/* Vòng cánh trước */}
        {Array.from({ length: 14 }).map((_, i) => (
          <ellipse
            key={`f-${i}`}
            cx="0"
            cy="-18"
            rx="4.8"
            ry="12"
            fill={c}
            stroke="rgba(90,62,24,0.18)"
            strokeWidth="0.9"
            transform={`rotate(${i * (360 / 14)})`}
          />
        ))}
        <circle r="12.5" fill="#5e3b24" />
        <circle r="9.5" fill="#764b2f" stroke="#4d2f1c" strokeWidth="1" strokeDasharray="2 2.5" />
        <circle cx="-3" cy="-3" r="1.2" fill="#d9a55b" opacity="0.7" />
        <circle cx="3" cy="-2" r="1.2" fill="#d9a55b" opacity="0.7" />
        <circle cx="0" cy="3" r="1.2" fill="#d9a55b" opacity="0.7" />
      </g>
    ),
  },

  lavender: {
    stem: (top, s) => (
      <g>
        <path d={`M55 205 C 53 ${top + s * 0.65}, 56 ${top + s * 0.35}, 55 ${top - 22}`} stroke="#628067" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        {/* Lá mảnh vươn từ gốc */}
        <path d={`M54 ${top + s * 0.82} C 42 ${top + s * 0.66}, 37 ${top + s * 0.52}, 39 ${top + s * 0.38} C 45 ${top + s * 0.52}, 49 ${top + s * 0.66}, 54 ${top + s * 0.77} Z`} fill="#82a186" />
        <path d={`M56 ${top + s * 0.78} C 68 ${top + s * 0.64}, 72 ${top + s * 0.48}, 70 ${top + s * 0.35} C 64 ${top + s * 0.49}, 61 ${top + s * 0.64}, 56 ${top + s * 0.73} Z`} fill="#95b398" />
      </g>
    ),
    head: (c) => (
      <g>
        {Array.from({ length: 8 }).map((_, i) => {
          const y = 14 - i * 6.4;
          const spread = i < 6 ? 5.2 - i * 0.35 : 2.6;
          return (
            <g key={i} transform={`translate(0 ${y})`}>
              <ellipse cx={-spread} cy="0" rx="4.2" ry="5.2" fill={c} transform="rotate(-24)" />
              <ellipse cx={spread} cy="-2" rx="4.2" ry="5.2" fill={c} opacity="0.88" transform="rotate(24)" />
              {i % 2 === 0 && <ellipse cx="0" cy="-3.5" rx="3.5" ry="4.6" fill={c} opacity="0.96" />}
            </g>
          );
        })}
        <ellipse cx="0" cy="-37" rx="3.4" ry="5.2" fill={c} />
      </g>
    ),
  },

  peony: {
    stem: (top, s) => (
      <g>
        <path d={`M55 205 C 53 ${top + s * 0.62}, 57 ${top + s * 0.32}, 55 ${top + 16}`} stroke="#517553" strokeWidth="3.8" fill="none" strokeLinecap="round" />
        <path d={`M54 ${top + s * 0.64} C 35 ${top + s * 0.62}, 22 ${top + s * 0.52}, 22 ${top + s * 0.38} C 37 ${top + s * 0.39}, 47 ${top + s * 0.48}, 54 ${top + s * 0.58} Z`} fill="#749872" />
        <path d={`M56 ${top + s * 0.5} C 74 ${top + s * 0.5}, 85 ${top + s * 0.4}, 87 ${top + s * 0.28} C 73 ${top + s * 0.29}, 62 ${top + s * 0.38}, 56 ${top + s * 0.46} Z`} fill="#88ac85" />
      </g>
    ),
    head: (c) => (
      <g>
        {/* Bông mẫu đơn xòe bồng bềnh nhiều lớp cánh */}
        {[-16, -8, 0, 8, 16].map((x, idx) => (
          <ellipse key={idx} cx={x} cy={-6 - Math.abs(idx - 2) * 2} rx="11" ry="13" fill={c} opacity="0.72" />
        ))}
        <path d="M-21 -2 C -24 -18, -10 -28, 0 -22 C 10 -28, 24 -18, 21 -2 C 19 10, -19 10, -21 -2 Z" fill={c} stroke="rgba(51,39,35,0.14)" strokeWidth="1" />
        <path d="M-15 -6 C -14 -20, -4 -23, 0 -17 C 4 -23, 14 -20, 15 -6 C 11 2, -11 2, -15 -6 Z" fill="rgba(255,252,248,0.28)" />
        <path d="M-9 -9 C -6 -16, 6 -16, 9 -9 C 5 -2, -5 -2, -9 -9 Z" fill={c} />
        <circle cx="0" cy="-9" r="4" fill="#f3d27a" opacity="0.88" />
      </g>
    ),
  },

  camellia: {
    stem: (top, s) => (
      <g>
        <path d={`M55 205 C 55 ${top + s * 0.65}, 54 ${top + s * 0.35}, 55 ${top + 16}`} stroke="#426449" strokeWidth="3.6" fill="none" strokeLinecap="round" />
        {/* Lá trà mi bầu dày màu xanh trầm */}
        <path d={`M54 ${top + s * 0.62} C 36 ${top + s * 0.64}, 25 ${top + s * 0.54}, 28 ${top + s * 0.42} C 41 ${top + s * 0.41}, 50 ${top + s * 0.49}, 54 ${top + s * 0.58} Z`} fill="#547a5a" />
        <path d={`M56 ${top + s * 0.48} C 74 ${top + s * 0.5}, 84 ${top + s * 0.41}, 82 ${top + s * 0.29} C 69 ${top + s * 0.29}, 60 ${top + s * 0.37}, 56 ${top + s * 0.45} Z`} fill="#658c6a" />
      </g>
    ),
    head: (c) => (
      <g>
        {/* Vòng 6 cánh tròn đều ngoài */}
        {Array.from({ length: 6 }).map((_, i) => (
          <ellipse
            key={`o-${i}`}
            cx="0"
            cy="-13"
            rx="10"
            ry="11"
            fill={c}
            stroke="rgba(51,39,35,0.14)"
            strokeWidth="1"
            transform={`rotate(${i * 60})`}
          />
        ))}
        {/* Vòng 6 cánh trong xen kẽ sáng hơn */}
        {Array.from({ length: 6 }).map((_, i) => (
          <ellipse
            key={`i-${i}`}
            cx="0"
            cy="-8.5"
            rx="7"
            ry="8"
            fill={c}
            stroke="rgba(255,250,245,0.45)"
            strokeWidth="1"
            transform={`rotate(${i * 60 + 30})`}
          />
        ))}
        {/* Nhụy vàng giữa hoa trà mi */}
        <circle r="5.5" fill="#f1c55a" />
        <circle cx="-2" cy="-1.5" r="1" fill="#fff6d6" />
        <circle cx="2" cy="1" r="1" fill="#d39b27" />
      </g>
    ),
  },

  poppy: {
    stem: (top, s) => (
      <g>
        {/* Thân anh túc cong uyển chuyển */}
        <path d={`M55 205 C 48 ${top + s * 0.65}, 62 ${top + s * 0.32}, 55 ${top + 14}`} stroke="#5e7f5a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d={`M53 ${top + s * 0.72} C 38 ${top + s * 0.66}, 30 ${top + s * 0.56}, 26 ${top + s * 0.46} C 38 ${top + s * 0.5}, 46 ${top + s * 0.58}, 53 ${top + s * 0.68} Z`} fill="#7da077" />
        <path d={`M56 ${top + s * 0.58} C 70 ${top + s * 0.52}, 78 ${top + s * 0.43}, 81 ${top + s * 0.34} C 70 ${top + s * 0.38}, 63 ${top + s * 0.46}, 56 ${top + s * 0.54} Z`} fill="#90b289" />
      </g>
    ),
    head: (c) => (
      <g>
        {/* 4 cánh lớn mềm mại */}
        <ellipse cx="-12" cy="-8" rx="14" ry="12" fill={c} opacity="0.9" transform="rotate(-18 -12 -8)" />
        <ellipse cx="12" cy="-8" rx="14" ry="12" fill={c} opacity="0.9" transform="rotate(18 12 -8)" />
        <ellipse cx="0" cy="-16" rx="15" ry="11" fill={c} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <ellipse cx="0" cy="-2" rx="15" ry="11" fill={c} stroke="rgba(51,39,35,0.14)" strokeWidth="1" />
        {/* Tâm đen nhánh đặc trưng của hoa anh túc */}
        <circle cx="0" cy="-9" r="6.5" fill="#2f252a" />
        <circle cx="0" cy="-9" r="3" fill="#6b825d" />
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="-9"
            x2="0"
            y2="-15.5"
            stroke="#2f252a"
            strokeWidth="1.2"
            transform={`rotate(${i * 45} 0 -9)`}
          />
        ))}
      </g>
    ),
  },
};
