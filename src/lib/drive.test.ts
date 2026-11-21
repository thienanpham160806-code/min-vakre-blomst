import { describe, expect, it } from "vitest";
import { normalizeDriveUrl } from "./drive";

describe("liên kết Drive", () => {
  const id = "Abcd_12345-xyz";
  it.each([`https://drive.google.com/file/d/${id}/view?usp=sharing`, `https://drive.google.com/open?id=${id}`, ` https://drive.google.com/file/d/${id}/preview `])("chuẩn hoá %s", (url) => {
    expect(normalizeDriveUrl(url)).toBe(`https://drive.google.com/file/d/${id}/view`);
  });
  it.each([
    `https://drive.google.com/drive/folders/${id}`,
    `https://docs.google.com/file/d/${id}/view`,
    `http://drive.google.com/file/d/${id}/view`,
    `https://drive.google.com.evil.com/file/d/${id}/view`,
    "https://drive.google.com/file/d/short/view",
    "https://drive.google.com/open?id=invalid!1234567",
    `https://evil@drive.google.com/file/d/${id}/view`,
    "không phải link",
  ])("từ chối %s", (url) => expect(() => normalizeDriveUrl(url)).toThrow());
});
