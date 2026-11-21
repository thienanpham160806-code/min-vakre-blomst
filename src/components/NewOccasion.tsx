"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FLOWER_COLOR_PALETTE, FLOWER_KINDS, Flower, getFlowerMeta } from "./Flower";
import { IconCheck, IconReset } from "./icons";
import { Label, Sheet } from "./Sheet";
import { supabaseBrowser } from "@/lib/supabase/client";
import {
  BACKGROUND_GROUPS,
  BACKGROUNDS,
  DEFAULT_BACKGROUND,
  LEGACY_BACKGROUNDS,
  LEGACY_FLOWERS,
  backgroundClass,
  getBackgroundMeta,
  type BackgroundGroup,
} from "@/lib/backgrounds";
import { formatDate } from "@/lib/format";
import type { Background, FlowerKind, Wish } from "@/lib/types";

const DEFAULT_FLOWER: FlowerKind = "tulip";
const DEFAULT_COLOR = FLOWER_COLOR_PALETTE[0].hex;

export function NewOccasion({ open, onClose, wish }: { open: boolean; onClose: () => void; wish?: Wish }) {
  const router = useRouter();
  const [title, setTitle] = useState(wish?.title ?? "");
  const [date, setDate] = useState(() =>
    new Date(new Date(wish?.done_at ?? Date.now()).getTime() + 7 * 3600_000).toISOString().slice(0, 10),
  );
  const [flower, setFlower] = useState<FlowerKind>(DEFAULT_FLOWER);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [background, setBackground] = useState<Background>(DEFAULT_BACKGROUND);
  const [bgGroup, setBgGroup] = useState<"all" | BackgroundGroup>("all");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedFlowerMeta = getFlowerMeta(flower);
  const selectedBgMeta = getBackgroundMeta(background);
  const filteredBackgrounds =
    bgGroup === "all" ? BACKGROUNDS : BACKGROUNDS.filter((b) => b.group === bgGroup);

  function resetDefaults() {
    setFlower(DEFAULT_FLOWER);
    setColor(DEFAULT_COLOR);
    setBackground(DEFAULT_BACKGROUND);
    setBgGroup("all");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    const sb = supabaseBrowser();
    const row = { title: title.trim(), happened_on: date, flower, color, background };

    if (wish) {
      let { data, error } = await sb.rpc("plant_wish", { wish_id: wish.id, ...row });
      // Tương thích ngược nếu Supabase thật mới chạy tới migration 0002 (chưa chạy 0003)
      if (error && error.message.includes("không hợp lệ") && (!LEGACY_FLOWERS.has(flower) || !LEGACY_BACKGROUNDS.has(background))) {
        const fallback = await sb.rpc("plant_wish", {
          wish_id: wish.id,
          title: row.title,
          happened_on: row.happened_on,
          flower: LEGACY_FLOWERS.has(flower) ? flower : "tulip",
          color: row.color,
          background: LEGACY_BACKGROUNDS.has(background) ? background : "kraft",
        });
        data = fallback.data;
        error = fallback.error;
        if (!error && data) {
          await sb.from("occasions").update({ flower, background }).eq("id", data);
        }
      }
      setBusy(false);
      if (error || !data) return setErr(error?.message ?? "Không trồng được hoa, thử lại nha.");
      router.push(`/album/${data}`);
      return;
    }

    const { data, error } = await sb.from("occasions").insert(row).select("id").single();
    setBusy(false);
    if (error || !data) return setErr(error?.message ?? "Không trồng được hoa, thử lại nha.");
    router.push(`/album/${data.id}`);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Trồng hoa mới"
      subtitle="Chọn dáng hoa, sắc cánh và mẫu giấy mở đầu cho album kỷ niệm"
      maxWidth="max-w-xl"
    >
      <form onSubmit={save} className="space-y-5">
        {/* Bản xem trước trực tiếp bông hoa + thẻ kỷ niệm + giấy */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-gradient-to-b from-[var(--meadow-top)] via-[var(--meadow-mid)] to-[var(--meadow-bot)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-paper)]/85 px-2.5 py-0.5 text-[11px] font-semibold text-ink-soft">
                Xem trước trong vườn
              </span>
              <p className="truncate font-hand text-2xl leading-tight text-ink">
                {title.trim() || "Tên kỷ niệm của hai đứa"}
              </p>
              <p className="text-xs text-ink-soft">
                {date ? formatDate(date) : "Chưa chọn ngày"} · {selectedFlowerMeta.label} · {selectedBgMeta.label}
              </p>
              <button
                type="button"
                onClick={resetDefaults}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blush-deep underline decoration-blush-deep/40 hover:decoration-blush-deep"
              >
                <IconReset width={13} height={13} /> Về lựa chọn mặc định
              </button>
            </div>

            <div className="relative flex shrink-0 items-end gap-2">
              <div className="origin-bottom animate-sway">
                <Flower kind={flower} color={color} stem={Math.round(selectedFlowerMeta.defaultStem * 0.78)} className="h-28 w-auto drop-shadow-sm" />
              </div>
              <div
                className={`${backgroundClass(background)} mb-2 h-14 w-11 shrink-0 rounded-lg border-2 border-white shadow-md`}
                title={`Giấy: ${selectedBgMeta.label}`}
                aria-hidden
              />
            </div>
          </div>
        </div>

        {/* Tên & Ngày */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_11.5rem]">
          <label className="block">
            <Label>Dịp gì nè?</Label>
            <input
              className="field"
              placeholder="Sinh nhật 2027, Đi Đà Lạt…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <Label>Ngày kỷ niệm</Label>
            <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        {/* 8 Loại hoa */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <Label>Loại hoa ({FLOWER_KINDS.length} loài)</Label>
            <span className="text-xs text-ink-soft">{selectedFlowerMeta.note}</span>
          </div>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Chọn loại hoa">
            {FLOWER_KINDS.map((f) => {
              const active = flower === f.kind;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  key={f.kind}
                  onClick={() => setFlower(f.kind)}
                  className={`relative flex flex-col items-center rounded-2xl border-2 px-1 py-2 text-center transition ${
                    active
                      ? "border-blush-deep bg-blush/45 text-ink shadow-xs"
                      : "border-[var(--border-soft)] bg-[var(--surface-paper)] text-ink-soft hover:border-[var(--border-strong)] hover:text-ink"
                  }`}
                >
                  {active && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blush-deep text-white">
                      <IconCheck width={10} height={10} strokeWidth={2.7} />
                    </span>
                  )}
                  <Flower kind={f.kind} color={color} stem={76} className="h-14 w-auto" />
                  <span className="mt-1 truncate max-w-full text-[11px] font-semibold leading-tight">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 8 Sắc màu hoa phối sẵn */}
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <Label>Màu cánh hoa</Label>
            <span className="text-xs text-ink-soft">
              {FLOWER_COLOR_PALETTE.find((c) => c.hex === color)?.label ?? "Tùy chọn"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Chọn màu hoa">
            {FLOWER_COLOR_PALETTE.map((c) => {
              const active = color === c.hex;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    active ? "scale-105 border-ink ring-2 ring-blush-deep/40 ring-offset-2 ring-offset-[var(--surface-paper)]" : "border-[var(--border-strong)]"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.label}
                  title={c.label}
                >
                  {active && (
                    <IconCheck
                      width={16}
                      height={16}
                      strokeWidth={2.6}
                      className={c.hex === "#efe3ce" || c.hex === "#f2a7bc" ? "text-[#332723]" : "text-white"}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 12 Mẫu giấy scrapbook có tab lọc + thumbnail thật */}
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <Label>Giấy trang scrapbook ({BACKGROUNDS.length} mẫu)</Label>
            <span className="text-xs text-ink-soft">{selectedBgMeta.label}</span>
          </div>
          <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Nhóm giấy">
            {BACKGROUND_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                role="tab"
                aria-selected={bgGroup === g.id}
                onClick={() => setBgGroup(g.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  bgGroup === g.id
                    ? "border-blush-deep bg-blush-deep text-[var(--accent-on)]"
                    : "border-[var(--border-soft)] bg-[var(--surface-elevated)] text-ink-soft hover:text-ink"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Chọn giấy trang scrapbook">
            {filteredBackgrounds.map((b) => {
              const active = background === b.value;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  key={b.value}
                  onClick={() => setBackground(b.value)}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 text-center transition ${
                    active
                      ? "border-blush-deep bg-blush/35 text-ink"
                      : "border-[var(--border-soft)] bg-[var(--surface-paper)] text-ink-soft hover:border-[var(--border-strong)]"
                  }`}
                >
                  <span className={`${backgroundClass(b.value)} relative h-12 w-full rounded-lg border border-black/10`}>
                    {active && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blush-deep text-white shadow">
                        <IconCheck width={10} height={10} strokeWidth={2.7} />
                      </span>
                    )}
                  </span>
                  <span className="truncate max-w-full text-[11px] font-medium leading-tight">{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {err && (
          <p role="alert" className="rounded-xl border border-blush-deep/30 bg-blush/30 px-3 py-2 text-sm text-blush-deep">
            {err}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={onClose}>
            Để sau
          </button>
          <button type="submit" className="btn btn-primary flex-1" disabled={busy}>
            {busy ? "Đang trồng…" : "Trồng & mở album"}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
