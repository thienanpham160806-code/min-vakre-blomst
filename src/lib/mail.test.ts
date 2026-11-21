import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn() } }));

import nodemailer from "nodemailer";
import { mailHtml, sendMail } from "./mail";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("Gmail SMTP", () => {
  it("thiếu thông tin thì báo lỗi trước khi kết nối", async () => {
    vi.stubEnv("GMAIL_USER", "");
    vi.stubEnv("GMAIL_APP_PASSWORD", "");
    await expect(sendMail({ to: "recipient@example.invalid", subject: "Test", body: "Test" })).rejects.toThrow("Chưa cấu hình");
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it("bỏ khoảng trắng trong app password và giữ nội dung mail", async () => {
    vi.stubEnv("GMAIL_USER", "sender@example.invalid");
    vi.stubEnv("GMAIL_APP_PASSWORD", "fake pass word only");
    vi.stubEnv("MAIL_FROM_NAME", "Khu vườn");
    const send = vi.fn().mockResolvedValue({});
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: send } as unknown as ReturnType<typeof nodemailer.createTransport>);
    await sendMail({ to: "recipient@example.invalid", subject: "Thư", heading: "Chào", body: "Nội dung" });
    expect(nodemailer.createTransport).toHaveBeenCalledWith({ service: "gmail", auth: { user: "sender@example.invalid", pass: "fakepasswordonly" } });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ from: { name: "Khu vườn", address: "sender@example.invalid" }, to: "recipient@example.invalid", text: "Chào\n\nNội dung" }));
  });

  it("lỗi SMTP được trả cho luồng gửi mail để thử lại", async () => {
    vi.stubEnv("GMAIL_USER", "sender@example.invalid");
    vi.stubEnv("GMAIL_APP_PASSWORD", "fake");
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: vi.fn().mockRejectedValue(new Error("SMTP unavailable")) } as unknown as ReturnType<typeof nodemailer.createTransport>);
    await expect(sendMail({ to: "recipient@example.invalid", subject: "Test", body: "Test" })).rejects.toThrow("SMTP unavailable");
  });

  it("escape nội dung trong HTML", () => {
    expect(mailHtml({ body: '<script>alert("x")</script>' })).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  });
});
