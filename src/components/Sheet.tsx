"use client";

import type { ReactNode } from "react";

/** Bảng trượt từ dưới lên (kiểu app điện thoại). */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 sm:items-center" onClick={onClose}>
      <div
        className="paper-card max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] animate-pop sm:rounded-b-[18px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-script text-3xl">{title}</h2>
          <button className="btn btn-ghost px-3 py-1" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-sm font-semibold text-ink-soft">{children}</span>;
}
