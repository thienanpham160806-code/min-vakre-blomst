"use client";

import Link from "next/link";
import { Flower } from "@/components/Flower";
import { IconGift } from "@/components/icons";
import { useUnlock } from "@/lib/use-unlock";
import type { FlowerKind } from "@/lib/types";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    ngày: Math.floor(s / 86400),
    giờ: Math.floor((s % 86400) / 3600),
    phút: Math.floor((s % 3600) / 60),
    giây: s % 60,
  };
}

/** Hiển thị đúng mốc máy chủ ngay cả khi đồng hồ thiết bị bị lệch. */
function unlockLabel(unlockAt: string) {
  const at = new Date(unlockAt);
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(at);
}

const STAR_POINTS = [
  { left: "12%", top: "18%", delay: "0s" },
  { left: "26%", top: "30%", delay: "0.9s" },
  { left: "78%", top: "22%", delay: "1.6s" },
  { left: "88%", top: "36%", delay: "0.4s" },
  { left: "64%", top: "14%", delay: "2.1s" },
  { left: "18%", top: "52%", delay: "1.3s" },
];

export function Countdown() {
  const { left, unlockAt } = useUnlock();
  if (left === null) {
    return (
      <div className="relative z-10 flex flex-col items-center gap-3 text-center animate-fade">
        <p className="font-script text-4xl text-[#f6efe4]">min vakre blomst</p>
        <p className="font-hand text-lg text-[#f6efe4]/75">Đang đồng bộ giờ mở quà…</p>
      </div>
    );
  }
  const opened = left <= 0;

  return (
    <>
      {/* Bụi sao nhẹ nhàng */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {STAR_POINTS.map((p, idx) => (
          <span
            key={idx}
            className="animate-twinkle absolute h-1.5 w-1.5 rounded-full bg-[#fae8c8]"
            style={{ left: p.left, top: p.top, animationDelay: p.delay }}
          />
        ))}
      </div>

      <FloatingFlowers bloomed={opened} />

      <div className="relative z-10 mb-20 flex w-full max-w-md flex-col items-center text-center animate-pop sm:mb-24">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3.5 py-1 text-xs font-medium tracking-wide text-[#f4e4d7]">
          Khu vườn kỷ niệm nhỏ của hai đứa
        </span>
        <h1 className="font-script text-5xl leading-tight text-[#fffaf2] sm:text-6xl">
          min vakre blomst
        </h1>

        {!opened ? (
          <>
            <p className="mt-2.5 font-hand text-xl text-[#f4e8dc]/80">có một khu vườn đang chờ tới giờ nở hoa…</p>
            <div
              className="mt-8 grid w-full max-w-sm grid-cols-4 gap-2 sm:gap-3.5"
              role="timer"
              aria-live="off"
              aria-label="Đồng hồ đếm ngược tới giờ mở quà"
            >
              {Object.entries(parts(left)).map(([label, v]) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-2xl border border-white/14 bg-white/[0.08] px-1.5 py-3.5 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:py-4"
                >
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-[#fffaf2] min-[360px]:text-3xl sm:text-4xl">
                    {String(v).padStart(2, "0")}
                  </span>
                  <span className="mt-1 font-hand text-sm text-[#e8dcd0]/80 sm:text-base">{label}</span>
                </div>
              ))}
            </div>
            {unlockAt && (
              <p className="mt-5 rounded-full border border-white/12 bg-white/6 px-4 py-1.5 font-hand text-base text-[#f0e3d5]/85">
                Mở khóa lúc {unlockLabel(unlockAt)}
              </p>
            )}
          </>
        ) : (
          <div className="mt-4 flex flex-col items-center animate-bloom">
            <p className="font-hand text-2xl text-[#f7dde4]">hoa trong vườn nở hết rồi 🌷</p>
            <p className="mt-1 max-w-xs text-sm text-[#e8dcd0]/80">
              Có một phong bì nhỏ cùng khu vườn kỷ niệm đang chờ bạn mở ra.
            </p>
            <Link
              href="/qua"
              className="btn mt-8 min-h-12 bg-[#df859c] px-7 text-base font-semibold text-[#1c1622] shadow-[0_12px_30px_-10px_rgba(223,133,156,0.75)] hover:bg-[#ec99ae]"
            >
              <IconGift width={19} height={19} />
              <span>Mở quà ngay</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

const BLOOM_ROW: { kind: FlowerKind; color: string; hClosed: number; hOpen: number; stem: number }[] = [
  { kind: "lavender", color: "#b69fe0", hClosed: 82, hOpen: 174, stem: 136 },
  { kind: "tulip", color: "#e898aa", hClosed: 74, hOpen: 150, stem: 118 },
  { kind: "daisy", color: "#f2b8c6", hClosed: 68, hOpen: 138, stem: 108 },
  { kind: "peony", color: "#e68ea3", hClosed: 86, hOpen: 168, stem: 118 },
  { kind: "rose", color: "#d46a7d", hClosed: 80, hOpen: 162, stem: 124 },
  { kind: "sunflower", color: "#f0c057", hClosed: 90, hOpen: 184, stem: 142 },
  { kind: "poppy", color: "#e98a6f", hClosed: 76, hOpen: 152, stem: 128 },
  { kind: "camellia", color: "#e599ab", hClosed: 72, hOpen: 142, stem: 106 },
];

function FloatingFlowers({ bloomed }: { bloomed: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center gap-0.5 overflow-hidden px-2 sm:gap-2.5">
      {BLOOM_ROW.map((f, i) => (
        <div
          key={f.kind}
          className="origin-bottom animate-sway transition-[height,opacity,transform] duration-1000 ease-out"
          style={{
            animationDelay: `${i * 0.35}s`,
            height: `${bloomed ? f.hOpen : f.hClosed}px`,
            opacity: bloomed ? 0.96 : 0.56,
            transform: bloomed ? "translateY(0)" : "translateY(14px)",
          }}
        >
          <Flower kind={f.kind} color={f.color} stem={f.stem} className="h-full w-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]" />
        </div>
      ))}
    </div>
  );
}
