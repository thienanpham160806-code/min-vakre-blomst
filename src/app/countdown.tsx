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

export function Countdown() {
  const left = useUnlock();
  if (left === null) return <p>Đang đồng bộ giờ mở quà…</p>;
  const opened = left <= 0;

  return (
    <>
      <FloatingFlowers bloomed={opened} />
      <div className="relative z-10 flex flex-col items-center text-center animate-pop">
        <h1 className="font-script text-5xl sm:text-6xl">min vakre blomst</h1>

        {!opened ? (
          <>
            <p className="mt-3 font-hand text-lg text-white/70">có một thứ đang chờ nở…</p>
            <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-5">
              {Object.entries(parts(left)).map(([label, v]) => (
                <div key={label} className="flex w-16 flex-col items-center rounded-2xl bg-white/10 py-3 backdrop-blur sm:w-20">
                  <span className="text-3xl font-semibold tabular-nums sm:text-4xl">{String(v).padStart(2, "0")}</span>
                  <span className="text-xs text-white/60">{label}</span>
                </div>
              ))}
            </div>
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
            height: bloomed ? `${140 + (i % 3) * 40}px` : `${40 + (i % 3) * 14}px`,
            opacity: bloomed ? 1 : 0.35,
          }}
        >
          <Flower kind={k} color={colors[i]} className="h-full w-auto" />
        </div>
      ))}
    </div>
  );
}
