"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, SignOut } from "@/components/AppShell";
import { IconCheck, IconGift, IconTrash } from "@/components/icons";
import { Label } from "@/components/Sheet";
import { ThemePickerContent } from "@/components/ThemePicker";
import { formatDateTime, localInputToIso } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Invitation, InvitationOption, Occasion, ScheduledMail } from "@/lib/types";
import { useReady } from "@/lib/use-session";

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
      <div className="mx-auto max-w-md px-5 py-12 text-center">
        <div className="paper-card space-y-4 p-7">
          <p className="font-hand text-2xl text-ink">Trang này chỉ dành cho người làm vườn 🌱</p>
          <ThemePickerContent />
          <div className="pt-2">
            <SignOut />
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <PageHeader title="Cài đặt" subtitle="Quản lý khu vườn, thiệp mời và giao diện sổ tay" right={<SignOut />} />
      <div className="mx-auto max-w-3xl space-y-6 px-4 pb-10 sm:px-6">
        <Card title="Giao diện & chuyển động">
          <ThemePickerContent />
        </Card>
        <General
          unlockAt={settings.unlock_at}
          togetherSince={settings.together_since}
          finaleId={settings.finale_occasion_id}
        />
        <BirthdayInvite />
        <Mails defaultTo={partner?.email ?? ""} />
        <Link href="/qua" className="btn btn-soft w-full">
          <IconGift width={18} height={18} />
          <span>Xem trước màn mở quà sinh nhật</span>
        </Link>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="paper-card space-y-4 p-5 sm:p-6">
      <h2 className="font-script text-3xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

