"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { NewOccasion } from "@/components/NewOccasion";
import { PageHeader } from "@/components/AppShell";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Wish } from "@/lib/types";

export function Wishes() {
  const sb = supabaseBrowser();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [planting, setPlanting] = useState<Wish | null>(null);
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");

  const load = useCallback(
    () => sb.from("wishes").select("*").order("created_at").then(({ data }) => setWishes((data as Wish[]) ?? [])),
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
    if (error) { setErr(error.message); load(); }
  }

  const todo = wishes.filter((w) => !w.done_at);
  const done = wishes.filter((w) => w.done_at);

  return (
    <>
      {planting && <NewOccasion key={planting.id} open onClose={() => { setPlanting(null); load(); }} wish={planting} />}
      {err && <p role="alert" className="p-4 text-blush-deep">{err}</p>}
      <PageHeader title="Điều ước chung" subtitle={`${done.length}/${wishes.length} điều đã thành thật`} />
      <div className="mx-auto max-w-2xl space-y-6 px-5">
        <form onSubmit={add} className="flex gap-2">
          <input className="field" placeholder="Cùng nhau đi ngắm bình minh…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="btn btn-primary shrink-0">Thêm</button>
        </form>

        <ul className="paper-card divide-y divide-ink/5 bg-grid">
          {todo.length === 0 && <li className="p-4 font-hand text-lg text-ink-soft">Viết điều ước đầu tiên của hai đứa nha ⭐</li>}
          {todo.map((w) => (
            <li key={w.id} className="flex items-center gap-3 p-4">
              <button onClick={() => toggle(w)} className="h-6 w-6 shrink-0 rounded-md border-2 border-blush-deep" aria-label="Đánh dấu đã làm" />
              <span className="flex-1 font-hand text-xl">{w.title}</span>
              <button className="text-xs text-ink-soft" onClick={async () => { const { error } = await sb.from("wishes").delete().eq("id", w.id); if (error) setErr(error.message); else load(); }}>xoá</button>
            </li>
          ))}
        </ul>

        {done.length > 0 && (
          <section>
            <h2 className="mb-2 font-semibold text-ink-soft">Đã làm được ✨</h2>
            <ul className="space-y-2">
              {done.map((w) => (
                <li key={w.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-sage/20 p-3">
                  <button onClick={() => toggle(w)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sage text-white" aria-label="Bỏ đánh dấu">✓</button>
                  <span className="flex-1 font-hand text-lg line-through decoration-sage/70">{w.title}</span>
                  <span className="text-xs text-ink-soft">{formatDate(w.done_at!)}</span>
                  {w.occasion_id
                    ? <Link className="btn btn-ghost w-full" href={`/album/${w.occasion_id}`}>Xem bông hoa</Link>
                    : <button className="btn btn-ghost w-full" onClick={() => setPlanting(w)}>Trồng hoa cho ngày này</button>}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-soft">
              Mẹo: làm xong điều ước nào thì <Link href="/vuon" className="underline">trồng một bông hoa</Link> rồi dán ảnh hôm đó vào album.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
