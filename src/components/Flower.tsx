import type { FlowerKind } from "@/lib/types";

/** Hoa vẽ bằng SVG. viewBox 0 0 100 200: bông ở trên, cuống kéo xuống đáy. */
export function Flower({
  kind,
  color,
  className,
  stem = 120,
}: {
  kind: FlowerKind;
  color: string;
  className?: string;
  stem?: number;
}) {
  const top = 200 - stem;
  return (
    <svg viewBox="0 0 100 200" className={className} aria-hidden>
      <path d={`M50 200 C 46 ${top + stem * 0.6}, 54 ${top + stem * 0.3}, 50 ${top + 20}`} stroke="#6f9a6b" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d={`M50 ${top + stem * 0.62} q -22 -6 -30 -22 q 20 0 30 18`} fill="#8fb98a" />
      <path d={`M50 ${top + stem * 0.45} q 22 -4 28 -20 q -20 2 -28 16`} fill="#9cc596" />
      <g transform={`translate(50 ${top + 10})`}>{HEADS[kind](color)}</g>
    </svg>
  );
}

const HEADS: Record<FlowerKind, (c: string) => React.ReactNode> = {
  tulip: (c) => (
    <g>
      <path d="M-18 -4 C -20 -26, -8 -34, 0 -22 C 8 -34, 20 -26, 18 -4 C 16 10, -16 10, -18 -4 Z" fill={c} />
      <path d="M-6 -20 C -2 -30, 2 -30, 6 -20 C 4 -6, -4 -6, -6 -20 Z" fill="white" opacity="0.25" />
    </g>
  ),
  daisy: (c) => (
    <g>
      {Array.from({ length: 10 }).map((_, i) => (
        <ellipse key={i} cx="0" cy="-15" rx="6" ry="14" fill="white" stroke={c} strokeWidth="1.5" transform={`rotate(${i * 36})`} />
      ))}
      <circle r="8" fill="#f6c453" />
    </g>
  ),
  rose: (c) => (
    <g>
      <circle r="19" fill={c} />
      <path d="M-12 -2 a 12 12 0 1 1 18 10 a 8 8 0 1 1 -10 -12 a 4 4 0 1 1 5 6" stroke="rgba(0,0,0,0.18)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  ),
  sunflower: (c) => (
    <g>
      {Array.from({ length: 14 }).map((_, i) => (
        <ellipse key={i} cx="0" cy="-17" rx="5" ry="12" fill={c} transform={`rotate(${i * (360 / 14)})`} />
      ))}
      <circle r="11" fill="#7a4b2a" />
    </g>
  ),
  lavender: (c) => (
    <g>
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={i} transform={`translate(0 ${-i * 7 + 14})`}>
          <ellipse cx="-4" cy="0" rx="4" ry="5" fill={c} />
          <ellipse cx="4" cy="-3" rx="4" ry="5" fill={c} opacity="0.85" />
        </g>
      ))}
    </g>
  ),
};

export const FLOWER_KINDS: { kind: FlowerKind; label: string }[] = [
  { kind: "tulip", label: "Tulip" },
  { kind: "daisy", label: "Cúc" },
  { kind: "rose", label: "Hồng" },
  { kind: "sunflower", label: "Hướng dương" },
  { kind: "lavender", label: "Oải hương" },
];

export const FLOWER_COLORS = ["#f7a8c4", "#e0708f", "#f6c453", "#b9a3e3", "#ff9f80", "#9ad0ec"];
