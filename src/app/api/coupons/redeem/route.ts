import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { supabaseServer } from "@/lib/supabase/server";

/** Dùng một phiếu ưu đãi, rồi mail báo cho người tặng phiếu. */
export async function POST(request: Request) {
  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const sb = await supabaseServer();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { data: coupon, error } = await sb
    .from("coupons")
    .update({ redeemed_at: new Date().toISOString(), redeemed_by: auth.user.id })
    .eq("id", id)
    .is("redeemed_at", null)
    .neq("created_by", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!coupon) return NextResponse.json({ error: "Phiếu đã dùng rồi hoặc không phải phiếu được tặng" }, { status: 409 });

  // Mail cho người tặng (không chặn nếu mail lỗi)
  let mailed = false;
  const { data: members } = await sb.from("members").select("user_id, display_name, email");
  const giver = members?.find((m) => m.user_id === coupon.created_by);
  const taker = members?.find((m) => m.user_id === auth.user!.id);
  if (giver?.email) {
    try {
      await sendMail({
        to: giver.email,
        subject: `${taker?.display_name ?? "Ẻm"} vừa dùng phiếu: ${coupon.title} ${coupon.emoji}`,
        heading: `${coupon.emoji} ${coupon.title}`,
        body: `${taker?.display_name ?? "Ẻm"} vừa dùng phiếu này rồi đó. Chuẩn bị thực hiện lời hứa nha!${coupon.description ? `\n\n“${coupon.description}”` : ""}`,
      });
      mailed = true;
    } catch {
      // bỏ qua, phiếu vẫn được tính là đã dùng
    }
  }

  return NextResponse.json({ coupon, mailed });
}
