"use client";

import { DEFAULT_THEME, THEMES, useTheme } from "@/lib/themes";
import type { ThemeId } from "@/lib/types";
import { IconCheck, IconReset } from "./icons";
import { Sheet } from "./Sheet";

/** Bộ chọn 6 theme có bản xem thử trước khi áp dụng + tùy chọn giảm chuyển động. */
export function ThemePickerContent({ onApplied }: { onApplied?: () => void }) {
  const { theme, preview, activeTheme, motion, setPreview, applyTheme, resetTheme, setMotion } = useTheme();
  const pending = preview && preview !== theme ? preview : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Chọn một bảng màu để xem thử ngay trên giao diện. Giấy của từng trang scrapbook vẫn được chọn riêng theo từng kỷ niệm.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Chọn bảng màu giao diện">
        {THEMES.map((item) => {
          const isSaved = theme === item.id;
          const isActive = activeTheme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setPreview(item.id === theme ? null : item.id)}
              className={`group relative flex flex-col rounded-2xl border-2 p-2.5 text-left transition ${
                isActive
                  ? "border-blush-deep bg-[var(--surface-elevated)] shadow-sm ring-2 ring-blush-deep/20"
                  : "border-[var(--border-soft)] bg-[var(--surface-paper)] hover:border-[var(--border-strong)]"
              }`}
            >
              {/* Bản xem trước thu nhỏ */}
              <div
                className="relative mb-2.5 h-16 w-full overflow-hidden rounded-xl border border-black/10 p-2"
                style={{ backgroundColor: item.swatches.canvas }}
              >
                <div
                  className="flex h-full flex-col justify-between rounded-lg p-1.5 shadow-sm"
                  style={{ backgroundColor: item.swatches.surface }}
                >
                  <div className="flex items-center justify-between">
                    <span className="h-1.5 w-10 rounded-full" style={{ backgroundColor: item.swatches.ink, opacity: 0.72 }} />
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.swatches.botanical }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-10 rounded-full" style={{ backgroundColor: item.swatches.accent }} />
                    <span className="h-2 w-6 rounded-full" style={{ backgroundColor: item.swatches.botanical, opacity: 0.65 }} />
                  </div>
                </div>
                {isActive && (
                  <span
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow"
                    style={{ backgroundColor: item.swatches.accent, color: item.isDark ? "#1a151e" : "#ffffff" }}
                  >
                    <IconCheck width={12} height={12} strokeWidth={2.5} />
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-semibold text-ink">{item.name}</span>
                {isSaved && (
                  <span className="rounded-full bg-sage-soft px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                    Đang dùng
                  </span>
                )}
                {!isSaved && isActive && (
                  <span className="rounded-full bg-blush px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                    Xem thử
                  </span>
                )}
              </div>
              <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-soft">{item.note}</span>
            </button>
          );
        })}
      </div>

      {/* Thanh áp dụng / quay về mặc định */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] p-3">
        <div className="text-xs text-ink-soft">
          {pending ? (
            <span>
              Đang xem thử <strong className="text-ink">{THEMES.find((t) => t.id === pending)?.name}</strong>
            </span>
          ) : (
            <span>
              Đang áp dụng <strong className="text-ink">{THEMES.find((t) => t.id === theme)?.name}</strong>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pending && (
            <>
              <button
                type="button"
                className="btn btn-ghost min-h-9 px-3 py-1.5 text-xs"
                onClick={() => setPreview(null)}
              >
                Hủy xem thử
              </button>
              <button
                type="button"
                className="btn btn-primary min-h-9 px-3.5 py-1.5 text-xs"
                onClick={() => {
                  applyTheme(pending as ThemeId);
                  onApplied?.();
                }}
              >
                <IconCheck width={14} height={14} /> Áp dụng
              </button>
            </>
          )}
          {activeTheme !== DEFAULT_THEME && (
            <button
              type="button"
              className="btn btn-ghost min-h-9 px-3 py-1.5 text-xs"
              onClick={() => {
                resetTheme();
                onApplied?.();
              }}
            >
              <IconReset width={14} height={14} /> Về Giấy ngà
            </button>
          )}
        </div>
      </div>

      {/* Tùy chọn giảm chuyển động */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-paper)] px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Giảm chuyển động</p>
          <p className="text-xs text-ink-soft">
            Tự động theo thiết bị, hoặc bật ở đây để tắt hoa đung đưa và hiệu ứng lật phong bì.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={motion === "reduce"}
          onClick={() => setMotion(motion === "reduce" ? "system" : "reduce")}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
            motion === "reduce"
              ? "border-blush-deep bg-blush-deep"
              : "border-[var(--border-strong)] bg-[var(--surface-muted)]"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              motion === "reduce" ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
          <span className="sr-only">Bật hoặc tắt giảm chuyển động</span>
        </button>
      </div>
    </div>
  );
}

export function ThemeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setPreview } = useTheme();
  const handleClose = () => {
    setPreview(null);
    onClose();
  };
  return (
    <Sheet open={open} onClose={handleClose} title="Giao diện sổ tay" subtitle="Lưu riêng trên thiết bị này" maxWidth="max-w-xl">
      <ThemePickerContent onApplied={onClose} />
    </Sheet>
  );
}
