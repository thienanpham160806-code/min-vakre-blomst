import type { SVGProps } from "react";

/** Bộ icon nét mảnh đồng bộ kiểu sổ tay thực vật, độ dày 1.75, khung 24x24. */
function Icon({ children, ...p }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...p}
    >
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

export const IconPalette = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 3a9 9 0 0 0 0 18h1.4a2.2 2.2 0 0 0 1.6-3.7 1.8 1.8 0 0 1 1.3-3h1.7A3 3 0 0 0 21 11.3 8.5 8.5 0 0 0 12 3Z" />
    <circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Icon>
);

export const IconEye = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.7" />
  </Icon>
);

export const IconPencil = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4L16.5 4.5Z" />
  </Icon>
);

export const IconPhoto = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m21 15.5-5-4.5-6.5 6.5" />
  </Icon>
);

export const IconSticker = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M14.5 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h7a6.5 6.5 0 0 0 6.5-6.5v-4.5a6 6 0 0 0-6-6Z" />
    <path d="M14.5 3.5V9a2 2 0 0 0 2 2h4" />
    <path d="M8.5 14a3.5 3.5 0 0 0 5 0" />
  </Icon>
);

export const IconType = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6" />
  </Icon>
);

export const IconPaper = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M6 3.5h8.5L19 8v12.5H6z" />
    <path d="M14.5 3.5V8H19" />
    <path d="M9 12h6M9 15.5h4" />
  </Icon>
);

export const IconDrive = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z" />
    <path d="m10 13 2-2 2 2" />
  </Icon>
);

export const IconFrame = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <rect x="7" y="7" width="10" height="8" rx="1" />
    <path d="M9 17.5h6" />
  </Icon>
);

export const IconCopy = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M5.5 15.5h-1a1.5 1.5 0 0 1-1.5-1.5V5.5A1.5 1.5 0 0 1 4.5 4h8.5a1.5 1.5 0 0 1 1.5 1.5v1" />
  </Icon>
);

export const IconTrash = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2M7 7l1 12.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5L17 7" />
  </Icon>
);

export const IconRotateCcw = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4.5 10a7.5 7.5 0 1 1 1.7 7" />
    <path d="M4.5 5.5V10H9" />
  </Icon>
);

export const IconRotateCw = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M19.5 10a7.5 7.5 0 1 0-1.7 7" />
    <path d="M19.5 5.5V10H15" />
  </Icon>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconMinus = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const IconLayerUp = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="m12 5 7 4-7 4-7-4 7-4Z" />
    <path d="m5 14 7 4 7-4" />
  </Icon>
);

export const IconLayerDown = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="m5 10 7 4 7-4" />
    <path d="m12 11 7 4-7 4-7-4 7-4Z" />
  </Icon>
);

export const IconPanel = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M15 4v16" />
  </Icon>
);

export const IconReset = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.5" />
    <path d="M4 4.5v4h4" />
  </Icon>
);

export const IconLock = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="5" y="11" width="14" height="9.5" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);

export const IconGift = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <rect x="3.5" y="9" width="17" height="11" rx="2" />
    <path d="M12 9v11M3.5 13h17" />
    <path d="M12 9c-2 0-4-1.3-4-3s1.6-2.5 3-1.5C11.8 5.2 12 7 12 9Z" />
    <path d="M12 9c2 0 4-1.3 4-3s-1.6-2.5-3-1.5C12.2 5.2 12 7 12 9Z" />
  </Icon>
);

export const IconExternal = (p: SVGProps<SVGSVGElement>) => (
  <Icon {...p}>
    <path d="M14 4.5h5.5V10M10.5 13.5 19.5 4.5" />
    <path d="M18.5 14v4a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V7A1.5 1.5 0 0 1 6 5.5h4" />
  </Icon>
);

/** Mầm cây đung đưa: dùng cho trạng thái đang tải. */
export function Sprout({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`origin-bottom animate-sway ${className}`} aria-hidden>
      <path d="M24 44V22" stroke="#537255" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M24 31c-7.5 0-12.5-4.5-13.5-11.5 7.5 0 12.5 4.5 13.5 11.5Z" fill="#7c9f7a" />
      <path d="M24 25c1.5-7.5 6.5-11.5 13.5-11.5-1 7.5-6 11.5-13.5 11.5Z" fill="#99ba95" />
      <circle cx="24" cy="21" r="2.2" fill="#d48394" />
    </svg>
  );
}
