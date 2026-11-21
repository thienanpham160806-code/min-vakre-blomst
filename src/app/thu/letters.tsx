"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { IconLetter, IconLock, IconPlus, IconTrash } from "@/components/icons";
import { Label, Sheet } from "@/components/Sheet";
import { formatDate, formatDateTime, localInputToIso } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Letter } from "@/lib/types";
import { useReady } from "@/lib/use-session";

type Locked = { id: string; title: string; open_at: string };

const IDEAS = [
  "Mở khi buồn",
  "Mở khi nhớ tui",
  "Mở khi giận tui",
  "Mở khi mất ngủ",
  "Mở vào kỷ niệm 1 năm",
  "Mở khi thi xong",
];

export function Letters() {
  const { me, partner } = useReady();
  const sb = supabaseBrowser();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [locked, setLocked] = useState<Locked[]>([]);
  const [reading, setReading] = useState<Letter | null>(null);
  const [writing, setWriting] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([
        sb.from("letters").select("*").order("created_at", { ascending: false }),
        sb.rpc("locked_letters"),
      ]).then(([l, k]) => {
        setLetters((l.data as Letter[]) ?? []);
        setLocked((k.data as Locked[]) ?? []);
      }),
    [sb],
  );

  useEffect(() => {
    load();
  }, [load]);

  const received = letters.filter((l) => l.author !== me.user_id);
  const sent = letters.filter((l) => l.author === me.user_id);

  return (
    <>
      <PageHeader
        title="Hộp thư"
        subtitle="Những lá thư “Mở khi…” để dành cho nhau"
        right={
          <button type="button" className="btn btn-primary" onClick={() => setWriting(true)}>
            <IconPlus width={17} height={17} />
            <span>Viết thư</span>
          </button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">
        <section>
          <h2 className="section-title">Thư {partner?.display_name ?? "người ấy"} gửi</h2>
          {received.length === 0 && locked.length === 0 && (
            <p className="empty-note">Chưa có lá thư nào trong hòm thư này.</p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {received.map((l) => (
              <Envelope key={l.id} title={l.title} sub={formatDate(l.created_at)} onClick={() => setReading(l)} />
            ))}
            {locked.map((l) => (
              <Envelope key={l.id} title={l.title} sub={`Mở lúc ${formatDateTime(l.open_at)}`} locked />
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">Thư mình đã viết</h2>
          {sent.length === 0 && <p className="empty-note">Viết một lá thư nhỏ để dành cho người ấy nha.</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {sent.map((l) => (
              <Envelope
                key={l.id}
                title={l.title}
                sub={
                  l.open_at && new Date(l.open_at) > new Date()
                    ? `Hẹn mở ${formatDateTime(l.open_at)}`
                    : "Người ấy đọc được rồi"
                }
                onClick={() => setReading(l)}
              />
            ))}
          </div>
        </section>
      </div>

      <Sheet open={!!reading} onClose={() => setReading(null)} title={reading?.title ?? ""}>
        <div className="bg-lined rounded-2xl border border-[var(--border-soft)] p-5 text-[#332723]">
          <p className="whitespace-pre-wrap font-hand text-xl leading-[2rem]">{reading?.body}</p>
        </div>
        {reading?.author === me.user_id && (
          <button
            type="button"
            className="btn btn-ghost mt-5 w-full text-blush-deep"
            onClick={async () => {
              if (!reading || !confirm("Xóa lá thư này?")) return;
              await sb.from("letters").delete().eq("id", reading.id);
              setReading(null);
              load();
            }}
          >
            <IconTrash width={16} height={16} /> Xóa thư
          </button>
        )}
      </Sheet>

      <WriteLetter open={writing} onClose={() => setWriting(false)} onSaved={load} />
    </>
  );
}

function Envelope({
  title,
  sub,
  locked,
  onClick,
}: {
  title: string;
  sub: string;
  locked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={`group relative flex aspect-[4/3.6] flex-col justify-end overflow-hidden rounded-2xl border p-3.5 text-left transition ${
        locked
          ? "cursor-not-allowed border-[var(--border-soft)] bg-[var(--surface-muted)] opacity-80"
          : "border-[#d8c1a5]/80 bg-[#f8eddc] text-[#352824] shadow-[var(--shadow-paper)] hover:-translate-y-0.5 active:scale-[0.98]"
      }`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-[44%] ${locked ? "bg-[var(--border-soft)]" : "bg-[#eedac0]"}`}
        style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        aria-hidden
      />
      <span
        className={`absolute left-1/2 top-[26%] flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-xs ${
          locked ? "bg-[var(--surface-paper)] text-ink-soft" : "bg-[#a84a5a] text-[#fff8f6]"
        }`}
      >
        {locked ? <IconLock width={16} height={16} /> : <IconLetter width={16} height={16} />}
      </span>
      <span className={`relative line-clamp-2 font-hand text-lg leading-tight ${locked ? "text-ink" : "text-[#352824]"}`}>
        {title}
      </span>
      <span className={`relative mt-0.5 truncate text-[11px] ${locked ? "text-ink-soft" : "text-[#6b574d]"}`}>
        {sub}
      </span>
    </button>
  );
}

function WriteLetter({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [birthday, setBirthday] = useState(false);
  const [busy, setBusy] = useState(false);
  const { me } = useReady();

  async function save() {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    const { data: auth } = await supabaseBrowser().auth.getUser();
    await supabaseBrowser()
      .from("letters")
      .insert({
        title: title.trim(),
        body,
        open_at: openAt ? localInputToIso(openAt) : null,
        author: auth.user?.id,
        is_birthday: birthday,
      });
    setBusy(false);
    setTitle("");
    setBody("");
    setOpenAt("");
    onSaved();
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Viết thư" subtitle="Gửi một mảnh giấy nhỏ cho tương lai">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {IDEAS.map((i) => (
            <button
              key={i}
              type="button"
              className="rounded-full border border-[var(--border-soft)] bg-blush/40 px-3 py-1 text-xs font-medium text-ink transition hover:border-blush-deep/40"
              onClick={() => setTitle(i)}
            >
              {i}
            </button>
          ))}
        </div>
        <label className="block">
          <Label>Tiêu đề</Label>
          <input className="field" placeholder="Mở khi nhớ tui…" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <Label>Nội dung</Label>
          <textarea
            className="field min-h-44 font-hand text-xl leading-relaxed"
            placeholder="Viết những điều muốn nhắn gửi…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <label className="block">
          <Label>Hẹn giờ mở (bỏ trống = đọc được ngay)</Label>
          <input className="field" type="datetime-local" value={openAt} onChange={(e) => setOpenAt(e.target.value)} />
        </label>
        {me.role === "owner" && (
          <label className="flex items-center gap-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-3 py-2.5 text-sm text-ink">
            <input type="checkbox" className="h-4 w-4 accent-[var(--accent-main)]" checked={birthday} onChange={(e) => setBirthday(e.target.checked)} />
            <span>Dùng làm thư trong màn mở quà sinh nhật</span>
          </label>
        )}
        <button type="button" className="btn btn-primary w-full" disabled={busy || !title.trim() || !body.trim()} onClick={save}>
          {busy ? "Đang gửi…" : "Niêm phong & gửi thư"}
        </button>
      </div>
    </Sheet>
  );
}
