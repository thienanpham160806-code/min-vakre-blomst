export type Role = "owner" | "partner";

export type Member = {
  user_id: string;
  display_name: string;
  role: Role;
  email: string | null;
};

export type Settings = {
  unlock_at: string;
  together_since: string | null;
};

export type FlowerKind = "tulip" | "daisy" | "rose" | "sunflower" | "lavender";
export type Background = "kraft" | "grid" | "dots" | "blush" | "night";

export type Occasion = {
  id: string;
  title: string;
  happened_on: string;
  description: string | null;
  flower: FlowerKind;
  color: string;
  background: Background;
  created_at: string;
};

export type ItemKind = "photo" | "video" | "sticker" | "text" | "drive";

export type ItemStyle = {
  frame?: "polaroid" | "plain" | "tape" | "round";
  caption?: string;
  font?: "hand" | "script" | "round" | "sans";
  color?: string;
  aspect?: number; // cao / rộng của ảnh/video, để giữ đúng tỉ lệ
  size?: number; // cỡ chữ (đơn vị khung 1000px)
};

export type AlbumItem = {
  id: string;
  occasion_id: string;
  kind: ItemKind;
  storage_path: string | null;
  drive_url: string | null;
  drive_name: string | null;
  content: string | null;
  x: number;
  y: number;
  width: number;
  rotation: number;
  z: number;
  style: ItemStyle;
  created_by: string | null;
};

export type Letter = {
  id: string;
  title: string;
  body: string;
  open_at: string | null;
  is_birthday: boolean;
  author: string | null;
  created_at: string;
};

export type InvitationOption = { name: string; note?: string; emoji?: string };

export type Invitation = {
  id: string;
  title: string;
  message: string | null;
  event_at: string | null;
  dress_code: string | null;
  options: InvitationOption[];
  chosen: number | null;
  answered_at: string | null;
  is_birthday: boolean;
};

export type Coupon = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  created_by: string | null;
  redeemed_at: string | null;
  redeemed_by: string | null;
};

export type Wish = {
  id: string;
  title: string;
  done_at: string | null;
  occasion_id: string | null;
};

export type ScheduledMail = {
  id: string;
  to_email: string;
  subject: string;
  heading: string | null;
  body: string;
  send_at: string;
  sent_at: string | null;
  last_error: string | null;
};
