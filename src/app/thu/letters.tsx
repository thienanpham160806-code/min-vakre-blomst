"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Label, Sheet } from "@/components/Sheet";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDate, formatDateTime, localInputToIso } from "@/lib/format";
import { useReady } from "@/lib/use-session";
import type { Letter } from "@/lib/types";

type Locked = { id: string; title: string; open_at: string };

const IDEAS = ["Mở khi buồn", "Mở khi nhớ tui", "Mở khi giận tui", "Mở khi mất ngủ", "Mở vào kỷ niệm 1 năm", "Mở khi thi xong"];

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
      <PageHeader title="Hộp thư" subtitle="Những lá thư “Mở khi…”" right={<button className="btn btn-primary" onClick={() => setWriting(true)}>+ Viết thư</button>} />

      <div className="mx-auto max-w-2xl space-y-8 px-5">
        <section>
          <h2 className="section-title">Thư {partner?.display_name ?? "người ấy"} gửi</h2>
          {received.length === 0 && locked.length === 0 && <p className="empty-note">Chưa có thư nào.</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {received.map((l) => (
              <Envelope key={l.id} title={l.title} sub={formatDate(l.created_at)} onClick={() => setReading(l)} />
            ))}
            {locked.map((l) => (
              <Envelope key={l.id} title={l.title} sub={`Mở được lúc ${formatDateTime(l.open_at)}`} locked />
            ))}
          </div>
        </section>

        <section>
          <h2 className="section-title">Thư mình đã viết</h2>
          {sent.length === 0 && <p className="empty-note">Viết lá đầu tiên đi.</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sent.map((l) => (
              <Envelope
                key={l.id}
                title={l.title}
                sub={l.open_at && new Date(l.open_at) > new Date() ? `Hẹn mở ${formatDateTime(l.open_at)}` : "Người ấy đọc được rồi"}
                onClick={() => setReading(l)}
              />
            ))}
          </div>
        </section>
      </div>

      <Sheet open={!!reading} onClose={() => setReading(null)} title={reading?.title ?? ""}>
        <p className="whitespace-pre-wrap font-hand text-xl leading-relaxed">{reading?.body}</p>
        {reading?.author === me.user_id && (
          <button
            className="btn btn-ghost mt-6 w-full text-blush-deep"
            onClick={async () => {
              if (!reading || !confirm("Xoá lá thư này?")) return;
              await sb.from("letters").delete().eq("id", reading.id);
              setReading(null);
              load();
            }}
          >
            Xoá thư
          </button>
        )}
      </Sheet>

      <WriteLetter open={writing} onClose={() => setWriting(false)} onSaved={load} />
    </>
  );
}

function Envelope({ title, sub, locked, onClick }: { title: string; sub: string; locked?: boolean; onClick?: () => void }) {
  return (
    <button
      disabled={locked}
      onClick={onClick}
      className={`relative flex aspect-[4/3.6] flex-col justify-end overflow-hidden rounded-2xl p-3 text-left shadow-md transition active:scale-95 ${locked ? "bg-ink/10" : "bg-[#fff3e6]"}`}
    >
      <span className="absolute inset-x-0 top-0 h-[42%] bg-[#f6d9c4]" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", opacity: locked ? 0.5 : 1 }} />
      <span className="absolute left-1/2 top-[18%] -translate-x-1/2 text-2xl">{locked ? "🔒" : "💌"}</span>
      <span className="relative font-hand text-lg leading-tight">{title}</span>
      <span className="relative text-[11px] text-ink-soft">{sub}</span>
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
      .insert({ title: title.trim(), body, open_at: openAt ? localInputToIso(openAt) : null, author: auth.user?.id, is_birthday: birthday });
    setBusy(false);
    setTitle("");
    setBody("");
    setOpenAt("");
    onSaved();
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Viết thư">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {IDEAS.map((i) => (
            <button key={i} className="rounded-full bg-blush/30 px-3 py-1 text-sm" onClick={() => setTitle(i)}>{i}</button>
          ))}
        </div>
        <label className="block"><Label>Tiêu đề</Label><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block"><Label>Nội dung</Label><textarea className="field min-h-48 font-hand text-xl" value={body} onChange={(e) => setBody(e.target.value)} /></label>
        <label className="block">
          <Label>Hẹn giờ mở (bỏ trống = đọc được ngay)</Label>
          <input className="field" type="datetime-local" value={openAt} onChange={(e) => setOpenAt(e.target.value)} />
        </label>
        {me.role === "owner" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={birthday} onChange={(e) => setBirthday(e.target.checked)} />
            Dùng làm thư trong màn mở quà sinh nhật
          </label>
        )}
        <button className="btn btn-primary w-full" disabled={busy} onClick={save}>{busy ? "Đang gửi…" : "Gửi thư 💌"}</button>
      </div>
    </Sheet>
  );
}
