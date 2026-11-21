import "server-only";

import { Resend } from "resend";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Khung mail chung: nền hồng, chữ viết tay, nút dẫn về web. */
export function mailHtml({ heading, body, cta = "Mở khu vườn" }: { heading?: string | null; body: string; cta?: string }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `<!doctype html><html><body style="margin:0;background:#fde2ea;padding:32px 12px;font-family:Georgia,serif;color:#3d2b2b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:480px;background:#fffdf9;border-radius:20px;padding:32px 28px;text-align:center">
      <tr><td style="font-size:44px">🌷</td></tr>
      <tr><td style="font-size:13px;letter-spacing:3px;color:#a07a7a;padding-top:6px">MIN VAKRE BLOMST</td></tr>
      ${heading ? `<tr><td style="font-size:28px;padding-top:14px">${esc(heading)}</td></tr>` : ""}
      <tr><td style="font-size:17px;line-height:1.6;padding-top:14px;white-space:pre-wrap">${esc(body)}</td></tr>
      ${site ? `<tr><td style="padding-top:26px"><a href="${site}" style="background:#e0708f;color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-family:Arial,sans-serif;font-weight:bold">${esc(cta)}</a></td></tr>` : ""}
    </table>
  </td></tr></table></body></html>`;
}

export async function sendMail({ to, subject, heading, body }: { to: string; subject: string; heading?: string | null; body: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Chưa cấu hình RESEND_API_KEY");
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM ?? "min vakre blomst <onboarding@resend.dev>",
    to,
    subject,
    html: mailHtml({ heading, body }),
    text: [heading, body].filter(Boolean).join("\n\n"),
  });
  if (error) throw new Error(error.message);
}
