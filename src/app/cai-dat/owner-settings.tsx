"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, SignOut } from "@/components/AppShell";
import { Label } from "@/components/Sheet";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDateTime, localInputToIso } from "@/lib/format";
import { useReady } from "@/lib/use-session";
import type { Invitation, InvitationOption, ScheduledMail } from "@/lib/types";

/** Ngày giờ ISO → giá trị cho <input type="datetime-local"> theo giờ VN */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 7 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export function OwnerSettings() {
  const { me, partner, settings } = useReady();
  if (me.role !== "owner") {
    return (
      <div className="p-8 text-center">
        <p className="font-hand text-xl">Trang này chỉ dành cho người làm vườn 🌱</p>
        <div className="mt-4"><SignOut /></div>
      </div>
    );
  }
  return (
    <>
      <PageHeader title="Cài đặt" subtitle="Chỉ mình bro thấy trang này" right={<SignOut />} />
      <div className="mx-auto max-w-2xl space-y-6 px-5 pb-10">
        <General unlockAt={settings.unlock_at} togetherSince={settings.together_since} />
        <BirthdayInvite />
        <Mails defaultTo={partner?.email ?? ""} />
        <Link href="/qua" className="btn btn-ghost w-full">👀 Xem trước màn mở quà</Link>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="paper-card space-y-4 p-5">
      <h2 className="font-script text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function General({ unlockAt, togetherSince }: { unlockAt: string; togetherSince: string | null }) {
  const [unlock, setUnlock] = useState(toLocalInput(unlockAt));
  const [since, setSince] = useState(togetherSince ?? "");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  return (
    <Card title="Chung">
      <label className="block">
        <Label>Giờ mở khoá cho ẻm (giờ VN)</Label>
        <input className="field" type="datetime-local" value={unlock} onChange={(e) => setUnlock(e.target.value)} />
        <span className="mt-1 block text-xs text-ink-soft">Giờ mới tự đồng bộ, không cần deploy lại.</span>
      </label>
      <label className="block">
        <Label>Ngày bắt đầu yêu nhau</Label>
        <input className="field" type="date" value={since} onChange={(e) => setSince(e.target.value)} />
      </label>
      {err && <p role="alert" className="text-blush-deep">{err}</p>}
      <button
        className="btn btn-primary"
        onClick={async () => {
          setSaved(false);
          setErr("");
          const { data, error } = await supabaseBrowser()
            .from("settings")
            .update({ unlock_at: localInputToIso(unlock), together_since: since || null, updated_at: new Date().toISOString() })
            .eq("id", 1).select("id").single();
          if (error || !data) return setErr(error?.message ?? "Không lưu được cài đặt");
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        {saved ? "Đã lưu ✓" : "Lưu"}
      </button>
    </Card>
  );
}

function BirthdayInvite() {
  const sb = supabaseBrowser();
  const [inv, setInv] = useState<Invitation | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("Hẹn hò sinh nhật");
  const [message, setMessage] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [dress, setDress] = useState("");
  const [options, setOptions] = useState<InvitationOption[]>([{ emoji: "🍣", name: "" }, { emoji: "🍝", name: "" }, { emoji: "🍲", name: "" }]);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    sb.from("invitations").select("*").eq("is_birthday", true).order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      const i = data as Invitation | null;
      if (i) {
        setInv(i);
        setTitle(i.title);
        setMessage(i.message ?? "");
        setEventAt(toLocalInput(i.event_at));
        setDress(i.dress_code ?? "");
        if (i.options.length) setOptions(i.options);
      }
      setLoaded(true);
    });
  }, [sb]);

  if (!loaded) return null;

  async function save() {
    const row = {
      title,
      message: message || null,
      event_at: eventAt ? localInputToIso(eventAt) : null,
      dress_code: dress || null,
      options: options.filter((o) => o.name.trim()),
      is_birthday: true,
    };
    setSaved(false);
    setErr("");
    const { data, error } = inv
      ? await sb.from("invitations").update(row).eq("id", inv.id).select().single()
      : await sb.from("invitations").insert(row).select().single();
    if (error || !data) return setErr(error?.message ?? "Không lưu được thiệp");
    setInv(data as Invitation);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card title="Thiệp mời sinh nhật">
      {inv?.chosen != null && (
        <p className="rounded-xl bg-sage/20 p-3 text-sm">
          Ẻm đã chọn: <b>{inv.options[inv.chosen]?.emoji} {inv.options[inv.chosen]?.name}</b>
        </p>
      )}
      <label className="block"><Label>Tiêu đề</Label><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="block"><Label>Lời nhắn</Label><textarea className="field" value={message} onChange={(e) => setMessage(e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><Label>Giờ hẹn</Label><input className="field" type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} /></label>
        <label className="block"><Label>Trang phục</Label><input className="field" value={dress} onChange={(e) => setDress(e.target.value)} /></label>
      </div>
      <div>
        <Label>Các lựa chọn để ẻm chọn</Label>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={i} className="grid grid-cols-[3.5rem_1fr_1fr] gap-2">
              <input className="field px-1 text-center" value={o.emoji ?? ""} onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? { ...x, emoji: e.target.value } : x)))} />
              <input className="field" placeholder="Tên quán" value={o.name} onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className="field" placeholder="Ghi chú" value={o.note ?? ""} onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
            </div>
          ))}
          <button className="text-sm text-blush-deep" onClick={() => setOptions((l) => [...l, { emoji: "✨", name: "" }])}>+ thêm lựa chọn</button>
        </div>
      </div>
      {err && <p role="alert" className="text-blush-deep">{err}</p>}
      <button className="btn btn-primary" onClick={save}>{saved ? "Đã lưu ✓" : "Lưu thiệp"}</button>
      <p className="text-xs text-ink-soft">Lá thư sinh nhật: viết ở mục Thư, tick “Dùng làm thư trong màn mở quà sinh nhật” và hẹn giờ mở 18/01 00:00.</p>
    </Card>
  );
}

