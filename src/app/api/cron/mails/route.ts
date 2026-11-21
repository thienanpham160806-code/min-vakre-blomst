import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Gửi các mail hẹn giờ đã tới hạn (bảng scheduled_mails).
 * Gọi định kỳ (vd mỗi 5 phút) từ cron-job.org hoặc Vercel Cron, kèm header:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data: due, error } = await sb
    .from("scheduled_mails")
    .select("*")
    .is("sent_at", null)
    .lte("send_at", new Date().toISOString())
    .order("send_at")
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const m of due ?? []) {
    // Đánh dấu trước để hai lần gọi chồng nhau không gửi trùng
    const { data: claimed } = await sb
      .from("scheduled_mails")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", m.id)
      .is("sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    try {
      await sendMail({ to: m.to_email, subject: m.subject, heading: m.heading, body: m.body });
      results.push({ id: m.id, ok: true });
    } catch (e) {
      const msg = (e as Error).message;
      await sb.from("scheduled_mails").update({ sent_at: null, last_error: msg }).eq("id", m.id);
      results.push({ id: m.id, ok: false, error: msg });
    }
  }

  return NextResponse.json({ sent: results.filter((r) => r.ok).length, results });
}
