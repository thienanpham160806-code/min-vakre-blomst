"use client";

import Link from "next/link";
import { useUnlock } from "@/lib/use-unlock";
import { Flower } from "@/components/Flower";



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
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "numeric", month: "long" }).format(at);
}

export function Countdown() {
  const { left, unlockAt } = useUnlock();
  if (left === null) return <p className="font-hand text-lg text-white/70 animate-fade">Đang đồng bộ giờ mở quà…</p>;
  const opened = left <= 0;

  return (
    <>
      <FloatingFlowers bloomed={opened} />
      <div className="relative z-10 flex flex-col items-center text-center animate-pop">
        <h1 className="font-script text-5xl sm:text-6xl">min vakre blomst</h1>

        {!opened ? (
          <>
            <p className="mt-3 font-hand text-lg text-white/70">có một thứ đang chờ nở…</p>
            <div className="mt-10 grid grid-cols-4 gap-2.5 sm:gap-4" role="timer" aria-live="off">
              {Object.entries(parts(left)).map(([label, v]) => (
                <div key={label} className="flex w-14 min-[360px]:w-16 flex-col items-center rounded-2xl bg-white/[0.07] py-3.5 ring-1 ring-inset ring-white/10 sm:w-20">
                  <span className="text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">{String(v).padStart(2, "0")}</span>
                  <span className="mt-0.5 font-hand text-sm text-white/65">{label}</span>
                </div>
              ))}
            </div>
            {unlockAt && <p className="mt-6 font-hand text-base text-white/60">{unlockLabel(unlockAt)}</p>}
          </>
        ) : (
          <>
            <p className="mt-3 font-hand text-xl text-white/80">hoa nở rồi 🌷</p>
            <Link href="/qua" className="btn btn-primary mt-10 text-lg">Mở quà</Link>
          </>
        )}
      </div>
    </>
  );
}

function FloatingFlowers({ bloomed }: { bloomed: boolean }) {
  const kinds = ["tulip", "daisy", "rose", "lavender", "sunflower", "tulip", "daisy"] as const;
  const colors = ["#f7a8c4", "#e0708f", "#f6c453", "#b9a3e3", "#ff9f80", "#f7a8c4", "#9ad0ec"];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center gap-1 sm:gap-4">
      {kinds.map((k, i) => (
        <div
          key={i}
          className="origin-bottom animate-sway transition-all duration-1000"
          style={{
            animationDelay: `${i * 0.4}s`,
            height: bloomed ? `${140 + (i % 3) * 40}px` : `${72 + (i % 3) * 18}px`,
            opacity: bloomed ? 1 : 0.5,
          }}
        >
          <Flower kind={k} color={colors[i]} className="h-full w-auto" />
        </div>
      ))}
    </div>
  );
}