function Mails({ defaultTo }: { defaultTo: string }) {
  const sb = supabaseBrowser();
  const [err, setErr] = useState("");
  const [mails, setMails] = useState<ScheduledMail[]>([]);
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState("min vakre blomst");
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");
  const [sendAt, setSendAt] = useState("2027-01-18T00:00");

  const load = useCallback(
    () => sb.from("scheduled_mails").select("*").order("send_at").then(({ data }) => setMails((data as ScheduledMail[]) ?? [])),
    [sb],
  );
  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card title="Mail hẹn giờ">
      {err && <p role="alert" className="text-blush-deep">{err}</p>}
      <ul className="space-y-2">
        {mails.length === 0 && <li className="text-sm text-ink-soft">Chưa hẹn mail nào.</li>}
        {mails.map((m) => (
          <li key={m.id} className="flex items-start gap-3 rounded-xl bg-ink/5 p-3 text-sm">
            <span>{m.sent_at ? "✅" : m.last_error ? "⚠️" : "⏰"}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.subject}</p>
              <p className="text-ink-soft">{m.to_email} · {formatDateTime(m.send_at)}</p>
              {m.last_error && !m.sent_at && <p className="text-blush-deep">{m.last_error}</p>}
            </div>
            {!m.sent_at && <button className="text-xs text-ink-soft" onClick={async () => { const { error } = await sb.from("scheduled_mails").delete().eq("id", m.id); if (error) return setErr(error.message); setErr(""); load(); }}>xoá</button>}
          </li>
        ))}
      </ul>
      <div className="space-y-3 border-t border-ink/10 pt-4">
        <label className="block"><Label>Gửi tới</Label><input className="field" type="email" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label className="block"><Label>Tiêu đề mail</Label><input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
        <label className="block"><Label>Dòng lớn trong mail</Label><input className="field" placeholder="Chúc mừng sinh nhật 🌷" value={heading} onChange={(e) => setHeading(e.target.value)} /></label>
        <label className="block"><Label>Nội dung</Label><textarea className="field min-h-24" value={body} onChange={(e) => setBody(e.target.value)} /></label>
        <label className="block"><Label>Gửi lúc (giờ VN)</Label><input className="field" type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} /></label>
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (!to || !body) return;
            const { error } = await sb.from("scheduled_mails").insert({ to_email: to, subject, heading: heading || null, body, send_at: localInputToIso(sendAt) });
            if (error) return setErr(error.message);
            setErr("");
            setBody("");
            setHeading("");
            load();
          }}
        >
          Hẹn gửi
        </button>
      </div>
    </Card>
  );
}
