import type { Background, FlowerKind, FrameKind } from "./types";

export type BackgroundGroup = "co-ban" | "so-tay" | "thuc-vat" | "mau-sac";

export type BackgroundOption = {
  value: Background;
  label: string;
  group: BackgroundGroup;
  description: string;
  isDark?: boolean;
};

export const DEFAULT_BACKGROUND: Background = "ivory";

export const LEGACY_BACKGROUNDS = new Set<Background>(["kraft", "grid", "dots", "blush", "night"]);
export const LEGACY_FLOWERS = new Set<FlowerKind>(["tulip", "daisy", "rose", "sunflower", "lavender"]);

export const BACKGROUND_GROUPS: { id: "all" | BackgroundGroup; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "co-ban", label: "Giấy thủ công" },
  { id: "so-tay", label: "Sổ tay" },
  { id: "thuc-vat", label: "Thực vật" },
  { id: "mau-sac", label: "Màu dịu" },
];

export const BACKGROUNDS: BackgroundOption[] = [
  { value: "ivory", label: "Giấy ngà", group: "co-ban", description: "Giấy bông ngà ấm, tôn màu ảnh thật" },
  { value: "kraft", label: "Giấy kraft", group: "co-ban", description: "Giấy xi măng ấm áp, thớ giấy tự nhiên" },
  { value: "linen", label: "Vải bố mịn", group: "co-ban", description: "Sợi vải đan nhẹ như bìa sổ tay vải" },
  { value: "torn", label: "Giấy xé mép", group: "co-ban", description: "Tờ giấy kem xé tay đặt trên nền kraft" },
  { value: "lined", label: "Giấy kẻ ngang", group: "so-tay", description: "Dòng kẻ thư tay kèm lề hồng mảnh" },
  { value: "grid", label: "Giấy ô ly", group: "so-tay", description: "Ô vuông mảnh kiểu sổ ghi chép học trò" },
  { value: "dots", label: "Chấm bi", group: "so-tay", description: "Chấm nhỏ đều mắt kiểu bullet journal" },
  { value: "gingham", label: "Caro picnic", group: "so-tay", description: "Sọc caro dịu cho buổi dã ngoại" },
  { value: "botanical", label: "Cành lá nhẹ", group: "thuc-vat", description: "Giấy ngà điểm nhánh lá màu nước ở góc" },
  { value: "sage", label: "Xanh lá trầm", group: "thuc-vat", description: "Sắc lá khô êm mắt, hợp ảnh sáng" },
  { value: "blush", label: "Hồng phấn", group: "mau-sac", description: "Lớp màu nước hồng đất phai nhẹ" },
  { value: "night", label: "Trời sao", group: "mau-sac", description: "Nền đêm sâu điểm bụi sao lấp lánh", isDark: true },
];

const BG_MAP = new Map(BACKGROUNDS.map((b) => [b.value, b]));

export function getBackgroundMeta(bg: string | null | undefined): BackgroundOption {
  if (bg && BG_MAP.has(bg as Background)) return BG_MAP.get(bg as Background)!;
  return BG_MAP.get(DEFAULT_BACKGROUND)!;
}

export function backgroundClass(bg: string | null | undefined): string {
  const meta = getBackgroundMeta(bg);
  return `paper-bg-${meta.value}`;
}

export type FrameOption = {
  value: FrameKind;
  label: string;
  note: string;
};

export const FRAMES: FrameOption[] = [
  { value: "polaroid", label: "Polaroid", note: "Viền trắng dày phía dưới để ghi chú thích" },
  { value: "plain", label: "Bo góc", note: "Gọn gàng, bo nhẹ bốn góc ảnh" },
  { value: "tape", label: "Băng keo", note: "Viền trắng dán mảnh washi tape ở đầu" },
  { value: "paper", label: "Viền giấy", note: "Lót giấy thủ công có góc cài ảnh cổ điển" },
  { value: "film", label: "Viền phim", note: "Khung phim 35mm đục lỗ hai bên" },
  { value: "round", label: "Ảnh tròn", note: "Khung tròn viền kem như huy hiệu nhỏ" },
];
