"use client";

import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from "react";
import { IconClose } from "./icons";

/** Bảng trượt từ dưới lên trên điện thoại, hộp thoại gọn giữa màn trên iPad/laptop. */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const dismiss = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
      }
      if (e.key !== "Tab") return;
      const nodes = focusable();
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first) {
        e.preventDefault();
        dialog.current?.focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (dialog.current?.querySelector<HTMLElement>("[autofocus]") ?? focusable()[0] ?? dialog.current)?.focus();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 backdrop-blur-[2px] animate-fade sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`paper-card flex max-h-[86dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-b-none animate-sheet sm:rounded-[22px]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[var(--border-soft)] px-5 pb-3 pt-3">
          <div className="mx-auto mb-2.5 h-1.5 w-11 rounded-full bg-ink/15 sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={titleId} className="font-script text-3xl leading-tight text-ink">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="btn btn-ghost min-h-10 h-10 w-10 p-0"
              onClick={onClose}
              aria-label="Đóng"
            >
              <IconClose width={18} height={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-sm font-semibold text-ink-soft">{children}</span>;
}
