"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { IconCheck, IconGarden, IconPlus, IconTrash } from "@/components/icons";
import { NewOccasion } from "@/components/NewOccasion";
import { formatDate } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Wish } from "@/lib/types";

export function Wishes() {
  const sb = supabaseBrowser();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [planting, setPlanting] = useState<Wish | null>(null);
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");

  const load = useCallback(
    () =>
      sb
        .from("wishes")
        .select("*")
        .order("created_at")
        .then(({ data }) => setWishes((data as Wish[]) ?? [])),
    [sb],
  );
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { error } = await sb.from("wishes").insert({ title: title.trim() });
    if (error) return setErr(error.message);
    setErr("");
    setTitle("");
    load();
  }

  async function toggle(w: Wish) {
    const done_at = w.done_at ? null : new Date().toISOString();
    setWishes((l) => l.map((x) => (x.id === w.id ? { ...x, done_at } : x)));
    const { error } = await sb.from("wishes").update({ done_at }).eq("id", w.id);
    if (error) {
      setErr(error.message);
      load();
    }
  }

  const todo = wishes.filter((w) => !w.done_at);
  const done = wishes.filter((w) => w.done_at);

  return (
    <>
      {planting && (
        <NewOccasion
          key={planting.id}
          open
          onClose={() => {
            setPlanting(null);
            load();
          }}
          wish={planting}
        />
      )}

      <PageHeader title="Điều ước chung" subtitle={`${done.length}/${wishes.length} điều đã thành thật`} />

      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        {err && (
          <p role="alert" className="rounded-2xl border border-blush-deep/30 bg-blush/30 px-4 py-3 text-sm text-blush-deep">
            {err}
          </p>
        )}

        <form onSubmit={add} className="flex gap-2">
          <input
            className="field"
            placeholder="Cùng nhau đi ngắm bình minh…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="btn btn-primary shrink-0">
            <IconPlus width={17} height={17} />
            <span>Thêm</span>
          </button>
        </form>

        <ul className="paper-card divide-y divide-[var(--border-soft)] overflow-hidden">
          {todo.length === 0 && (
            <li className="p-5 font-hand text-lg text-ink-soft">
              Viết điều ước đầu tiên hai đứa muốn cùng nhau làm nha ⭐
            </li>
          )}
          {todo.map((w) => (
            <li key={w.id} className="flex items-center gap-3 px-4 py-3.5">
              <button
                type="button"
                onClick={() => toggle(w)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-blush-deep/65 bg-[var(--surface-paper)] transition hover:bg-blush/35"
                aria-label={`Đánh dấu đã làm: ${w.title}`}
              />
              <span className="min-w-0 flex-1 break-words font-hand text-xl text-ink">{w.title}</span>
              <button
                type="button"
                className="btn btn-ghost min-h-9 h-9 w-9 p-0 text-ink-soft hover:text-blush-deep"
                aria-label={`Xóa điều ước: ${w.title}`}
                onClick={async () => {
                  const { error } = await sb.from("wishes").delete().eq("id", w.id);
                  if (error) setErr(error.message);
                  else load();
                }}
              >
                <IconTrash width={15} height={15} />
              </button>
            </li>
          ))}
        </ul>

        {done.length > 0 && (
          <section>
            <h2 className="section-title">Đã làm được cùng nhau ✨</h2>
            <ul className="space-y-2.5">
              {done.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-col gap-3 rounded-2xl border border-sage/30 bg-sage-soft/70 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggle(w)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sage text-white"
                      aria-label={`Bỏ đánh dấu: ${w.title}`}
                    >
                      <IconCheck width={15} height={15} strokeWidth={2.6} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="block break-words font-hand text-xl text-ink line-through decoration-sage/75">
                        {w.title}
                      </span>
                      <span className="text-xs text-ink-soft">Hoàn thành ngày {formatDate(w.done_at!)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {w.occasion_id ? (
                      <Link className="btn btn-soft w-full min-h-10 text-xs sm:w-auto" href={`/album/${w.occasion_id}`}>
                        <IconGarden width={15} height={15} /> Xem bông hoa
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary w-full min-h-10 text-xs sm:w-auto"
                        onClick={() => setPlanting(w)}
                      >
                        <IconGarden width={15} height={15} /> Trồng hoa cho ngày này
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-soft">
              Mẹo: làm xong điều ước nào thì trồng một bông hoa rồi dán ảnh hôm ấy vào trang scrapbook nhé.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
