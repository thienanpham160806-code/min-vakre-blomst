"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
    // Ẻm gõ "18/01/2024" hay "18-01-2024" thì thử lại với chỉ phần số
    const digits = code.replace(/\D/g, "");
    if (error && digits !== code && digits.length >= 6) {
      ({ error } = await sb.auth.signInWithPassword({ email: email.trim(), password: digits }));
    }
    setBusy(false);
    if (error) return setError("Sai rồi, thử nhớ lại xem 🥺");
    const { data: auth } = await sb.auth.getUser();
    const { data: progress } = await sb.from("gift_progress").select("completed_at").eq("user_id", auth.user!.id).maybeSingle();
    router.replace(progress ? "/vuon" : "/qua");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-blush p-6">
      <form onSubmit={submit} className="paper-card w-full max-w-sm space-y-4 p-7 animate-pop">
        <h1 className="text-center font-script text-4xl">min vakre blomst</h1>
        <p className="text-center font-hand text-lg text-ink-soft">
          {process.env.NEXT_PUBLIC_LOGIN_HINT ?? "Nhập mật mã của tụi mình"}
        </p>
        <input className="field" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field text-center text-xl tracking-[0.3em]" type="password" inputMode="numeric" placeholder="••••••••" autoComplete="current-password" value={code} onChange={(e) => setCode(e.target.value)} required />
        {error && <p className="text-center font-hand text-lg text-blush-deep">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Đang mở…" : "Mở cửa vườn"}</button>
      </form>
    </main>
  );
}
