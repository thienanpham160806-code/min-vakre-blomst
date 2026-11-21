import type { SVGProps } from "react";

/** Bộ icon nét mảnh, cùng độ dày 1.75, khung 24x24. */
function Icon({ children, ...p }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      {children}
    </svg>
  );
}

export const IconGarden = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 21v-8" />
    <path d="M12 16c-2.5 0-4.5-1.5-5-4 2.5 0 4.5 1.5 5 4Z" />
    <path d="M8 5.5c0 3 1.8 5.5 4 5.5s4-2.5 4-5.5L14 7l-2-3-2 3-2-1.5Z" />
  </Icon>
);

export const IconLetter = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </Icon>
);

export const IconTicket = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3 8.5V6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v2a3.5 3.5 0 0 0 0 7v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-2a3.5 3.5 0 0 0 0-7Z" />
    <path d="M14.5 5v2.5M14.5 10.75v2.5M14.5 16.5V19" />
  </Icon>
);

export const IconStar = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </Icon>
);

export const IconSettings = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Icon>
);

/** Mầm cây đung đưa: dùng cho trạng thái đang tải. */
export function Sprout({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`origin-bottom animate-sway ${className}`} aria-hidden>
      <path d="M24 44V24" stroke="#6f9a6b" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M24 30c-7 0-12-4-13-11 7 0 12 4 13 11Z" fill="#8fb98a" />
      <path d="M24 25c1-7 6-11 13-11-1 7-6 11-13 11Z" fill="#9cc596" />
    </svg>
  );
}
