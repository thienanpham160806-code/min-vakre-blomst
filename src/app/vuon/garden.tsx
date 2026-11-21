"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Flower, getFlowerMeta } from "@/components/Flower";
import { IconGift, IconPlus, Sprout } from "@/components/icons";
import { NewOccasion } from "@/components/NewOccasion";
import { supabaseBrowser } from "@/lib/supabase/client";
import { daysSince, formatDate, hash } from "@/lib/format";
import { useReady } from "@/lib/use-session";
import type { Occasion } from "@/lib/types";

export function Garden() {
  const { settings } = useReady();
  const [occasions, setOccasions] = useState<Occasion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supabaseBrowser()
      .from("occasions")
      .select("*")
      .order("happened_on", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setLoadError("Không tải được khu vườn. Thử tải lại trang nha.");
          setOccasions([]);
        } else {
          setOccasions((data as Occasion[]) ?? []);
        }
      });
  }, []);

  const subtitle = settings.together_since
    ? `Ngày thứ ${daysSince(settings.together_since).toLocaleString("vi-VN")} của tụi mình`
    : "Mỗi kỷ niệm là một bông hoa trong sổ tay";

  return (
    <>
      <PageHeader
        title="Khu vườn"
        subtitle={subtitle}
        maxWidth="max-w-5xl"
        right={
          <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
            <IconPlus width={17} height={17} />
            <span>Trồng hoa</span>
          </button>
        }
      />

      <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {occasions !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-paper)] px-3 py-1 text-xs font-medium text-ink-soft">
                <span className="h-2 w-2 rounded-full bg-sage" aria-hidden />
                {occasions.length === 0
                  ? "Chưa có bông hoa nào"
                  : `${occasions.length} bông hoa kỷ niệm`}
              </span>
            )}
            <Link
              href="/qua?replay=1"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-paper)] px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-[var(--border-strong)] hover:text-ink"
            >
              <IconGift width={14} height={14} className="text-blush-deep" />
              Mở lại quà sinh nhật
            </Link>
          </div>
          <p className="hidden font-hand text-base text-ink-soft sm:block">
            Chạm vào từng bông hoa để mở trang scrapbook
          </p>
        </div>

        {loadError && (
          <p role="alert" className="mb-3 rounded-2xl border border-blush-deep/30 bg-blush/30 px-4 py-3 text-sm text-blush-deep">
            {loadError}
          </p>
        )}

        {/* Khung vườn thực vật kiểu trang sổ tay minh họa */}
        <section
          aria-label="Luống hoa kỷ niệm"
          className="relative min-h-[58dvh] overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-gradient-to-b from-[var(--meadow-top)] via-[var(--meadow-mid)] to-[var(--meadow-bot)] px-3 pt-7 pb-14 shadow-[var(--shadow-paper)] sm:rounded-[34px] sm:px-6 sm:pt-10"
        >
          {/* Họa tiết góc sổ tay nhẹ */}
          <svg
            viewBox="0 0 180 90"
            className="pointer-events-none absolute right-3 top-2 w-32 opacity-20 sm:w-44"
            aria-hidden
          >
            <path d="M12 72 C 48 56, 98 28, 166 12" stroke="var(--botanical-main)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="64" cy="44" rx="14" ry="6" fill="var(--botanical-main)" transform="rotate(-28 64 44)" />
            <ellipse cx="104" cy="36" rx="14" ry="6" fill="var(--botanical-main)" transform="rotate(14 104 36)" />
            <ellipse cx="136" cy="20" rx="11" ry="5" fill="var(--accent-main)" transform="rotate(-22 136 20)" />
          </svg>

          {/* Đồi cỏ mềm phía sau */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-45"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 22% 100%, var(--meadow-grass), transparent 72%), radial-gradient(ellipse 75% 90% at 82% 100%, var(--meadow-grass), transparent 72%)",
            }}
            aria-hidden
          />

          {occasions === null ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Sprout className="h-14 w-14" />
              <p className="font-hand text-lg text-ink-soft">Đang tưới nước cho khu vườn…</p>
            </div>
          ) : occasions.length === 0 ? (
            <div className="relative z-10 flex flex-col items-center px-4 py-16 text-center">
              <Sprout className="h-20 w-20" />
              <p className="mt-4 font-script text-3xl text-ink">Khu vườn đang đợi bông hoa đầu tiên</p>
              <p className="mt-1.5 max-w-xs font-hand text-lg text-ink-soft">
                Mỗi dịp tụi mình bên nhau sẽ mọc thành một bông hoa riêng, mở ra một trang sổ dán ảnh và lời nhắn.
              </p>
              <button type="button" className="btn btn-primary mt-6" onClick={() => setAdding(true)}>
                <IconPlus width={17} height={17} /> Trồng bông đầu tiên
              </button>
            </div>
          ) : (
            <ul className="relative z-10 grid grid-cols-2 gap-x-3 gap-y-7 pb-8 min-[460px]:grid-cols-3 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-5">
              {occasions.map((o) => {
                const r = hash(o.id);
                const meta = getFlowerMeta(o.flower);
                // Kết hợp chiều cao tự nhiên của từng loài hoa với chút ngẫu nhiên hữu cơ
                const visualHeight = Math.round(meta.defaultStem * 0.92 + r * 26);
                const stemProp = Math.round(meta.defaultStem + (r - 0.5) * 16);
                return (
                  <li
                    key={o.id}
                    className="flex flex-col items-center justify-end"
                    style={{ paddingTop: `${Math.round(r * 22)}px` }}
                  >
                    <Link
                      href={`/album/${o.id}`}
                      className="group flex w-full max-w-[10.5rem] flex-col items-center rounded-2xl p-1.5 transition-transform duration-200 hover:-translate-y-1 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-deep"
                    >
                      <div
                        className="relative flex items-end justify-center origin-bottom animate-sway"
                        style={{ animationDelay: `${(r * 3.4).toFixed(2)}s`, height: `${visualHeight}px` }}
                      >
                        <Flower
                          kind={o.flower}
                          color={o.color}
                          stem={stemProp}
                          className="h-full w-auto drop-shadow-[0_6px_8px_rgba(40,56,38,0.16)] transition-transform duration-200 group-hover:scale-[1.04]"
                        />
                      </div>

                      {/* Thẻ giấy cài kỷ niệm bên dưới hoa */}
                      <span className="relative mt-1.5 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-paper)]/94 px-2.5 py-1.5 text-center shadow-[0_6px_14px_-10px_rgba(42,32,26,0.38)] transition-colors group-hover:border-blush-deep/45">
                        <span
                          className="mx-auto mb-1 block h-1 w-6 rounded-full opacity-60"
                          style={{ backgroundColor: o.color }}
                          aria-hidden
                        />
                        <span className="block truncate font-hand text-base leading-tight text-ink sm:text-[17px]">
                          {o.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-medium text-ink-soft">
                          {formatDate(o.happened_on)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Viền cỏ thủ công dưới chân vườn */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-[var(--meadow-grass)] opacity-85"
            style={{
              clipPath:
                "polygon(0 45%, 6% 8%, 12% 48%, 19% 12%, 26% 52%, 34% 4%, 42% 48%, 50% 10%, 58% 52%, 66% 5%, 74% 48%, 82% 12%, 90% 50%, 96% 14%, 100% 42%, 100% 100%, 0 100%)",
            }}
            aria-hidden
          />
        </section>
      </div>

      <NewOccasion open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
