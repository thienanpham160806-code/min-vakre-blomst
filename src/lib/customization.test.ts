import { describe, expect, it } from "vitest";
import { BACKGROUNDS, FRAMES, LEGACY_BACKGROUNDS, backgroundClass, getBackgroundMeta } from "./backgrounds";
import { THEMES, DEFAULT_THEME, isThemeId } from "./themes";
import { FLOWER_COLOR_PALETTE, FLOWER_KINDS, getFlowerMeta } from "../components/Flower";
import { BUILTIN_STICKERS, STICKER_CATALOG, STICKER_CATEGORIES } from "../components/stickers";

describe("bộ tùy biến giao diện và scrapbook", () => {
  it("có đủ 6 theme hợp lệ với Giấy ngà là mặc định", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_THEME).toBe("ivory");
    expect(isThemeId("ivory")).toBe(true);
    expect(isThemeId("night")).toBe(true);
    expect(isThemeId("unknown")).toBe(false);
  });

  it("có ít nhất 12 mẫu giấy scrapbook và giữ tương thích toàn bộ nền cũ", () => {
    expect(BACKGROUNDS.length).toBeGreaterThanOrEqual(12);
    for (const legacy of LEGACY_BACKGROUNDS) {
      expect(getBackgroundMeta(legacy).value).toBe(legacy);
      expect(backgroundClass(legacy)).toBe(`paper-bg-${legacy}`);
    }
    expect(getBackgroundMeta("khong-ton-tai").value).toBe("ivory");
  });

  it("có ít nhất 8 loài hoa và bảng màu phối sẵn", () => {
    expect(FLOWER_KINDS.length).toBeGreaterThanOrEqual(8);
    expect(FLOWER_COLOR_PALETTE.length).toBeGreaterThanOrEqual(6);
    for (const oldKind of ["tulip", "daisy", "rose", "sunflower", "lavender"]) {
      expect(getFlowerMeta(oldKind).kind).toBe(oldKind);
    }
    expect(getFlowerMeta("la-hoa-moi").kind).toBe("tulip");
  });

  it("có ít nhất 24 sticker theo 5 nhóm và giữ tương thích key cũ", () => {
    expect(STICKER_CATALOG.length).toBeGreaterThanOrEqual(24);
    expect(STICKER_CATEGORIES).toHaveLength(5);
    for (const cat of STICKER_CATEGORIES) {
      expect(STICKER_CATALOG.filter((s) => s.category === cat.id).length).toBeGreaterThanOrEqual(4);
    }
    for (const legacyKey of [
      "heart",
      "heart-outline",
      "star",
      "sparkle",
      "bow",
      "cloud",
      "ticket",
      "stamp",
      "tape-pink",
      "tape-mint",
      "bubble",
      "arrow",
      "flower-tulip",
      "flower-daisy",
      "flower-sunflower",
    ]) {
      expect(BUILTIN_STICKERS[legacyKey]).toBeDefined();
    }
  });

  it("có đủ 6 kiểu khung ảnh gồm cả 4 kiểu cũ", () => {
    expect(FRAMES.length).toBeGreaterThanOrEqual(6);
    const values = FRAMES.map((f) => f.value);
    expect(values).toEqual(expect.arrayContaining(["polaroid", "plain", "tape", "round", "film", "paper"]));
  });
});
