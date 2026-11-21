"use client";

import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from "react";

/** Bảng trượt từ dưới lên (kiểu app điện thoại). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const dismiss = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); dismiss(); }
      if (e.key !== "Tab") return;
      const nodes = focusable(), first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { e.preventDefault(); dialog.current?.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 animate-fade sm:items-center" onClick={onClose}>
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="paper-card max-h-[85dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] animate-sheet sm:rounded-b-[18px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-ink/15 sm:hidden" aria-hidden />
        <div className="mb-4 flex items-center justify-between">
          <h2 id={titleId} className="font-script text-3xl">{title}</h2>
          <button className="btn btn-ghost h-9 w-9 p-0" onClick={onClose} aria-label="Đóng">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-sm font-semibold text-ink-soft">{children}</span>;
}
