import { expect, it } from "vitest";
import { remainingMs } from "./unlock";

const info = { unlock_at: "2027-01-18T00:00:00+07:00", server_now: "2027-01-17T23:59:50+07:00" };
it("dùng giờ máy chủ dù giờ máy người dùng lệch", () => {
  expect(remainingMs(info)).toBe(10_000);
  expect(remainingMs(info, 3500)).toBe(6500);
});
it("mở đúng mốc và không âm sau mốc", () => {
  expect(remainingMs(info, 10_000)).toBe(0);
  expect(remainingMs(info, 11_000)).toBe(0);
});
it("đổi giờ mở có hiệu lực với mẫu máy chủ mới", () => {
  expect(remainingMs({ ...info, unlock_at: info.server_now })).toBe(0);
});
