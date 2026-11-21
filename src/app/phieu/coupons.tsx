"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Label, Sheet } from "@/components/Sheet";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/format";
import { useReady } from "@/lib/use-session";
import type { Coupon } from "@/lib/types";

const EMOJIS = ["🎟️", "🍲", "🧋", "🎡", "🎬", "💆", "🏆", "🍰", "🌹", "🚗", "😴", "🤗"];

export function Coupons() {
  const { me, partner } = useReady();
  const sb = supabaseBrowser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(
    () => sb.from("coupons").select("*").order("created_at", { ascending: false }).then(({ data }) => setCoupons((data as Coupon[]) ?? [])),
    [sb],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function redeem(c: Coupon) {
    if (!confirm(`Dùng phiếu “${c.title}” nha?`)) return;
    const res = await fetch("/api/coupons/redeem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: c.id }) });
    const json = await res.json();
    if (!res.ok) return alert(json.error);
    setToast(json.mailed ? `Đã báo cho ${partner?.display_name ?? "người ấy"} rồi 💌` : "Đã dùng phiếu!");
    setTimeout(() => setToast(null), 3000);
    load();
  }

  const mine = coupons.filter((c) => c.created_by !== me.user_id);
  const given = coupons.filter((c) => c.created_by === me.user_id);

  return (
    <>
      <PageHeader title="Phiếu ưu đãi" subtitle="Xài là phải làm, không được kì kèo" right={<button className="btn btn-primary" onClick={() => setAdding(true)}>+ Tặng phiếu</button>} />

      <div className="mx-auto max-w-2xl space-y-8 px-5">
        <section>
          <h2 className="section-title">Phiếu mình được tặng</h2>
          {mine.length === 0 && <p className="empty-note">Chưa có phiếu nào.</p>}
          <div className="space-y-3">
            {mine.map((c) => (
              <Ticket key={c.id} c={c} action={!c.redeemed_at ? <button className="btn btn-primary px-4 py-2 text-sm" onClick={() => redeem(c)}>Dùng</button> : null} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="section-title">Phiếu mình đã tặng</h2>
          {given.length === 0 && <p className="empty-note">Tặng người ấy vài phiếu đi.</p>}
          <div className="space-y-3">
            {given.map((c) => (
              <Ticket
                key={c.id}
                c={c}
                action={
                  !c.redeemed_at ? (
                    <button className="text-sm text-ink-soft" onClick={async () => { if (confirm("Thu hồi phiếu này?")) { await sb.from("coupons").delete().eq("id", c.id); load(); } }}>
                      Thu hồi
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
        </section>
      </div>

      {toast && <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-sm text-white animate-pop">{toast}</div>}
      <NewCoupon open={adding} onClose={() => setAdding(false)} onSaved={load} />
    </>
  );
}

function Ticket({ c, action }: { c: Coupon; action: React.ReactNode }) {
  const used = Boolean(c.redeemed_at);
  return (
    <div className={`relative flex items-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed p-4 ${used ? "border-ink/15 bg-ink/5 opacity-70" : "border-blush-deep/40 bg-[#fff6e0]"}`}>
      <span className="text-4xl">{c.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="font-hand text-xl leading-tight">{c.title}</p>
        {c.description && <p className="text-sm text-ink-soft">{c.description}</p>}
        {used && <p className="mt-1 text-xs text-ink-soft">Đã dùng lúc {formatDateTime(c.redeemed_at!)}</p>}
      </div>
      {action}
      {used && <span className="absolute right-3 top-2 rotate-12 rounded border-2 border-blush-deep px-1 text-xs font-bold text-blush-deep">ĐÃ DÙNG</span>}
    </div>
  );
}

function NewCoupon({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  async function save() {
    if (!title.trim()) return;
    await supabaseBrowser().from("coupons").insert({ title: title.trim(), description: description.trim() || null, emoji });
    setTitle("");
    setDescription("");
    onSaved();
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Tặng phiếu">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-2xl">
          {EMOJIS.map((e) => (
            <button key={e} className={`rounded-xl p-1 ${emoji === e ? "bg-blush/40" : ""}`} onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>
        <label className="block"><Label>Phiếu gì?</Label><input className="field" placeholder="Một buổi massage vai" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block"><Label>Điều kiện (tuỳ chọn)</Label><input className="field" placeholder="Dùng bất cứ lúc nào" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <button className="btn btn-primary w-full" onClick={save}>Tặng 🎁</button>
      </div>
    </Sheet>
  );
}
