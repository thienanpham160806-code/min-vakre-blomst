"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { IconPlus } from "@/components/icons";
import { Label, Sheet } from "@/components/Sheet";
import { formatDateTime } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Coupon } from "@/lib/types";
import { useReady } from "@/lib/use-session";

const EMOJIS = ["🎟️", "🍲", "🧋", "🎡", "🎬", "💆", "🏆", "🍰", "🌹", "🚗", "😴", "🤗"];

export function Coupons() {
  const { me, partner } = useReady();
  const sb = supabaseBrowser();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(
    () =>
      sb
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false })
        .then(({ data }) => setCoupons((data as Coupon[]) ?? [])),
    [sb],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function redeem(c: Coupon) {
    if (!confirm(`Dùng phiếu “${c.title}” nha?`)) return;
    const res = await fetch("/api/coupons/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: c.id }),
    });
    const json = await res.json();
    if (!res.ok) {
      setToast(json.error ?? "Không dùng được phiếu");
      setTimeout(() => setToast(null), 3500);
      return;
    }
    setToast(json.mailed ? `Đã báo cho ${partner?.display_name ?? "người ấy"} rồi 💌` : "Đã dùng phiếu!");
    setTimeout(() => setToast(null), 3200);
    load();
  }

  const mine = coupons.filter((c) => c.created_by !== me.user_id);
  const given = coupons.filter((c) => c.created_by === me.user_id);

  return (
    <>
      <PageHeader
        title="Phiếu ưu đãi"
        subtitle="Xài là phải làm, không được kì kèo"
        right={
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <IconPlus width={17} height={17} />
            <span>Tặng phiếu</span>
          </button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">
        <section>
          <h2 className="section-title">Phiếu mình được tặng</h2>
          {mine.length === 0 && <p className="empty-note">Chưa có phiếu nào được tặng.</p>}
          <div className="space-y-3">
            {mine.map((c) => (
              <Ticket
                key={c.id}
                c={c}
                action={
                  !c.redeemed_at ? (
                    <button type="button" className="btn btn-primary min-h-10 px-4 py-1.5 text-sm" onClick={() => redeem(c)}>
                      Dùng
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">Phiếu mình đã tặng</h2>
          {given.length === 0 && <p className="empty-note">Tặng người ấy vài tấm phiếu dễ thương đi.</p>}
          <div className="space-y-3">
            {given.map((c) => (
              <Ticket
                key={c.id}
                c={c}
                action={
                  !c.redeemed_at ? (
                    <button
                      type="button"
                      className="btn btn-ghost min-h-9 px-3 py-1 text-xs text-ink-soft"
                      onClick={async () => {
                        if (confirm("Thu hồi phiếu này?")) {
                          await sb.from("coupons").delete().eq("id", c.id);
                          load();
                        }
                      }}
                    >
                      Thu hồi
                    </button>
                  ) : null
                }
              />
            ))}
          </div>
        </section>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-50 mx-auto w-fit max-w-sm rounded-full bg-ink px-4 py-2.5 text-center text-sm font-medium text-[var(--surface-paper)] shadow-lg animate-pop md:bottom-8"
        >
          {toast}
        </div>
      )}
      <NewCoupon open={adding} onClose={() => setAdding(false)} onSaved={load} />
    </>
  );
}

function Ticket({ c, action }: { c: Coupon; action: React.ReactNode }) {
  const used = Boolean(c.redeemed_at);
  return (
    <div
      className={`relative flex flex-wrap items-center gap-3.5 overflow-hidden rounded-2xl border-2 border-dashed p-4 transition sm:flex-nowrap ${
        used
          ? "border-[var(--border-soft)] bg-[var(--surface-muted)] opacity-75"
          : "border-blush-deep/40 bg-[var(--surface-paper)] shadow-[var(--shadow-paper)]"
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blush/35 text-3xl">
        {c.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-hand text-xl leading-tight text-ink">{c.title}</p>
        {c.description && <p className="mt-0.5 text-sm text-ink-soft">{c.description}</p>}
        {used && <p className="mt-1 text-xs text-ink-soft">Đã dùng lúc {formatDateTime(c.redeemed_at!)}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {used && (
        <span className="absolute right-3 top-2.5 rotate-6 rounded-md border-2 border-blush-deep px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-blush-deep">
          ĐÃ DÙNG
        </span>
      )}
    </div>
  );
}

function NewCoupon({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  async function save() {
    if (!title.trim()) return;
    await supabaseBrowser()
      .from("coupons")
      .insert({ title: title.trim(), description: description.trim() || null, emoji });
    setTitle("");
    setDescription("");
    onSaved();
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Tặng phiếu ưu đãi">
      <div className="space-y-4">
        <div>
          <Label>Biểu tượng trên phiếu</Label>
          <div className="flex flex-wrap gap-2 text-2xl">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={emoji === e}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition ${
                  emoji === e ? "border-blush-deep bg-blush/40" : "border-transparent bg-[var(--surface-elevated)]"
                }`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <Label>Phiếu gì?</Label>
          <input className="field" placeholder="Một buổi massage vai" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <Label>Điều kiện (tuỳ chọn)</Label>
          <input className="field" placeholder="Dùng bất cứ lúc nào" value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button type="button" className="btn btn-primary w-full" disabled={!title.trim()} onClick={save}>
          Tặng phiếu này 🎁
        </button>
      </div>
    </Sheet>
  );
}
