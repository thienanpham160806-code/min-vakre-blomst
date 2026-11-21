"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Flower } from "@/components/Flower";
import { NewOccasion } from "@/components/NewOccasion";
import { supabaseBrowser } from "@/lib/supabase/client";
import { daysSince, formatDate, hash } from "@/lib/format";
import { useReady } from "@/lib/use-session";
import type { Occasion } from "@/lib/types";



export function Garden() {
  const { settings } = useReady();
  const [occasions, setOccasions] = useState<Occasion[] | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supabaseBrowser()
      .from("occasions")
      .select("*")
      .order("happened_on", { ascending: true })
      .then(({ data }) => setOccasions((data as Occasion[]) ?? []));
  }, []);

  const subtitle = settings.together_since
    ? `Ngày thứ ${daysSince(settings.together_since).toLocaleString("vi-VN")} của tụi mình`
    : "Mỗi kỷ niệm là một bông hoa";

  return (
    <>
      <PageHeader
        title="Khu vườn"
        subtitle={subtitle}
        right={<button className="btn btn-primary" onClick={() => setAdding(true)}>+ Trồng hoa</button>}
      />

      <div className="mx-auto max-w-2xl px-5 pb-3"><Link href="/qua?replay=1" className="text-sm underline text-ink-soft">Mở lại quà sinh nhật 🎁</Link></div>
      <section className="relative mx-auto min-h-[60dvh] max-w-2xl overflow-hidden rounded-t-[40px] bg-gradient-to-b from-[#eaf4e6] to-[#cfe3c7] px-3 pt-8">
        {occasions === null ? (
          <p className="py-20 text-center text-3xl">🌱</p>
        ) : occasions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-hand text-xl text-ink-soft">Vườn còn trống. Trồng bông hoa đầu tiên nha.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-x-2 gap-y-6 pb-16 sm:grid-cols-4">
            {occasions.map((o) => {
              const r = hash(o.id);
              return (
                <li key={o.id} className="flex flex-col items-center" style={{ marginTop: `${Math.round(r * 30)}px` }}>
                  <Link href={`/album/${o.id}`} className="flex flex-col items-center active:scale-95 transition">
                    <div className="origin-bottom animate-sway" style={{ animationDelay: `${r * 3}s`, height: `${110 + Math.round(r * 50)}px` }}>
                      <Flower kind={o.flower} color={o.color} className="h-full w-auto drop-shadow-sm" />
                    </div>
                    <span className="mt-1 max-w-[7.5rem] rounded-lg bg-white/80 px-2 py-1 text-center leading-tight shadow-sm">
                      <span className="block font-hand text-base">{o.title}</span>
                      <span className="block text-[11px] text-ink-soft">{formatDate(o.happened_on)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-[#b5d3a8]" style={{ clipPath: "polygon(0 40%, 8% 0, 16% 45%, 25% 5%, 34% 50%, 43% 0, 52% 45%, 61% 5%, 70% 50%, 79% 0, 88% 45%, 100% 10%, 100% 100%, 0 100%)" }} />
      </section>

      <NewOccasion open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