function General({
  unlockAt,
  togetherSince,
  finaleId,
}: {
  unlockAt: string;
  togetherSince: string | null;
  finaleId: string | null;
}) {
  const [err, setErr] = useState("");
  const [finale, setFinale] = useState(finaleId ?? "");
  const [albums, setAlbums] = useState<Occasion[]>([]);
  useEffect(() => {
    supabaseBrowser()
      .from("occasions")
      .select("*")
      .order("happened_on")
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        else setAlbums(data as Occasion[]);
      });
  }, []);
  const [unlock, setUnlock] = useState(toLocalInput(unlockAt));
  const [since, setSince] = useState(togetherSince ?? "");
  const [saved, setSaved] = useState(false);

  return (
    <Card title="Cài đặt chung">
      <label className="block">
        <Label>Giờ mở khóa cho người ấy (giờ VN)</Label>
        <input className="field" type="datetime-local" value={unlock} onChange={(e) => setUnlock(e.target.value)} />
        <span className="mt-1 block text-xs text-ink-soft">Giờ mới tự đồng bộ với đồng hồ đếm ngược, không cần deploy lại.</span>
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <Label>Bông hoa ở màn kết</Label>
          <select className="field" value={finale} onChange={(e) => setFinale(e.target.value)}>
            <option value="">Không chọn</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <Label>Ngày bắt đầu yêu nhau</Label>
          <input className="field" type="date" value={since} onChange={(e) => setSince(e.target.value)} />
        </label>
      </div>
      {err && (
        <p role="alert" className="text-sm text-blush-deep">
          {err}
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary"
        disabled={!unlock}
        onClick={async () => {
          setSaved(false);
          setErr("");
          const { data, error } = await supabaseBrowser()
            .from("settings")
            .update({
              finale_occasion_id: finale || null,
              unlock_at: localInputToIso(unlock),
              together_since: since || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", 1)
            .select("id")
            .single();
          if (error || !data) return setErr(error?.message ?? "Không lưu được cài đặt");
          setSaved(true);
          setTimeout(() => setSaved(false), 2200);
        }}
      >
        {saved ? (
          <>
            <IconCheck width={16} height={16} /> Đã lưu
          </>
        ) : (
          "Lưu cài đặt"
        )}
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
  const [options, setOptions] = useState<InvitationOption[]>([
    { emoji: "🍣", name: "" },
    { emoji: "🍝", name: "" },
    { emoji: "🍲", name: "" },
  ]);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    sb.from("invitations")
      .select("*")
      .eq("is_birthday", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setErr(error.message);
          return;
        }
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

  if (!loaded) return err ? <p role="alert" className="text-blush-deep">{err}</p> : null;

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
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <Card title="Thiệp mời sinh nhật">
      {inv?.chosen != null && (
        <p className="rounded-2xl border border-sage/35 bg-sage-soft p-3 text-sm text-ink">
          Người ấy đã chọn:{" "}
          <strong>
            {inv.options[inv.chosen]?.emoji} {inv.options[inv.chosen]?.name}
          </strong>
        </p>
      )}
      <label className="block">
        <Label>Tiêu đề</Label>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block">
        <Label>Lời nhắn</Label>
        <textarea className="field min-h-20" value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <Label>Giờ hẹn</Label>
          <input className="field" type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} />
        </label>
        <label className="block">
          <Label>Trang phục</Label>
          <input className="field" value={dress} onChange={(e) => setDress(e.target.value)} />
        </label>
      </div>
      <div>
        <Label>Các lựa chọn địa điểm</Label>
        <div className="space-y-2.5">
          {options.map((o, i) => (
            <div key={i} className="grid grid-cols-[3.25rem_1fr] gap-2 sm:grid-cols-[3.5rem_1fr_1fr]">
              <input
                className="field px-1 text-center"
                value={o.emoji ?? ""}
                aria-label={`Biểu tượng lựa chọn ${i + 1}`}
                onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? { ...x, emoji: e.target.value } : x)))}
              />
              <input
                className="field"
                placeholder="Tên quán"
                value={o.name}
                onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
              <input
                className="field col-span-2 sm:col-span-1"
                placeholder="Ghi chú"
                value={o.note ?? ""}
                onChange={(e) => setOptions((l) => l.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-blush-deep underline decoration-blush-deep/40"
            onClick={() => setOptions((l) => [...l, { emoji: "✨", name: "" }])}
          >
            + thêm lựa chọn
          </button>
        </div>
      </div>
      {err && (
        <p role="alert" className="text-sm text-blush-deep">
          {err}
        </p>
      )}
      <button type="button" className="btn btn-primary" onClick={save}>
        {saved ? (
          <>
            <IconCheck width={16} height={16} /> Đã lưu thiệp
          </>
        ) : (
          "Lưu thiệp"
        )}
      </button>
      <p className="text-xs text-ink-soft">
        Lá thư sinh nhật: viết ở mục Thư, tick “Dùng làm thư trong màn mở quà sinh nhật” và hẹn giờ mở 18/01 00:00.
      </p>
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
    () =>
      sb
        .from("scheduled_mails")
        .select("*")
        .order("send_at")
        .then(({ data, error }) => {
          if (error) setErr(error.message);
          else setMails((data as ScheduledMail[]) ?? []);
        }),
    [sb],
  );
  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card title="Mail hẹn giờ">
      {err && (
        <p role="alert" className="text-sm text-blush-deep">
          {err}
        </p>
      )}
      <ul className="space-y-2">
        {mails.length === 0 && <li className="text-sm text-ink-soft">Chưa hẹn mail nào.</li>}
        {mails.map((m) => (
          <li
            key={m.id}
            className="flex items-start gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] p-3 text-sm"
          >
            <span className="mt-0.5">{m.sent_at ? "✅" : m.last_error ? "⚠️" : "⏰"}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{m.subject}</p>
              <p className="break-words text-xs text-ink-soft">
                {m.to_email} · {formatDateTime(m.send_at)}
              </p>
              {m.last_error && !m.sent_at && <p className="mt-1 text-xs text-blush-deep">{m.last_error}</p>}
            </div>
            {!m.sent_at && (
              <button
                type="button"
                className="btn btn-ghost min-h-8 h-8 w-8 p-0 text-ink-soft hover:text-blush-deep"
                aria-label="Xóa mail hẹn giờ"
                onClick={async () => {
                  const { error } = await sb.from("scheduled_mails").delete().eq("id", m.id).select("id").single();
                  if (error) return setErr(error.message);
                  setErr("");
                  load();
                }}
              >
                <IconTrash width={14} height={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="space-y-3 border-t border-[var(--border-soft)] pt-4">
        <label className="block">
          <Label>Gửi tới</Label>
          <input className="field" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="block">
          <Label>Tiêu đề mail</Label>
          <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="block">
          <Label>Dòng lớn trong mail</Label>
          <input className="field" placeholder="Chúc mừng sinh nhật 🌷" value={heading} onChange={(e) => setHeading(e.target.value)} />
        </label>
        <label className="block">
          <Label>Nội dung</Label>
          <textarea className="field min-h-24" value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <label className="block">
          <Label>Gửi lúc (giờ VN)</Label>
          <input className="field" type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={async () => {
            if (!to || !body) return;
            const { error } = await sb
              .from("scheduled_mails")
              .insert({ to_email: to, subject, heading: heading || null, body, send_at: localInputToIso(sendAt) });
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
