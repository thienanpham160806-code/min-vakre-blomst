"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Flower } from "@/components/Flower";
import { IconCheck, IconGarden, Sprout } from "@/components/icons";
import { formatDateTime } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Invitation, Letter } from "@/lib/types";
import { useReady } from "@/lib/use-session";

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
      setStep("envelope");
      setOpening(false);
      setBusy(false);
      setReplay(new URLSearchParams(window.location.search).get("replay") === "1");
      if (l.error || i.error) {
        setErr("Không tải được quà. Hãy thử tải lại trang.");
        return;
      }
      setErr("");
      setLetter((l.data as Letter) ?? null);
      setInvite((i.data as Invitation) ?? null);
      setLoaded(true);
    });
  }, []);

  const empty = loaded && !letter && !invite;
  useEffect(() => {
    if (empty) window.location.replace("/vuon");
  }, [empty]);

  if (err && !loaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <p role="alert" className="paper-card max-w-sm p-5 text-center text-blush-deep">
          {err}
        </p>
      </div>
    );
  }
  if (!loaded || empty) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
        <Sprout className="h-14 w-14" />
        <p className="font-hand text-xl text-ink-soft">Đang chuẩn bị món quà nhỏ…</p>
      </div>
    );
  }

  const next = (from: Step): Step => {
    if (from === "envelope") return letter ? "letter" : invite ? "invite" : "done";
    if (from === "letter") return invite ? "invite" : "done";
    return "done";
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      {/* Bối cảnh màu nước nhẹ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-65"
        style={{
          background:
            "radial-gradient(circle at 20% 18%, var(--accent-soft), transparent 46%), radial-gradient(circle at 82% 80%, var(--botanical-soft), transparent 48%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
        {err && (
          <p role="alert" className="paper-card mb-4 w-full border-blush-deep/35 p-3 text-center text-sm text-blush-deep">
            {err}
          </p>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
          {replay && (
            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-paper)]/90 px-3.5 py-1 text-xs font-semibold text-ink-soft shadow-xs">
              Xem lại quà · Chỉ đọc
            </span>
          )}
          {me.role === "owner" && (
            <span className="rounded-full border border-sage/35 bg-sage-soft px-3.5 py-1 text-xs font-semibold text-ink">
              Bản xem trước của bạn · Người ấy sẽ thấy y vậy
            </span>
          )}
        </div>

        {/* Bước 1: Phong bì giấy thủ công có dấu sáp */}
        {step === "envelope" && (
          <div className="flex flex-col items-center py-6">
            <button
              type="button"
              disabled={opening}
              className="group relative h-52 w-72 max-w-[88vw] cursor-pointer animate-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-deep sm:h-56 sm:w-80"
              onClick={() => {
                if (opening) return;
                setOpening(true);
                setTimeout(() => setStep(next("envelope")), 820);
              }}
              aria-label="Chạm để mở phong bì sinh nhật"
            >
              {/* Tờ thư trượt nhô nhẹ lên khi mở */}
              <div
                className={`absolute inset-x-5 top-4 h-36 rounded-lg border border-[#d9c8b4] bg-[#fffdf7] p-4 shadow-sm ${
                  opening ? "animate-letter-peek" : ""
                }`}
                aria-hidden
              >
                <div className="h-1.5 w-16 rounded-full bg-[#c98b97]/45" />
                <div className="mt-3 space-y-2">
                  <div className="h-1.5 w-full rounded-full bg-[#7a6461]/18" />
                  <div className="h-1.5 w-4/5 rounded-full bg-[#7a6461]/18" />
                  <div className="h-1.5 w-3/5 rounded-full bg-[#7a6461]/18" />
                </div>
              </div>

              {/* Thân phong bì */}
              <div className="absolute inset-0 rounded-2xl border border-[#d6bfa5] bg-[#f6e8d5] shadow-[0_18px_38px_-16px_rgba(61,43,43,0.42)]" />
              {/* Nếp gấp đáy phong bì */}
              <div
                className="absolute inset-x-0 bottom-0 h-[58%] rounded-b-2xl bg-[#efe0cb]"
                style={{ clipPath: "polygon(0 100%, 50% 18%, 100% 100%)" }}
                aria-hidden
              />
              {/* Nắp phong bì xoay mở */}
              <div
                className="absolute inset-x-0 top-0 h-[54%] origin-top rounded-t-2xl bg-[#ebd5bc] transition-transform duration-700 ease-out"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  transform: opening ? "rotateX(175deg)" : "rotateX(0deg)",
                }}
                aria-hidden
              />
              {/* Con dấu sáp hồng đất */}
              <div
                className={`absolute left-1/2 top-[48%] z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#e8a8b4]/60 bg-[#a84a5a] text-[#fff8f6] shadow-md transition-all duration-500 group-hover:scale-105 group-active:scale-95 ${
                  opening ? "scale-75 opacity-0" : "opacity-100"
                }`}
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
                  <path d="M12 20.5C6.2 16.2 3 12.7 3 8.8A4.8 4.8 0 0 1 7.8 4c1.9 0 3.3 1 4.2 2.4C12.9 5 14.3 4 16.2 4A4.8 4.8 0 0 1 21 8.8c0 3.9-3.2 7.4-9 11.7Z" />
                </svg>
              </div>
            </button>

            <p className="mt-7 font-hand text-2xl text-ink">
              {opening ? "đang mở lá thư…" : "chạm vào phong bì để mở nha"}
            </p>
            <p className="mt-1 text-xs text-ink-soft">Gửi riêng cho người thương</p>
          </div>
        )}

        {/* Bước 2: Lá thư sinh nhật trên giấy kẻ ngang */}
        {step === "letter" && letter && (
          <article className="paper-card bg-lined relative w-full max-w-lg animate-pop p-6 text-[#332723] sm:p-8">
            <span className="washi" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7a5d58]">Thư gửi bạn</p>
            <h2 className="mt-1 font-script text-4xl leading-tight text-[#332723]">{letter.title}</h2>
            <p className="mt-5 whitespace-pre-wrap font-hand text-xl leading-[2rem] text-[#352824]">
              {letter.body}
            </p>
            <div className="mt-7 flex justify-end">
              <button type="button" className="btn btn-primary" onClick={() => setStep(next("letter"))}>
                Tiếp nè →
              </button>
            </div>
          </article>
        )}

        {/* Bước 3: Thiệp mời chọn quán */}
        {step === "invite" && invite && (
          <InviteCard
            preview={me.role === "owner"}
            readOnly={replay}
            invite={invite}
            onDone={() => setStep("done")}
            onAnswered={setInvite}
          />
        )}

        {/* Bước 4: Màn kết hoa nở vào khu vườn */}
        {step === "done" && (
          <div className="paper-card flex w-full max-w-md flex-col items-center gap-4 p-7 text-center animate-bloom">
            <div className="flex items-end justify-center gap-2 pt-2">
              <Flower kind="daisy" color="#e6a4b4" stem={95} className="h-24 w-auto" />
              <Flower kind="tulip" color="#d97a8c" stem={120} className="h-32 w-auto" />
              <Flower kind="lavender" color="#9c85c9" stem={108} className="h-28 w-auto" />
            </div>
            <h2 className="font-script text-4xl text-ink">Chúc mừng sinh nhật 🌷</h2>
            <p className="max-w-xs font-hand text-xl leading-relaxed text-ink-soft">
              Khu vườn của tụi mình bắt đầu từ hôm nay. Mỗi kỷ niệm đi qua sẽ mọc thêm một bông hoa ở đây.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-2 w-full text-base"
              disabled={busy}
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                setErr("");
                if (me.role === "partner" && !replay) {
                  const { error } = await supabaseBrowser()
                    .from("gift_progress")
                    .upsert({ user_id: me.user_id, completed_at: new Date().toISOString() });
                  if (error) {
                    setBusy(false);
                    setErr("Không lưu được tiến độ: " + error.message);
                    return;
                  }
                }
                router.push(settings.finale_occasion_id ? `/album/${settings.finale_occasion_id}` : "/vuon");
              }}
            >
              <IconGarden width={18} height={18} />
              <span>{settings.finale_occasion_id ? "Xem bông hoa đầu tiên" : "Bước vào khu vườn"}</span>
            </button>
          </div>
        )}
      </div>
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
    if (preview || readOnly || invite.answered_at) {
      onDone();
      return;
    }
    setBusy(true);
    setErr("");
    const { data, error } = await supabaseBrowser()
      .from("invitations")
      .update({ chosen, answered_at: new Date().toISOString() })
      .eq("id", invite.id)
      .is("answered_at", null)
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      setErr("Không lưu được lời nhận: " + (error?.message ?? "Hãy tải lại thiệp"));
      return;
    }
    onAnswered(data as Invitation);
    onDone();
  }

  return (
    <div className="paper-card w-full max-w-md animate-pop overflow-hidden">
      <div className="bg-blush-deep px-6 py-5 text-[var(--accent-on)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] opacity-85">Thiệp mời hẹn hò</p>
        <h2 className="mt-1 font-script text-4xl leading-tight">{invite.title}</h2>
      </div>
      <div className="space-y-4 p-6">
        {invite.message && <p className="font-hand text-xl leading-relaxed text-ink">{invite.message}</p>}
        {(invite.event_at || invite.dress_code) && (
          <dl className="space-y-1.5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] p-3.5 text-sm">
            {invite.event_at && (
              <div>
                <span className="font-semibold text-ink-soft">Thời gian:</span>{" "}
                <span className="font-medium text-ink">{formatDateTime(invite.event_at)}</span>
              </div>
            )}
            {invite.dress_code && (
              <div>
                <span className="font-semibold text-ink-soft">Trang phục:</span>{" "}
                <span className="font-medium text-ink">{invite.dress_code}</span>
              </div>
            )}
          </dl>
        )}

        {invite.options.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              {!invite.answered_at ? "Chọn chỗ ăn bạn thích nha:" : "Chỗ ăn đã chốt:"}
            </p>
            <div className="grid gap-2.5" role="radiogroup" aria-label="Chọn địa điểm hẹn hò">
              {invite.options.map((o, i) => {
                const picked = chosen === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    disabled={busy || readOnly || (!preview && !!invite.answered_at)}
                    onClick={() => setChosen(i)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                      picked
                        ? "border-blush-deep bg-blush/40 shadow-xs"
                        : "border-[var(--border-soft)] bg-[var(--surface-paper)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span className="text-3xl">{o.emoji ?? "🍽️"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{o.name}</span>
                      {o.note && <span className="block text-xs text-ink-soft">{o.note}</span>}
                    </span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        picked
                          ? "border-blush-deep bg-blush-deep text-[var(--accent-on)]"
                          : "border-[var(--border-strong)]"
                      }`}
                    >
                      {picked && <IconCheck width={13} height={13} strokeWidth={2.7} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 text-right">
          {err && (
            <p role="alert" className="text-left text-sm text-blush-deep">
              {err}
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            disabled={busy || (!readOnly && invite.options.length > 0 && chosen === null)}
            onClick={accept}
          >
            {readOnly || invite.answered_at ? "Tiếp nè →" : "Nhận lời hẹn 💌"}
          </button>
        </div>
      </div>
    </div>
  );
}
