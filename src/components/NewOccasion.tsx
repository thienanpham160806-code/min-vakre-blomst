"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FLOWER_COLORS, FLOWER_KINDS, Flower } from "./Flower";
import { Label, Sheet } from "./Sheet";
import { supabaseBrowser } from "@/lib/supabase/client";
import { BACKGROUNDS } from "@/lib/backgrounds";
import type { Background, FlowerKind, Wish } from "@/lib/types";

export function NewOccasion({ open, onClose, wish }: { open: boolean; onClose: () => void; wish?: Wish }) {
  const router = useRouter();
  const [title, setTitle] = useState(wish?.title ?? "");
  const [date, setDate] = useState(() => (wish?.done_at ?? new Date().toISOString()).slice(0, 10));
  const [flower, setFlower] = useState<FlowerKind>("tulip");
  const [color, setColor] = useState(FLOWER_COLORS[0]);
  const [background, setBackground] = useState<Background>("kraft");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    const sb = supabaseBrowser();
    const row = { title: title.trim(), happened_on: date, flower, color, background };
    const { data, error } = wish
      ? await sb.rpc("plant_wish", { wish_id: wish.id, ...row })
      : await sb.from("occasions").insert(row).select("id").single();
    setBusy(false);
    if (error || !data) return setErr(error?.message ?? "Lỗi rồi");
    router.push(`/album/${wish ? data : data.id}`);
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
