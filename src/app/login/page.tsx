"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flower } from "@/components/Flower";
import { IconBack, IconLock } from "@/components/icons";
import { Label } from "@/components/Sheet";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const sb = supabaseBrowser();
    let { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: code });
    // Nếu gõ kèm dấu gạch chéo/gạch nối (vd 01/01/2000) thì thử lại chỉ lấy phần số
    const digits = code.replace(/\D/g, "");
    if (error && digits !== code && digits.length >= 6) {
      ({ error } = await sb.auth.signInWithPassword({ email: email.trim(), password: digits }));
    }
    setBusy(false);
    if (error) return setError("Mật mã chưa đúng rồi, thử nhớ lại xem nha 🥺");
    const { data: auth } = await sb.auth.getUser();
    if (!auth.user) return setError("Phiên đăng nhập chưa sẵn sàng. Thử đăng nhập lại nha.");
    const [{ data: member }, { data: progress }] = await Promise.all([
      sb.from("members").select("role").eq("user_id", auth.user.id).maybeSingle(),
      sb.from("gift_progress").select("completed_at").eq("user_id", auth.user.id).maybeSingle(),
    ]);
    router.replace(member?.role === "owner" || progress ? "/vuon" : "/qua");
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="btn btn-ghost absolute left-4 top-4 min-h-10 px-3 text-sm sm:left-6 sm:top-6"
      >
        <IconBack width={16} height={16} />
        <span>Đếm ngược</span>
      </Link>

      <div className="relative w-full max-w-sm animate-pop">
        {/* Bông tulip điểm nhẹ góc trên thiệp đăng nhập */}
        <div className="pointer-events-none absolute -top-12 right-4 h-20 opacity-90" aria-hidden>
          <Flower kind="tulip" color="#d97a8c" stem={95} className="h-full w-auto" />
        </div>

        <form onSubmit={submit} className="paper-card relative space-y-5 p-6 sm:p-8">
          <div className="space-y-1 text-center">
            <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-blush text-blush-deep">
              <IconLock width={20} height={20} />
            </span>
            <h1 className="pt-1 font-script text-4xl text-ink">min vakre blomst</h1>
            <p className="font-hand text-lg text-ink-soft">
              {process.env.NEXT_PUBLIC_LOGIN_HINT ?? "Nhập mật mã riêng của hai đứa để mở cổng vườn"}
            </p>
          </div>

          <div className="space-y-3.5">
            <label className="block">
              <Label>Email</Label>
              <input
                className="field"
                type="email"
                placeholder="ban@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <Label>Mật mã</Label>
              <input
                className="field text-center text-lg tracking-[0.26em]"
                type="password"
                inputMode="numeric"
                placeholder="••••••••"
                autoComplete="current-password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-blush-deep/30 bg-blush/35 px-3 py-2 text-center font-hand text-lg text-blush-deep"
            >
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Đang mở cổng…" : "Mở cửa khu vườn"}
          </button>
        </form>
      </div>
    </main>
  );
}
