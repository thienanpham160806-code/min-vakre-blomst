"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/format";
import { useReady } from "@/lib/use-session";
import type { Invitation, Letter } from "@/lib/types";

type Step = "envelope" | "letter" | "invite" | "done";

export function GiftFlow() {
  const { me, settings } = useReady();
  const router = useRouter();
  const [replay, setReplay] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [letter, setLetter] = useState<Letter | null>(null);
  const [invite, setInvite] = useState<Invitation | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<Step>("envelope");
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    Promise.all([
      sb.from("letters").select("*").eq("is_birthday", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("invitations").select("*").eq("is_birthday", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([l, i]) => {
      // Next.js có thể giữ state của trang ẩn; mỗi lần mở lại bắt đầu từ phong bì.
      setStep("envelope");
      setOpening(false);
      setBusy(false);
      setReplay(new URLSearchParams(window.location.search).get("replay") === "1");
      if (l.error || i.error) { setErr("Không tải được quà. Hãy thử tải lại trang."); return; }
      setErr("");
      setLetter((l.data as Letter) ?? null);
      setInvite((i.data as Invitation) ?? null);
      setLoaded(true);
    });
  }, []);

  const empty = loaded && !letter && !invite;
  useEffect(() => {
    // Không có nội dung sinh nhật thì vào thẳng vườn
    if (empty) window.location.replace("/vuon");
  }, [empty]);

  if (err && !loaded) return <p role="alert" className="p-8">{err}</p>;
  if (!loaded || empty) return <div className="flex min-h-dvh items-center justify-center text-3xl">🎁</div>;

  const next = (from: Step): Step => {
    if (from === "envelope") return letter ? "letter" : invite ? "invite" : "done";
    if (from === "letter") return invite ? "invite" : "done";
    return "done";
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-blush px-5 py-10">
      {err && <p role="alert" className="paper-card p-3">{err}</p>}
      {replay && <p className="mb-4">Xem lại quà · Chỉ đọc</p>}
      {me.role === "owner" && (
        <p className="mb-4 rounded-full bg-white/70 px-3 py-1 text-xs">Bản xem trước của bro, ẻm sẽ thấy y vậy</p>
      )}

      {step === "envelope" && (
        <button
          className="group relative h-56 w-80 max-w-full animate-float"
          onClick={() => {
            setOpening(true);
            setTimeout(() => setStep(next("envelope")), 900);
          }}
          aria-label="Mở phong bì"
        >
          <div className="absolute inset-0 rounded-xl bg-[#fff3e6] shadow-xl" />
          <div
            className="absolute inset-x-0 top-0 h-1/2 origin-top rounded-t-xl bg-[#f6d9c4] transition-transform duration-700"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", transform: opening ? "rotateX(180deg)" : "none" }}
          />
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/3 text-5xl transition-transform group-active:scale-90">💌</div>
          <p className="absolute inset-x-0 -bottom-12 font-hand text-xl">{opening ? "…" : "chạm để mở"}</p>
        </button>
      )}

      {step === "letter" && letter && (
        <article className="paper-card w-full max-w-lg animate-pop bg-grid p-7">
          <h2 className="font-script text-3xl">{letter.title}</h2>
          <p className="mt-4 whitespace-pre-wrap font-hand text-xl leading-relaxed">{letter.body}</p>
          <div className="mt-6 text-right">
            <button className="btn btn-primary" onClick={() => setStep(next("letter"))}>Tiếp nè →</button>
          </div>
        </article>
      )}

      {step === "invite" && invite && <InviteCard preview={me.role === "owner"} readOnly={replay} invite={invite} onDone={() => setStep("done")} onAnswered={setInvite} />}

      {step === "done" && (
        <div className="flex flex-col items-center gap-5 text-center animate-pop">
          <p className="font-script text-4xl">Chúc mừng sinh nhật 🌷</p>
          <p className="max-w-xs font-hand text-xl">Khu vườn của tụi mình bắt đầu từ hôm nay. Mỗi kỷ niệm sẽ là một bông hoa.</p>
          <button className="btn btn-primary text-lg" disabled={busy} onClick={async () => {
            if (busy) return;
            setBusy(true);
            setErr("");
            if (me.role === "partner" && !replay) {
              const { error } = await supabaseBrowser().from("gift_progress").upsert({ user_id: me.user_id, completed_at: new Date().toISOString() });
              if (error) { setBusy(false); setErr("Không lưu được tiến độ: " + error.message); return; }
            }
            router.push(settings.finale_occasion_id ? `/album/${settings.finale_occasion_id}` : "/vuon");
          }}>{settings.finale_occasion_id ? "Xem bông hoa đầu tiên" : "Vào vườn"}</button>
        </div>
      )}
    </div>
  );
}

function InviteCard({
  invite,
  onDone,
  onAnswered,
  preview,
  readOnly,
}: {
  invite: Invitation;
  preview: boolean;
  readOnly: boolean;
  onDone: () => void;
  onAnswered: (i: Invitation) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState(invite.chosen);
  const [err, setErr] = useState("");
  async function accept() {
    if (busy) return;
    if (preview || readOnly || invite.answered_at) { onDone(); return; }
    setBusy(true);
    setErr("");
    const { data, error } = await supabaseBrowser().from("invitations")
      .update({ chosen, answered_at: new Date().toISOString() }).eq("id", invite.id)
      .is("answered_at", null).select().single();
    setBusy(false);
    if (error || !data) { setErr("Không lưu được lời nhận: " + (error?.message ?? "Hãy tải lại thiệp")); return; }
    onAnswered(data as Invitation);
    onDone();
  }

  return (
    <div className="paper-card w-full max-w-md animate-pop overflow-hidden">
      <div className="bg-blush-deep px-6 py-5 text-white">
        <p className="text-xs uppercase tracking-[0.3em] opacity-80">Thiệp mời</p>
        <h2 className="font-script text-4xl">{invite.title}</h2>
      </div>
      <div className="space-y-3 p-6">
        {invite.message && <p className="font-hand text-xl">{invite.message}</p>}
        <dl className="space-y-1 text-sm">
          {invite.event_at && <div>🕰️ <b>Thời gian:</b> {formatDateTime(invite.event_at)}</div>}
          {invite.dress_code && <div>👗 <b>Trang phục:</b> {invite.dress_code}</div>}
        </dl>

        {invite.options.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 font-semibold">{!invite.answered_at ? "Chọn chỗ ăn nha:" : "Đã chốt:"}</p>
            <div className="grid gap-2">
              {invite.options.map((o, i) => {
                const picked = chosen === i;
                return (
                  <button
                    key={i}
                    disabled={busy || readOnly || (!preview && !!invite.answered_at)}
                    onClick={() => setChosen(i)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${picked ? "border-blush-deep bg-blush/30" : "border-ink/10"}`}
                  >
                    <span className="text-3xl">{o.emoji ?? "🍽️"}</span>
                    <span>
                      <span className="block font-semibold">{o.name}</span>
                      {o.note && <span className="block text-sm text-ink-soft">{o.note}</span>}
                    </span>
                    {picked && <span className="ml-auto">💗</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-3 text-right">
          {err && <p role="alert" className="text-blush-deep">{err}</p>}
          <button className="btn btn-primary" disabled={busy || (!readOnly && invite.options.length > 0 && chosen === null)} onClick={accept}>
            {readOnly || invite.answered_at ? "Tiếp nè →" : "Nhận lời 💌"}
          </button>
        </div>
      </div>
    </div>
  );
}
