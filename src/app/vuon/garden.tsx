"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { FLOWER_COLORS, FLOWER_KINDS, Flower } from "@/components/Flower";
import { Label, Sheet } from "@/components/Sheet";
import { supabaseBrowser } from "@/lib/supabase/client";
import { daysSince, formatDate, hash } from "@/lib/format";
import { useReady } from "@/lib/use-session";
import { BACKGROUNDS } from "@/lib/backgrounds";
import type { Background, FlowerKind, Occasion } from "@/lib/types";



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

function NewOccasion({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [flower, setFlower] = useState<FlowerKind>("tulip");
  const [color, setColor] = useState(FLOWER_COLORS[0]);
  const [background, setBackground] = useState<Background>("kraft");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabaseBrowser()
      .from("occasions")
      .insert({ title: title.trim(), happened_on: date, flower, color, background })
      .select("id")
      .single();
    setBusy(false);
    if (error || !data) return setErr(error?.message ?? "Lỗi rồi");
    router.push(`/album/${data.id}`);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Trồng hoa mới">
      <form onSubmit={save} className="space-y-4">
        <label className="block">
          <Label>Dịp gì nè?</Label>
          <input className="field" placeholder="Sinh nhật 2027, Đi Đà Lạt…" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block">
          <Label>Ngày</Label>
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <div>
          <Label>Loại hoa</Label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FLOWER_KINDS.map((f) => (
              <button type="button" key={f.kind} onClick={() => setFlower(f.kind)} className={`flex w-16 shrink-0 flex-col items-center rounded-2xl border-2 p-1 text-xs ${flower === f.kind ? "border-blush-deep" : "border-transparent"}`}>
                <Flower kind={f.kind} color={color} stem={60} className="h-16 w-auto" />
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Màu hoa</Label>
          <div className="flex gap-2">
            {FLOWER_COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setColor(c)} className={`h-9 w-9 rounded-full border-4 ${color === c ? "border-ink/40" : "border-white"}`} style={{ background: c }} aria-label={c} />
            ))}
          </div>
        </div>
        <div>
          <Label>Nền trang album</Label>
          <div className="grid grid-cols-5 gap-2">
            {BACKGROUNDS.map((b) => (
              <button type="button" key={b.value} onClick={() => setBackground(b.value)} className={`flex flex-col items-center gap-1 text-[11px]`}>
                <span className={`bg-${b.value} h-12 w-full rounded-xl border-2 ${background === b.value ? "border-blush-deep" : "border-ink/10"}`} />
                {b.label}
              </button>
            ))}
          </div>
        </div>
        {err && <p className="text-sm text-blush-deep">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Đang trồng…" : "Trồng & mở album"}</button>
      </form>
    </Sheet>
  );
}
