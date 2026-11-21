"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BUILTIN_STICKERS,
  EMOJI_STICKERS,
  STICKER_CATALOG,
  STICKER_CATEGORIES,
  StickerView,
  type StickerCategoryId,
} from "@/components/stickers";
import {
  IconBack,
  IconCheck,
  IconClose,
  IconCopy,
  IconDrive,
  IconEye,
  IconFrame,
  IconLayerDown,
  IconLayerUp,
  IconMinus,
  IconPanel,
  IconPaper,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconReset,
  IconRotateCcw,
  IconRotateCw,
  IconSticker,
  IconTrash,
  IconType,
  Sprout,
} from "@/components/icons";
import { Label, Sheet } from "@/components/Sheet";
import {
  BACKGROUND_GROUPS,
  BACKGROUNDS,
  DEFAULT_BACKGROUND,
  FRAMES,
  backgroundClass,
  getBackgroundMeta,
  type BackgroundGroup,
} from "@/lib/backgrounds";
import { normalizeDriveUrl } from "@/lib/drive";
import { formatDate } from "@/lib/format";
import {
  MAX_VIDEO_MB,
  compressImage,
  removeUnusedFiles,
  signedUrls,
  uploadToBucket,
  videoAspect,
} from "@/lib/media";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AlbumItem, Background, FrameKind, ItemStyle, Occasion } from "@/lib/types";
import { FONT_CLASS, FrameThumb, ItemView } from "./item-view";

/** Khung logic của một trang: 1000 x 1400. Mọi toạ độ lưu trong DB theo khung này để nhất quán mọi thiết bị. */
const PAGE_W = 1000;
const PAGE_H = 1400;

function randomPlacement() {
  return {
    x: Math.round(PAGE_W / 2 + (Math.random() - 0.5) * 180),
    y: Math.round(PAGE_H / 2 + (Math.random() - 0.5) * 260),
    rotation: Math.round((Math.random() - 0.5) * 10),
  };
}

type Pt = { x: number; y: number };
type Snapshot = Pick<AlbumItem, "x" | "y" | "width" | "rotation"> & { size?: number };
type Gesture =
  | { mode: "drag"; id: string; start: Pt; snap: Snapshot }
  | { mode: "pinch"; id: string; d0: number; a0: number; c0: Pt; snap: Snapshot }
  | { mode: "handle"; id: string; v0: Pt; snap: Snapshot };

type SaveState = "idle" | "saving" | "saved" | "error";
type StudioTab = "add" | "sticker" | "paper" | "selected";
type MobileSheet = null | "sticker" | "text" | "background" | "frame" | "adjust" | "info" | "drive";

const TEXT_COLORS = [
  { hex: "#332723", label: "Mực nâu đậm" },
  { hex: "#a84a5a", label: "Hồng đất" },
  { hex: "#4a6c4d", label: "Xanh lá trầm" },
  { hex: "#3c6278", label: "Xanh mưa" },
  { hex: "#6d4f92", label: "Oải hương" },
  { hex: "#b57d2b", label: "Vàng mật" },
  { hex: "#ffffff", label: "Trắng kem" },
];

export function Scrapbook() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sb = supabaseBrowser();

  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [items, setItems] = useState<AlbumItem[]>([]);
  const confirmed = useRef(new Map<string, AlbumItem>());
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [studioTab, setStudioTab] = useState<StudioTab>("add");
  const [tabletDrawerOpen, setTabletDrawerOpen] = useState(true);
  const [sheet, setSheet] = useState<MobileSheet>(null);

  const [stickerCat, setStickerCat] = useState<StickerCategoryId | "emoji">("hoa-la");
  const [bgGroup, setBgGroup] = useState<"all" | BackgroundGroup>("all");
  const [bgPreview, setBgPreview] = useState<Background | null>(null);

  const [textDraft, setTextDraft] = useState<{
    id?: string;
    content: string;
    font: NonNullable<ItemStyle["font"]>;
    color: string;
  }>({ content: "", font: "hand", color: TEXT_COLORS[0].hex });
  const [captionDraft, setCaptionDraft] = useState<{ id: string; text: string } | null>(null);

  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");
  const [driveError, setDriveError] = useState("");
  const [driveBusy, setDriveBusy] = useState(false);
  const [largeVideo, setLargeVideo] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [notice, setNotice] = useState("");
  const [deleted, setDeleted] = useState<AlbumItem[]>([]);
  const saveResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeletes = useRef(new Map<string, { item: AlbumItem; timer: ReturnType<typeof setTimeout> }>());

  useEffect(() => {
    const pending = pendingDeletes.current;
    return () => {
      if (saveResetTimer.current) clearTimeout(saveResetTimer.current);
      for (const entry of pending.values()) clearTimeout(entry.timer);
    };
  }, []);

  const markSaved = useCallback(() => {
    setSaveState("saved");
    if (saveResetTimer.current) clearTimeout(saveResetTimer.current);
    saveResetTimer.current = setTimeout(() => setSaveState("idle"), 2800);
  }, []);

  const markSaveError = useCallback((msg: string) => {
    setSaveState("error");
    setNotice(msg);
  }, []);

  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.36);
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<Gesture | null>(null);
  const stageTapStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const sel = items.find((i) => i.id === selected) ?? null;

  // ───────────── Tải dữ liệu & Realtime ─────────────
  const resolveUrls = useCallback(async (list: AlbumItem[]) => {
    const paths = list.map((i) => i.storage_path).filter((p): p is string => Boolean(p));
    if (paths.length) {
      const map = await signedUrls(paths);
      setUrls((u) => ({ ...u, ...map }));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([
      sb.from("occasions").select("*").eq("id", id).maybeSingle(),
      sb.from("album_items").select("*").eq("occasion_id", id).order("z"),
    ]).then(([o, it]) => {
      if (!alive) return;
      if (o.error || it.error) {
        setLoadErr("Không tải được nội dung album. Hãy thử tải lại trang.");
      }
      setOccasion((o.data as Occasion) ?? null);
      const list = (it.data as AlbumItem[]) ?? [];
      confirmed.current = new Map(list.map((item) => [item.id, item]));
      setItems(list);
      setLoaded(true);
      resolveUrls(list);
    });

    const channel = sb
      .channel(`album:${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "album_items", filter: `occasion_id=eq.${id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            confirmed.current.delete((payload.old as AlbumItem).id);
            setItems((l) => l.filter((i) => i.id !== (payload.old as AlbumItem).id));
            return;
          }
          const row = payload.new as AlbumItem;
          confirmed.current.set(row.id, row);
          if (gesture.current?.id === row.id) return;
          setItems((l) =>
            l.some((i) => i.id === row.id) ? l.map((i) => (i.id === row.id ? row : i)) : [...l, row],
          );
          resolveUrls([row]);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      sb.removeChannel(channel);
    };
  }, [id, sb, resolveUrls]);

  // ───────────── Tỉ lệ khung theo bề ngang thực tế ─────────────
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setScale(w / PAGE_W);
    };
    measure();
    const ro = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setScale(entry.contentRect.width / PAGE_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [loaded, editing, tabletDrawerOpen]);

  // ───────────── Lưu & hoàn tác ─────────────
  const patch = useCallback((itemId: string, changes: Partial<AlbumItem>) => {
    setItems((l) => l.map((i) => (i.id === itemId ? { ...i, ...changes } : i)));
  }, []);

  const persist = useCallback(
    async (itemId: string, changes: Partial<AlbumItem>) => {
      setSaveState("saving");
      const { data, error } = await sb
        .from("album_items")
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq("id", itemId)
        .select()
        .single();
      if (error || !data) {
        const previous = confirmed.current.get(itemId);
        if (previous) patch(itemId, previous);
        markSaveError("Lưu thất bại: " + (error?.message ?? "Mục không còn tồn tại"));
        const result = await sb.from("album_items").select("*").eq("occasion_id", id).order("z");
        if (!result.error) {
          confirmed.current = new Map((result.data as AlbumItem[]).map((item) => [item.id, item]));
          setItems(result.data as AlbumItem[]);
        } else {
          setEditing(false);
          markSaveError("Không tải lại được trang. Hãy tải lại trước khi sửa tiếp.");
        }
        return false;
      }
      confirmed.current.set(itemId, data as AlbumItem);
      patch(itemId, data as AlbumItem);
      markSaved();
      return true;
    },
    [id, markSaveError, markSaved, patch, sb],
  );

  async function undo(item: AlbumItem) {
    const entry = pendingDeletes.current.get(item.id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pendingDeletes.current.delete(item.id);
    setDeleted((list) => list.filter((i) => i.id !== item.id));
    setSaveState("saving");
    const { error } = await sb.from("album_items").insert(item);
    if (error) {
      markSaveError("Không hoàn tác được: " + error.message);
      return;
    }
    confirmed.current.set(item.id, item);
    setItems((list) => (list.some((i) => i.id === item.id) ? list : [...list, item]));
    markSaved();
  }

  const maxZ = () => itemsRef.current.reduce((m, i) => Math.max(m, i.z), 0);

  async function addItem(partial: Partial<AlbumItem> & Pick<AlbumItem, "kind">) {
    setSaveState("saving");
    const row = {
      occasion_id: id,
      ...randomPlacement(),
      width: 400,
      z: maxZ() + 1,
      style: {},
      ...partial,
    };
    const { data, error } = await sb.from("album_items").insert(row).select().single();
    if (error || !data) {
      markSaveError("Không thêm được mục mới: " + (error?.message ?? "Thử lại nha."));
      return null;
    }
    const item = data as AlbumItem;
    confirmed.current.set(item.id, item);
    setItems((l) => (l.some((i) => i.id === item.id) ? l : [...l, item]));
    setSelected(item.id);
    setStudioTab("selected");
    markSaved();
    return item;
  }

  const removeItem = useCallback(
    async (item: AlbumItem) => {
      setSaveState("saving");
      const { data, error } = await sb.from("album_items").delete().eq("id", item.id).select("id").single();
      if (error || !data) {
        markSaveError("Không xóa được: " + (error?.message ?? "Mục không còn tồn tại"));
        return;
      }
      confirmed.current.delete(item.id);
      setItems((l) => l.filter((i) => i.id !== item.id));
      setSelected(null);
      setDeleted((list) => [...list, item]);
      markSaved();
      const timer = setTimeout(async () => {
        pendingDeletes.current.delete(item.id);
        setDeleted((list) => list.filter((i) => i.id !== item.id));
        if (
          item.storage_path &&
          ![...pendingDeletes.current.values()].some((p) => p.item.storage_path === item.storage_path)
        ) {
          await removeUnusedFiles([item.storage_path]);
        }
      }, 6000);
      pendingDeletes.current.set(item.id, { item, timer });
    },
    [markSaveError, markSaved, sb],
  );

  async function duplicate(item: AlbumItem) {
    const { id: _omit, ...rest } = item;
    void _omit;
    await addItem({ ...rest, x: Math.min(920, item.x + 42), y: Math.min(1320, item.y + 42) });
  }

  async function applyBackground(bg: Background) {
    if (!occasion) return;
    const previous = occasion;
    setOccasion({ ...occasion, background: bg });
    setBgPreview(null);
    setSaveState("saving");
    const { error } = await sb.from("occasions").update({ background: bg }).eq("id", occasion.id).select("id").single();
    if (error) {
      setOccasion(previous);
      markSaveError("Không đổi được giấy nền: " + error.message);
      return;
    }
    markSaved();
  }

  function updateItemSize(item: AlbumItem, nextWidth: number) {
    const width = Math.round(Math.min(1400, Math.max(80, nextWidth)));
    const ratio = width / Math.max(1, item.width);
    const changes: Partial<AlbumItem> = {
      width,
      ...(item.kind === "text" ? { style: { ...item.style, size: Math.round((item.style.size ?? 56) * ratio) } } : {}),
    };
    patch(item.id, changes);
    void persist(item.id, changes);
  }

  function updateItemRotation(item: AlbumItem, nextRotation: number) {
    const rotation = Math.round(((nextRotation + 180) % 360 + 360) % 360 - 180);
    patch(item.id, { rotation });
    void persist(item.id, { rotation });
  }

  function updateItemFrame(item: AlbumItem, frame: FrameKind) {
    const style = { ...item.style, frame };
    patch(item.id, { style });
    void persist(item.id, { style });
  }

  function savePhotoCaption(item: AlbumItem, caption: string) {
    const trimmed = caption.trim();
    const style: ItemStyle = {
      ...item.style,
      caption: trimmed || undefined,
      frame: trimmed ? "polaroid" : item.style.frame ?? "polaroid",
    };
    patch(item.id, { style });
    void persist(item.id, { style });
  }

  // ───────────── Phím tắt cho người dùng laptop / bàn phím rời ─────────────
  useEffect(() => {
    if (!editing || !selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        return;
      }
      const item = itemsRef.current.find((i) => i.id === selected);
      if (!item) return;

      const step = e.shiftKey ? 24 : 8;
      if (e.key === "Escape") {
        setSelected(null);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const x = Math.max(20, item.x - step);
        patch(item.id, { x });
        void persist(item.id, { x });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const x = Math.min(PAGE_W - 20, item.x + step);
        patch(item.id, { x });
        void persist(item.id, { x });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const y = Math.max(20, item.y - step);
        patch(item.id, { y });
        void persist(item.id, { y });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const y = Math.min(PAGE_H - 20, item.y + step);
        patch(item.id, { y });
        void persist(item.id, { y });
      } else if (e.key === "[") {
        e.preventDefault();
        const rotation = Math.round(item.rotation - 5);
        patch(item.id, { rotation });
        void persist(item.id, { rotation });
      } else if (e.key === "]") {
        e.preventDefault();
        const rotation = Math.round(item.rotation + 5);
        patch(item.id, { rotation });
        void persist(item.id, { rotation });
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        const width = Math.max(80, Math.round(item.width - 24));
        const ratio = width / Math.max(1, item.width);
        const changes: Partial<AlbumItem> = {
          width,
          ...(item.kind === "text" ? { style: { ...item.style, size: Math.round((item.style.size ?? 56) * ratio) } } : {}),
        };
        patch(item.id, changes);
        void persist(item.id, changes);
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        const width = Math.min(1400, Math.round(item.width + 24));
        const ratio = width / Math.max(1, item.width);
        const changes: Partial<AlbumItem> = {
          width,
          ...(item.kind === "text" ? { style: { ...item.style, size: Math.round((item.style.size ?? 56) * ratio) } } : {}),
        };
        patch(item.id, changes);
        void persist(item.id, changes);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        void removeItem(item);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, selected, patch, persist, removeItem]);

  // ───────────── Tải ảnh / video ─────────────
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    for (let n = 0; n < list.length; n++) {
      const f = list[n];
      setUploading(`Đang tải ${n + 1}/${list.length}…`);
      try {
        if (f.type.startsWith("video/")) {
          if (f.size > MAX_VIDEO_MB * 1024 * 1024) {
            setLargeVideo(f.name);
            continue;
          }
          const aspect = await videoAspect(f);
          const path = await uploadToBucket(id, f, f.name.split(".").pop() || "mp4", f.type);
          const item = await addItem({ kind: "video", storage_path: path, width: 460, style: { frame: "plain", aspect } });
          if (item) resolveUrls([item]);
        } else if (f.type.startsWith("image/")) {
          const { blob, aspect, ext } = await compressImage(f);
          const path = await uploadToBucket(id, blob, ext);
          const item = await addItem({ kind: "photo", storage_path: path, width: 420, style: { frame: "polaroid", aspect } });
          if (item) resolveUrls([item]);
        }
      } catch (e) {
        markSaveError("Tải tệp thất bại: " + (e as Error).message);
      }
    }
    setUploading(null);
  }

  async function onCustomSticker(file: File | undefined) {
    if (!file) return;
    setSheet(null);
    setUploading("Đang tải sticker…");
    try {
      const { blob, ext } = await compressImage(file, 800);
      const path = await uploadToBucket(`${id}/stickers`, blob, ext);
      const item = await addItem({ kind: "sticker", storage_path: path, width: 260 });
      if (item) resolveUrls([item]);
    } catch (e) {
      markSaveError("Không tải được sticker: " + (e as Error).message);
    } finally {
      setUploading(null);
    }
  }

  // ───────────── Kéo, xoay, phóng to (không giành thao tác cuộn trang trên cảm ứng) ─────────────
  const toPage = (e: { clientX: number; clientY: number }): Pt => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };
  const snapOf = (i: AlbumItem): Snapshot => ({
    x: i.x,
    y: i.y,
    width: i.width,
    rotation: i.rotation,
    size: i.style.size,
  });

  function startPinchIfTwo(itemId: string) {
    const pts = [...pointers.current.values()];
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (pts.length < 2 || !item) return;
    const [a, b] = pts;
    gesture.current = {
      mode: "pinch",
      id: itemId,
      d0: Math.max(10, Math.hypot(b.x - a.x, b.y - a.y)),
      a0: Math.atan2(b.y - a.y, b.x - a.x),
      c0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      snap: snapOf(item),
    };
  }

  function onItemPointerDown(e: React.PointerEvent, item: AlbumItem) {
    if (!editing) return;
    e.stopPropagation();
    stageTapStart.current = null;
    stageRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, toPage(e));
    setSelected(item.id);
    setStudioTab("selected");
    if (pointers.current.size === 1) {
      gesture.current = { mode: "drag", id: item.id, start: toPage(e), snap: snapOf(item) };
    } else {
      startPinchIfTwo(item.id);
    }
  }

  function onHandlePointerDown(e: React.PointerEvent, item: AlbumItem) {
    e.stopPropagation();
    stageTapStart.current = null;
    stageRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, toPage(e));
    const p = toPage(e);
    gesture.current = { mode: "handle", id: item.id, v0: { x: p.x - item.x, y: p.y - item.y }, snap: snapOf(item) };
  }

  function onStagePointerDown(e: React.PointerEvent) {
    if (!editing) return;
    // Chỉ bắt pointer trên nền trống nếu đang có ngón 1 giữ món đồ (để hỗ trợ chụm 2 ngón).
    // Nếu chạm 1 ngón lên nền giấy trống: KHÔNG capture pointer để trình duyệt cuộn trang mượt mà!
    if (selected && pointers.current.size === 1) {
      stageRef.current?.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, toPage(e));
      startPinchIfTwo(selected);
      return;
    }
    stageTapStart.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (stageTapStart.current && stageTapStart.current.id === e.pointerId) {
      const moved = Math.hypot(e.clientX - stageTapStart.current.x, e.clientY - stageTapStart.current.y);
      if (moved > 8) stageTapStart.current = null; // người dùng đang cuộn trang
    }
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, toPage(e));
    const g = gesture.current;
    if (!g) return;
    const item = itemsRef.current.find((i) => i.id === g.id);
    if (!item) return;

    const apply = (k: number, rot: number, x: number, y: number) => {
      const width = Math.min(1400, Math.max(80, g.snap.width * k));
      const ratio = width / Math.max(1, g.snap.width);
      patch(g.id, {
        x,
        y,
        width,
        rotation: rot,
        ...(item.kind === "text" ? { style: { ...item.style, size: (g.snap.size ?? 56) * ratio } } : {}),
      });
    };

    if (g.mode === "drag") {
      const p = toPage(e);
      patch(g.id, {
        x: Math.min(PAGE_W + 120, Math.max(-120, g.snap.x + p.x - g.start.x)),
        y: Math.min(PAGE_H + 120, Math.max(-120, g.snap.y + p.y - g.start.y)),
      });
    } else if (g.mode === "pinch") {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const [a, b] = pts;
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      apply(
        d / g.d0,
        g.snap.rotation + ((ang - g.a0) * 180) / Math.PI,
        g.snap.x + c.x - g.c0.x,
        g.snap.y + c.y - g.c0.y,
      );
    } else {
      const p = toPage(e);
      const v = { x: p.x - g.snap.x, y: p.y - g.snap.y };
      const k = Math.hypot(v.x, v.y) / Math.max(1, Math.hypot(g.v0.x, g.v0.y));
      const rot = g.snap.rotation + ((Math.atan2(v.y, v.x) - Math.atan2(g.v0.y, g.v0.x)) * 180) / Math.PI;
      apply(k, rot, g.snap.x, g.snap.y);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (stageTapStart.current && stageTapStart.current.id === e.pointerId) {
      setSelected(null);
      stageTapStart.current = null;
    }
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (pointers.current.size === 1 && g.mode === "pinch") {
      const item = itemsRef.current.find((i) => i.id === g.id);
      const [p] = [...pointers.current.values()];
      if (item) gesture.current = { mode: "drag", id: g.id, start: p, snap: snapOf(item) };
      return;
    }
    if (pointers.current.size === 0) {
      const item = itemsRef.current.find((i) => i.id === g.id);
      gesture.current = null;
      if (item) {
        void persist(item.id, {
          x: Math.round(item.x),
          y: Math.round(item.y),
          width: Math.round(item.width),
          rotation: Math.round(item.rotation),
          style: item.style,
        });
      }
    }
  }

  // ───────────── Chữ ─────────────
  async function saveText() {
    const content = textDraft.content.trim();
    if (!content) return setSheet(null);
    if (textDraft.id) {
      const item = items.find((i) => i.id === textDraft.id);
      if (item) {
        const style = { ...item.style, font: textDraft.font, color: textDraft.color };
        patch(item.id, { content, style });
        if (!(await persist(item.id, { content, style }))) return;
      }
    } else {
      if (
        !(await addItem({
          kind: "text",
          content,
          width: 600,
          rotation: 0,
          style: { font: textDraft.font, color: textDraft.color, size: 64 },
        }))
      ) {
        return;
      }
    }
    setSheet(null);
  }

  if (!loaded) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
        <Sprout className="h-14 w-14" />
        <p className="font-hand text-xl text-ink-soft">Đang mở trang scrapbook…</p>
      </div>
    );
  }

  if (!occasion) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-script text-3xl text-ink">Không tìm thấy trang kỷ niệm này</p>
        {loadErr && <p className="text-sm text-blush-deep">{loadErr}</p>}
        <Link href="/vuon" className="btn btn-primary">
          Về khu vườn
        </Link>
      </div>
    );
  }

  const activeBackground = bgPreview ?? occasion.background;
  const activeBgMeta = getBackgroundMeta(activeBackground);
  const sorted = [...items].sort((a, b) => a.z - b.z);
  const filteredBackgrounds =
    bgGroup === "all" ? BACKGROUNDS : BACKGROUNDS.filter((b) => b.group === bgGroup);

  const stickerGrid = (onPicked?: () => void) => (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Nhóm sticker">
        {STICKER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={stickerCat === cat.id}
            onClick={() => setStickerCat(cat.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              stickerCat === cat.id
                ? "border-blush-deep bg-blush-deep text-[var(--accent-on)]"
                : "border-[var(--border-soft)] bg-[var(--surface-elevated)] text-ink-soft hover:text-ink"
            }`}
          >
            {cat.label}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={stickerCat === "emoji"}
          onClick={() => setStickerCat("emoji")}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            stickerCat === "emoji"
              ? "border-blush-deep bg-blush-deep text-[var(--accent-on)]"
              : "border-[var(--border-soft)] bg-[var(--surface-elevated)] text-ink-soft hover:text-ink"
          }`}
        >
          Biểu tượng
        </button>
      </div>

      {stickerCat === "emoji" ? (
        <div className="grid grid-cols-6 gap-1.5 text-2xl sm:grid-cols-6">
          {EMOJI_STICKERS.map((em) => (
            <button
              key={em}
              type="button"
              className="flex aspect-square items-center justify-center rounded-xl border border-transparent hover:border-[var(--border-soft)] hover:bg-[var(--surface-muted)] active:scale-90"
              onClick={() => {
                onPicked?.();
                void addItem({ kind: "sticker", content: `emoji:${em}`, width: 160 });
              }}
              aria-label={`Thêm biểu tượng ${em}`}
            >
              {em}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3">
          {STICKER_CATALOG.filter((s) => s.category === stickerCat).map((s) => (
            <button
              key={s.key}
              type="button"
              className="group flex flex-col items-center justify-between gap-1.5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] p-2.5 text-center transition hover:border-blush-deep/50 hover:bg-blush/20 active:scale-95"
              onClick={() => {
                onPicked?.();
                void addItem({
                  kind: "sticker",
                  content: `builtin:${s.key}`,
                  width: s.defaultWidth ?? BUILTIN_STICKERS[s.key]?.defaultWidth ?? 210,
                });
              }}
              aria-label={`Thêm sticker ${s.label}`}
            >
              <div className="flex h-14 w-full items-center justify-center overflow-hidden p-1">
                <StickerView content={`builtin:${s.key}`} fit="contain" />
              </div>
              <span className="truncate max-w-full text-[11px] font-medium text-ink-soft group-hover:text-ink">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <label className="btn btn-ghost w-full cursor-pointer text-xs">
        <IconPlus width={15} height={15} /> Tự làm sticker từ ảnh (PNG nền trong)
        <input
          type="file"
          accept="image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            void onCustomSticker(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );

  const paperGrid = (onApplied?: () => void) => (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Nhóm giấy scrapbook">
        {BACKGROUND_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={bgGroup === g.id}
            onClick={() => setBgGroup(g.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              bgGroup === g.id
                ? "border-blush-deep bg-blush-deep text-[var(--accent-on)]"
                : "border-[var(--border-soft)] bg-[var(--surface-elevated)] text-ink-soft hover:text-ink"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Chọn mẫu giấy scrapbook">
        {filteredBackgrounds.map((b) => {
          const isCurrent = occasion.background === b.value;
          const isSelected = activeBackground === b.value;
          return (
            <button
              key={b.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setBgPreview(b.value === occasion.background ? null : b.value)}
              className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 text-center transition ${
                isSelected
                  ? "border-blush-deep bg-blush/35 text-ink"
                  : "border-[var(--border-soft)] bg-[var(--surface-paper)] text-ink-soft hover:border-[var(--border-strong)]"
              }`}
            >
              <span className={`${backgroundClass(b.value)} relative aspect-[5/6] w-full rounded-lg border border-black/10`}>
                {isSelected && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blush-deep text-white shadow">
                    <IconCheck width={11} height={11} strokeWidth={2.7} />
                  </span>
                )}
              </span>
              <span className="truncate max-w-full text-[11px] font-semibold leading-tight">{b.label}</span>
              {isCurrent && (
                <span className="text-[10px] text-sage font-semibold">Đang lưu</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Thanh xem thử / áp dụng / mặc định */}
      <div className="space-y-2 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] p-3">
        <p className="text-xs text-ink-soft">
          {bgPreview ? (
            <>
              Đang xem thử <strong className="text-ink">{activeBgMeta.label}</strong> — {activeBgMeta.description}
            </>
          ) : (
            <>
              Giấy hiện tại: <strong className="text-ink">{activeBgMeta.label}</strong>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {bgPreview && (
            <>
              <button
                type="button"
                className="btn btn-primary min-h-9 flex-1 px-3 py-1.5 text-xs"
                onClick={async () => {
                  await applyBackground(bgPreview);
                  onApplied?.();
                }}
              >
                <IconCheck width={14} height={14} /> Áp dụng giấy này
              </button>
              <button
                type="button"
                className="btn btn-ghost min-h-9 px-3 py-1.5 text-xs"
                onClick={() => setBgPreview(null)}
              >
                Hủy
              </button>
            </>
          )}
          {activeBackground !== DEFAULT_BACKGROUND && (
            <button
              type="button"
              className="btn btn-ghost min-h-9 px-3 py-1.5 text-xs"
              onClick={async () => {
                await applyBackground(DEFAULT_BACKGROUND);
                onApplied?.();
              }}
            >
              <IconReset width={14} height={14} /> Về giấy ngà
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const selectedInspector = (item: AlbumItem) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-3 py-2">
        <span className="text-xs font-semibold text-ink">
          {item.kind === "photo"
            ? "Ảnh đang chọn"
            : item.kind === "video"
              ? "Video đang chọn"
              : item.kind === "sticker"
                ? "Sticker đang chọn"
                : item.kind === "text"
                  ? "Ghi chú chữ đang chọn"
                  : "Thẻ Google Drive"}
        </span>
        <button
          type="button"
          className="text-xs font-medium text-ink-soft underline hover:text-ink"
          onClick={() => setSelected(null)}
        >
          Bỏ chọn
        </button>
      </div>

      {/* Khung ảnh & chú thích (chỉ hiện với ảnh/video) */}
      {(item.kind === "photo" || item.kind === "video") && (
        <div className="space-y-2.5">
          <Label>Khung ảnh ({FRAMES.length} kiểu)</Label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Chọn khung ảnh">
            {FRAMES.map((f) => {
              const cur = item.style.frame ?? (item.kind === "photo" ? "polaroid" : "plain");
              const active = cur === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => updateItemFrame(item, f.value)}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-center transition ${
                    active
                      ? "border-blush-deep bg-blush/35 text-ink"
                      : "border-[var(--border-soft)] bg-[var(--surface-paper)] text-ink-soft hover:border-[var(--border-strong)]"
                  }`}
                >
                  {active && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blush-deep text-white">
                      <IconCheck width={10} height={10} strokeWidth={2.7} />
                    </span>
                  )}
                  <FrameThumb frame={f.value} />
                  <span className="text-[11px] font-semibold">{f.label}</span>
                </button>
              );
            })}
          </div>

          {item.kind === "photo" && (
            <div className="pt-1">
              <Label>Chú thích dưới ảnh Polaroid</Label>
              <div className="flex gap-2">
                <input
                  className="field min-h-10 py-1.5 text-sm font-hand"
                  placeholder="Đà Lạt một chiều mưa…"
                  value={captionDraft?.id === item.id ? captionDraft.text : (item.style.caption ?? "")}
                  onChange={(e) => setCaptionDraft({ id: item.id, text: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-soft min-h-10 px-3 py-1.5 text-xs"
                  onClick={() => {
                    const text = captionDraft?.id === item.id ? captionDraft.text : (item.style.caption ?? "");
                    savePhotoCaption(item, text);
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sửa chữ (chỉ hiện với text) */}
      {item.kind === "text" && (
        <button
          type="button"
          className="btn btn-soft w-full text-sm"
          onClick={() => {
            setTextDraft({
              id: item.id,
              content: item.content ?? "",
              font: item.style.font ?? "hand",
              color: item.style.color ?? TEXT_COLORS[0].hex,
            });
            setSheet("text");
          }}
        >
          <IconType width={16} height={16} /> Sửa nội dung & kiểu chữ
        </button>
      )}

      {/* Nút chỉnh kích thước cho chuột/trackpad (không cần cử chỉ chụm) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink-soft">Kích thước</span>
          <span className="tabular-nums text-ink">{Math.round((item.width / PAGE_W) * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost min-h-10 h-10 w-10 p-0"
            onClick={() => updateItemSize(item, item.width - 36)}
            aria-label="Thu nhỏ"
          >
            <IconMinus width={16} height={16} />
          </button>
          <input
            type="range"
            min={80}
            max={960}
            step={10}
            value={Math.min(960, Math.max(80, Math.round(item.width)))}
            onChange={(e) => {
              const nextW = Number(e.target.value);
              const ratio = nextW / Math.max(1, item.width);
              patch(item.id, {
                width: nextW,
                ...(item.kind === "text" ? { style: { ...item.style, size: Math.round((item.style.size ?? 56) * ratio) } } : {}),
              });
            }}
            onPointerUp={() => void persist(item.id, { width: Math.round(item.width), style: item.style })}
            onKeyUp={() => void persist(item.id, { width: Math.round(item.width), style: item.style })}
            className="flex-1 accent-[var(--accent-main)]"
            aria-label="Chỉnh kích thước mục đang chọn"
          />
          <button
            type="button"
            className="btn btn-ghost min-h-10 h-10 w-10 p-0"
            onClick={() => updateItemSize(item, item.width + 36)}
            aria-label="Phóng to"
          >
            <IconPlus width={16} height={16} />
          </button>
        </div>
      </div>

      {/* Nút chỉnh góc xoay cho chuột/trackpad */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-ink-soft">Góc xoay</span>
          <span className="tabular-nums text-ink">{Math.round(item.rotation)}°</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost min-h-10 h-10 w-10 p-0"
            onClick={() => updateItemRotation(item, item.rotation - 15)}
            aria-label="Xoay trái 15 độ"
          >
            <IconRotateCcw width={16} height={16} />
          </button>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={Math.round(item.rotation)}
            onChange={(e) => patch(item.id, { rotation: Number(e.target.value) })}
            onPointerUp={() => void persist(item.id, { rotation: Math.round(item.rotation) })}
            onKeyUp={() => void persist(item.id, { rotation: Math.round(item.rotation) })}
            className="flex-1 accent-[var(--accent-main)]"
            aria-label="Chỉnh góc xoay mục đang chọn"
          />
          <button
            type="button"
            className="btn btn-ghost min-h-10 h-10 w-10 p-0"
            onClick={() => updateItemRotation(item, item.rotation + 15)}
            aria-label="Xoay phải 15 độ"
          >
            <IconRotateCw width={16} height={16} />
          </button>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-ink-soft underline hover:text-ink"
          onClick={() => updateItemRotation(item, 0)}
        >
          Đưa về thẳng góc (0°)
        </button>
      </div>

      {/* Lớp hiển thị, Nhân bản & Xóa */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          className="btn btn-ghost min-h-10 px-3 text-xs"
          onClick={() => {
            const z = maxZ() + 1;
            patch(item.id, { z });
            void persist(item.id, { z });
          }}
        >
          <IconLayerUp width={15} height={15} /> Lên trên
        </button>
        <button
          type="button"
          className="btn btn-ghost min-h-10 px-3 text-xs"
          onClick={() => {
            const z = Math.min(...items.map((i) => i.z)) - 1;
            patch(item.id, { z });
            void persist(item.id, { z });
          }}
        >
          <IconLayerDown width={15} height={15} /> Xuống dưới
        </button>
        <button
          type="button"
          className="btn btn-ghost min-h-10 px-3 text-xs"
          onClick={() => void duplicate(item)}
        >
          <IconCopy width={15} height={15} /> Nhân bản
        </button>
        <button
          type="button"
          className="btn btn-ghost min-h-10 px-3 text-xs text-blush-deep"
          onClick={() => void removeItem(item)}
        >
          <IconTrash width={15} height={15} /> Xóa mục
        </button>
      </div>
    </div>
  );

  const studioPanelContent = (
    <div className="flex h-full flex-col">
      {/* Tab bar của bảng công cụ */}
      <div
        className="grid grid-cols-4 gap-1 border-b border-[var(--border-soft)] bg-[var(--surface-elevated)] p-2"
        role="tablist"
        aria-label="Công cụ scrapbook"
      >
        {(
          [
            { id: "add", label: "Thêm", Icon: IconPlus },
            { id: "sticker", label: "Sticker", Icon: IconSticker },
            { id: "paper", label: "Giấy", Icon: IconPaper },
            { id: "selected", label: "Mục chọn", Icon: IconFrame },
          ] as const
        ).map(({ id: tabId, label, Icon }) => {
          const active = studioTab === tabId;
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStudioTab(tabId)}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition ${
                active
                  ? "bg-[var(--surface-paper)] text-blush-deep shadow-xs ring-1 ring-blush-deep/30"
                  : "text-ink-soft hover:bg-[var(--surface-paper)]/60 hover:text-ink"
              }`}
            >
              <Icon width={16} height={16} />
              <span>{label}</span>
              {tabId === "selected" && sel && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blush-deep" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {/* Nội dung từng tab */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {studioTab === "add" && (
          <div className="space-y-3">
            <p className="text-xs text-ink-soft">
              Dán ảnh, video, ghi chú viết tay hoặc liên kết Google Drive lên trang sổ này.
            </p>
            <label className="btn btn-primary w-full cursor-pointer">
              <IconPhoto width={17} height={17} /> Tải ảnh / video lên trang
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn btn-soft text-xs"
                onClick={() => {
                  setTextDraft({ content: "", font: "hand", color: TEXT_COLORS[0].hex });
                  setSheet("text");
                }}
              >
                <IconType width={16} height={16} /> Viết chữ
              </button>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() => {
                  setDriveUrl("");
                  setDriveName("");
                  setDriveError("");
                  setSheet("drive");
                }}
              >
                <IconDrive width={16} height={16} /> Gắn Drive
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setStudioTab("sticker")}>
                <IconSticker width={16} height={16} /> Chọn sticker
              </button>
              <button type="button" className="btn btn-ghost text-xs" onClick={() => setStudioTab("paper")}>
                <IconPaper width={16} height={16} /> Đổi mẫu giấy
              </button>
            </div>
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-3 text-xs leading-relaxed text-ink-soft">
              <p className="font-semibold text-ink">Mẹo nhanh trên máy tính</p>
              <p className="mt-1">
                Chọn một mục rồi dùng phím mũi tên để dịch chuyển, <kbd className="rounded border px-1">[</kbd>{" "}
                <kbd className="rounded border px-1">]</kbd> để xoay, <kbd className="rounded border px-1">-</kbd>{" "}
                <kbd className="rounded border px-1">+</kbd> để đổi cỡ.
              </p>
            </div>
          </div>
        )}

        {studioTab === "sticker" && stickerGrid()}
        {studioTab === "paper" && paperGrid()}
        {studioTab === "selected" &&
          (sel ? (
            selectedInspector(sel)
          ) : (
            <div className="empty-note text-center">
              Chạm vào một ảnh, sticker hoặc dòng chữ trên trang để xoay, đổi khung, nhân bản hay xóa.
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      {/* Thông báo lỗi & hoàn tác */}
      <div className="pointer-events-none fixed inset-x-3 top-16 z-50 mx-auto max-w-md space-y-2" aria-live="polite">
        {notice && (
          <div
            role="alert"
            className="paper-card pointer-events-auto flex items-center justify-between gap-3 border-blush-deep/40 px-4 py-2.5 text-sm"
          >
            <span className="text-blush-deep">{notice}</span>
            <button
              type="button"
              className="btn btn-ghost min-h-8 h-8 w-8 p-0"
              onClick={() => setNotice("")}
              aria-label="Đóng thông báo"
            >
              <IconClose width={15} height={15} />
            </button>
          </div>
        )}
        {deleted.map((item) => (
          <div
            key={item.id}
            className="paper-card pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 text-sm animate-pop"
          >
            <span>Đã xóa khỏi trang</span>
            <button
              type="button"
              className="font-semibold text-blush-deep underline"
              onClick={() => void undo(item)}
            >
              Hoàn tác
            </button>
          </div>
        ))}
      </div>

      {/* Thanh tiêu đề trên cùng: về vườn, tên album, trạng thái lưu & chuyển chế độ Xem / Chỉnh sửa */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[var(--surface-paper)]/94 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-2.5 py-2 sm:px-5">
          <Link
            href="/vuon"
            className="btn btn-ghost min-h-10 h-10 w-10 p-0 sm:w-auto sm:px-3"
            aria-label="Về khu vườn"
          >
            <IconBack width={18} height={18} />
            <span className="hidden text-sm sm:inline">Vườn</span>
          </Link>

          <button
            type="button"
            className="min-w-0 flex-1 rounded-xl px-1.5 py-0.5 text-left transition hover:bg-[var(--surface-muted)]"
            onClick={() => setSheet("info")}
          >
            <h1 className="truncate font-script text-2xl leading-tight text-ink sm:text-3xl">{occasion.title}</h1>
            <p className="truncate text-[11px] text-ink-soft sm:text-xs">
              {formatDate(occasion.happened_on)} · {activeBgMeta.label}
            </p>
          </button>

          {/* Trạng thái tải / lưu dễ hiểu */}
          <SaveStatusPill state={saveState} uploading={uploading} />

          {/* Nút bật/tắt bảng công cụ trên iPad dọc (md -> lg) */}
          {editing && (
            <button
              type="button"
              onClick={() => setTabletDrawerOpen((v) => !v)}
              aria-pressed={tabletDrawerOpen}
              className="btn btn-ghost hidden min-h-10 px-3 text-xs md:inline-flex lg:hidden"
            >
              <IconPanel width={16} height={16} />
              <span>{tabletDrawerOpen ? "Thu gọn" : "Công cụ"}</span>
            </button>
          )}

          {/* Bộ chuyển 2 chế độ rõ ràng: Xem / Chỉnh sửa */}
          <div
            className="inline-flex shrink-0 rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] p-0.5"
            role="group"
            aria-label="Chế độ trang scrapbook"
          >
            <button
              type="button"
              aria-pressed={!editing}
              onClick={() => {
                setEditing(false);
                setSelected(null);
                setBgPreview(null);
              }}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition sm:px-3.5 ${
                !editing
                  ? "bg-[var(--surface-paper)] text-ink shadow-xs ring-1 ring-[var(--border-soft)]"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <IconEye width={15} height={15} />
              <span>Xem</span>
            </button>
            <button
              type="button"
              aria-pressed={editing}
              onClick={() => setEditing(true)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition sm:px-3.5 ${
                editing
                  ? "bg-blush-deep text-[var(--accent-on)] shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <IconPencil width={14} height={14} />
              <span>Chỉnh sửa</span>
            </button>
          </div>
        </div>
      </header>

      {/* Thanh xem thử giấy nếu đang bật xem thử mà không mở sheet */}
      {bgPreview && (
        <div className="border-b border-blush-deep/25 bg-blush/35 px-4 py-2 text-center text-xs text-ink">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2">
            <span>
              Đang xem thử giấy <strong>{activeBgMeta.label}</strong>
            </span>
            <button
              type="button"
              className="btn btn-primary min-h-8 px-3 py-1 text-xs"
              onClick={() => void applyBackground(bgPreview)}
            >
              <IconCheck width={13} height={13} /> Áp dụng
            </button>
            <button
              type="button"
              className="btn btn-ghost min-h-8 px-3 py-1 text-xs"
              onClick={() => setBgPreview(null)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Không gian chính: thích ứng mobile / iPad dọc / iPad ngang & laptop */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-6 lg:px-6 lg:py-6">
        {/* Cột chứa trang giấy scrapbook */}
        <div
          className={`flex flex-1 flex-col items-center px-2.5 pt-3 sm:px-5 lg:px-0 lg:pt-0 ${
            editing ? "pb-44 md:pb-10 lg:pb-10" : "pb-14"
          }`}
        >
          {/* Khung giấy tỉ lệ 1000:1400 giữ đồng nhất mọi thiết bị */}
          <div
            className={`w-full ${
              editing
                ? "max-w-[540px] md:max-w-[600px] lg:max-w-[580px] xl:max-w-[630px]"
                : "max-w-[540px] md:max-w-[660px] lg:max-w-[680px]"
            }`}
          >
            <div
              ref={stageRef}
              className={`${backgroundClass(activeBackground)} relative isolate w-full overflow-hidden rounded-[14px] border border-black/10 shadow-[0_14px_36px_-14px_rgba(40,30,24,0.42)] touch-pan-y ${
                editing ? "select-none" : ""
              }`}
              style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}` }}
              onPointerDown={onStagePointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {sorted.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                  <p
                    className={`max-w-xs font-hand text-xl leading-relaxed ${
                      activeBgMeta.isDark ? "text-white/80" : "text-[#685a53]"
                    }`}
                  >
                    {editing
                      ? "Chọn ảnh, sticker hoặc viết một dòng kỷ niệm để bắt đầu dán lên trang."
                      : "Trang sổ này còn trống. Chuyển sang “Chỉnh sửa” để cùng nhau trang trí nha."}
                  </p>
                </div>
              )}

              {sorted.map((item) => {
                const isSel = editing && item.id === selected;
                return (
                  <div
                    key={item.id}
                    className={`absolute ${editing ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
                    style={{
                      left: `${(item.x / PAGE_W) * 100}%`,
                      top: `${(item.y / PAGE_H) * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                      zIndex: isSel ? 100000 : item.z,
                    }}
                    onPointerDown={(e) => onItemPointerDown(e, item)}
                    onDoubleClick={() => {
                      if (editing && item.kind === "text") {
                        setTextDraft({
                          id: item.id,
                          content: item.content ?? "",
                          font: item.style.font ?? "hand",
                          color: item.style.color ?? TEXT_COLORS[0].hex,
                        });
                        setSheet("text");
                      }
                    }}
                  >
                    <div
                      className={
                        isSel
                          ? "rounded-md outline-2 outline-offset-4 outline-dashed outline-blush-deep ring-4 ring-white/55"
                          : ""
                      }
                    >
                      <ItemView
                        item={item}
                        url={item.storage_path ? urls[item.storage_path] : undefined}
                        scale={scale}
                        editing={editing}
                      />
                    </div>
                    {isSel && (
                      <>
                        <button
                          type="button"
                          className="absolute -bottom-5 -right-5 flex h-10 w-10 touch-none items-center justify-center rounded-full border-2 border-white bg-blush-deep text-sm font-bold text-white shadow-md"
                          onPointerDown={(e) => onHandlePointerDown(e, item)}
                          aria-label="Kéo để xoay và đổi kích thước"
                          title="Kéo để xoay và đổi kích thước"
                        >
                          ⤡
                        </button>
                        <button
                          type="button"
                          className="absolute -right-5 -top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--surface-paper)] text-blush-deep shadow-md"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => void removeItem(item)}
                          aria-label="Xóa mục này"
                          title="Xóa mục này"
                        >
                          <IconTrash width={15} height={15} />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lời kể của dịp khi ở chế độ Xem */}
            {!editing && occasion.description && (
              <article className="paper-card mt-5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Ghi chú của kỷ niệm</p>
                <p className="mt-2 whitespace-pre-wrap font-hand text-xl leading-relaxed text-ink">
                  {occasion.description}
                </p>
              </article>
            )}

            {/* Bảng công cụ thu gọn được cho iPad dọc (md -> lg) */}
            {editing && tabletDrawerOpen && (
              <aside
                aria-label="Bảng công cụ iPad"
                className="paper-card mt-5 hidden overflow-hidden md:block lg:hidden"
              >
                {studioPanelContent}
              </aside>
            )}
          </div>
        </div>

        {/* Bảng công cụ gắn cạnh phải trên iPad xoay ngang & Laptop (>= lg), tự ẩn khi chỉ Xem */}
        {editing && (
          <aside
            aria-label="Bảng công cụ scrapbook"
            className="paper-card sticky top-[4.5rem] hidden max-h-[calc(100dvh-6rem)] w-[340px] shrink-0 overflow-hidden lg:flex lg:flex-col xl:w-[370px]"
          >
            {studioPanelContent}
          </aside>
        )}
      </div>

      {/* Thanh công cụ gọn dưới đáy dành riêng cho điện thoại (< md) khi Chỉnh sửa */}
      {editing && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-soft)] bg-[var(--surface-paper)]/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.22)] backdrop-blur-md md:hidden">
          {sel && (
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--border-soft)] bg-[var(--surface-elevated)] px-2.5 py-2 text-xs">
              {(sel.kind === "photo" || sel.kind === "video") && (
                <Mini onClick={() => setSheet("frame")}>
                  <IconFrame width={14} height={14} /> Khung
                </Mini>
              )}
              {sel.kind === "text" && (
                <Mini
                  onClick={() => {
                    setTextDraft({
                      id: sel.id,
                      content: sel.content ?? "",
                      font: sel.style.font ?? "hand",
                      color: sel.style.color ?? TEXT_COLORS[0].hex,
                    });
                    setSheet("text");
                  }}
                >
                  <IconType width={14} height={14} /> Sửa chữ
                </Mini>
              )}
              <Mini onClick={() => setSheet("adjust")}>
                <IconRotateCw width={14} height={14} /> Xoay / Cỡ
              </Mini>
              <Mini
                onClick={() => {
                  const z = maxZ() + 1;
                  patch(sel.id, { z });
                  void persist(sel.id, { z });
                }}
              >
                <IconLayerUp width={14} height={14} /> Lên trên
              </Mini>
              <Mini onClick={() => void duplicate(sel)}>
                <IconCopy width={14} height={14} /> Nhân bản
              </Mini>
              <Mini danger onClick={() => void removeItem(sel)}>
                <IconTrash width={14} height={14} /> Xóa
              </Mini>
            </div>
          )}

          <div className="mx-auto flex max-w-md items-center justify-around px-1.5 py-1.5">
            <label className="flex min-h-12 min-w-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-medium text-ink hover:bg-[var(--surface-muted)]">
              <IconPhoto width={20} height={20} className="text-blush-deep" />
              <span>Ảnh/Video</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <MobileTool
              icon={<IconSticker width={20} height={20} className="text-blush-deep" />}
              label="Sticker"
              onClick={() => setSheet("sticker")}
            />
            <MobileTool
              icon={<IconType width={20} height={20} className="text-blush-deep" />}
              label="Chữ"
              onClick={() => {
                setTextDraft({ content: "", font: "hand", color: TEXT_COLORS[0].hex });
                setSheet("text");
              }}
            />
            <MobileTool
              icon={<IconPaper width={20} height={20} className="text-blush-deep" />}
              label="Giấy"
              onClick={() => setSheet("background")}
            />
            <MobileTool
              icon={<IconDrive width={20} height={20} className="text-sage" />}
              label="Drive"
              onClick={() => {
                setDriveUrl("");
                setDriveName("");
                setDriveError("");
                setSheet("drive");
              }}
            />
          </div>
        </div>
      )}

      {/* Cảnh báo video vượt 50MB */}
      {largeVideo && (
        <div
          role="status"
          className="paper-card fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md space-y-3 p-4 animate-pop"
        >
          <p className="text-sm text-ink">
            Video “<strong>{largeVideo}</strong>” vượt quá {MAX_VIDEO_MB}MB. Bạn có thể lưu video trên Google Drive rồi gắn thẻ vào trang này.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary min-h-10 text-xs"
              onClick={() => {
                setDriveName(largeVideo);
                setDriveUrl("");
                setDriveError("");
                setLargeVideo(null);
                setSheet("drive");
              }}
            >
              Gắn từ Google Drive
            </button>
            <button
              type="button"
              className="btn btn-ghost min-h-10 text-xs"
              onClick={() => setLargeVideo(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Các Bottom Sheet cho mobile & hộp thoại tiện lợi cho mọi thiết bị */}
      <Sheet open={sheet === "drive"} onClose={() => setSheet(null)} title="Gắn file Google Drive">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (driveBusy) return;
            let normalized: string;
            try {
              normalized = normalizeDriveUrl(driveUrl);
            } catch (error) {
              setDriveError((error as Error).message);
              return;
            }
            setDriveBusy(true);
            try {
              if (
                await addItem({
                  kind: "drive",
                  drive_url: normalized,
                  drive_name: driveName.trim() || "File Google Drive",
                  width: 460,
                })
              ) {
                setSheet(null);
              }
            } finally {
              setDriveBusy(false);
            }
          }}
        >
          <label className="block">
            <Label>Liên kết Google Drive</Label>
            <input
              className="field"
              placeholder="https://drive.google.com/file/d/…/view"
              value={driveUrl}
              onChange={(e) => {
                setDriveUrl(e.target.value);
                try {
                  normalizeDriveUrl(e.target.value);
                  setDriveError("");
                } catch (error) {
                  setDriveError((error as Error).message);
                }
              }}
              required
            />
          </label>
          <label className="block">
            <Label>Tên hiển thị trên thẻ</Label>
            <input
              className="field"
              placeholder="Video pháo hoa tối sinh nhật"
              value={driveName}
              onChange={(e) => setDriveName(e.target.value)}
            />
          </label>
          <p className="rounded-xl bg-[var(--surface-elevated)] p-3 text-xs leading-relaxed text-ink-soft">
            Giữ quyền chia sẻ ở chế độ <strong>Bị hạn chế</strong> và thêm đúng email Google của người kia. Không cần bật chia sẻ công khai.
          </p>
          {driveError && (
            <p role="alert" className="text-sm text-blush-deep">
              {driveError}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={driveBusy}>
            {driveBusy ? "Đang gắn…" : "Gắn thẻ vào album"}
          </button>
        </form>
      </Sheet>

      <Sheet open={sheet === "sticker"} onClose={() => setSheet(null)} title="Bộ sticker" subtitle="Chạm vào một mẫu để dán lên trang">
        {stickerGrid(() => setSheet(null))}
      </Sheet>

      <Sheet
        open={sheet === "background"}
        onClose={() => {
          setBgPreview(null);
          setSheet(null);
        }}
        title="Giấy scrapbook"
        subtitle="Xem thử trực tiếp trên trang rồi bấm Áp dụng"
      >
        {paperGrid(() => setSheet(null))}
      </Sheet>

      <Sheet open={sheet === "frame" && !!sel} onClose={() => setSheet(null)} title="Khung & chú thích">
        {sel && selectedInspector(sel)}
      </Sheet>

      <Sheet open={sheet === "adjust" && !!sel} onClose={() => setSheet(null)} title="Chỉnh kích thước & góc xoay">
        {sel && selectedInspector(sel)}
      </Sheet>

      <Sheet open={sheet === "text"} onClose={() => setSheet(null)} title={textDraft.id ? "Sửa ghi chú" : "Viết chữ lên trang"}>
        <div className="space-y-4">
          <textarea
            className={`field min-h-28 text-2xl ${FONT_CLASS[textDraft.font]}`}
            style={{ color: textDraft.color === "#ffffff" ? "var(--ink-primary)" : textDraft.color }}
            placeholder="Viết vài lời nhắn thương thương…"
            value={textDraft.content}
            onChange={(e) => setTextDraft((d) => ({ ...d, content: e.target.value }))}
            autoFocus
          />
          <div>
            <Label>Kiểu chữ</Label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: "hand", sample: "Viết tay" },
                  { id: "script", sample: "Bay bổng" },
                  { id: "round", sample: "Tròn trịa" },
                  { id: "sans", sample: "Gọn gàng" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={textDraft.font === f.id}
                  className={`rounded-xl border-2 py-2 text-base transition ${FONT_CLASS[f.id]} ${
                    textDraft.font === f.id
                      ? "border-blush-deep bg-blush/35 text-ink"
                      : "border-[var(--border-soft)] bg-[var(--surface-paper)] text-ink-soft"
                  }`}
                  onClick={() => setTextDraft((d) => ({ ...d, font: f.id }))}
                >
                  {f.sample}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Màu mực</Label>
            <div className="flex flex-wrap gap-2.5">
              {TEXT_COLORS.map((c) => {
                const active = textDraft.color === c.hex;
                return (
                  <button
                    key={c.hex}
                    type="button"
                    aria-pressed={active}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                      active ? "scale-105 border-ink ring-2 ring-blush-deep/35" : "border-[var(--border-strong)]"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setTextDraft((d) => ({ ...d, color: c.hex }))}
                    aria-label={c.label}
                    title={c.label}
                  >
                    {active && (
                      <IconCheck
                        width={15}
                        height={15}
                        strokeWidth={2.7}
                        className={c.hex === "#ffffff" ? "text-[#332723]" : "text-white"}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="button" className="btn btn-primary w-full" onClick={() => void saveText()}>
            {textDraft.id ? "Lưu thay đổi" : "Dán chữ lên trang"}
          </button>
        </div>
      </Sheet>

      <InfoSheet
        open={sheet === "info"}
        occasion={occasion}
        onClose={() => setSheet(null)}
        onSaved={(o) => {
          setOccasion(o);
          markSaved();
        }}
        onDeleted={() => router.push("/vuon")}
      />
    </div>
  );
}

function SaveStatusPill({ state, uploading }: { state: SaveState; uploading: string | null }) {
  if (uploading) {
    return (
      <span
        role="status"
        className="hidden items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-medium text-ink-soft sm:inline-flex"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-blush-deep" aria-hidden />
        {uploading}
      </span>
    );
  }
  if (state === "saving") {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-elevated)] px-2.5 py-1 text-[11px] font-medium text-ink-soft"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-blush-deep" aria-hidden />
        <span className="hidden min-[380px]:inline">Đang lưu…</span>
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-1 rounded-full border border-sage/35 bg-sage-soft px-2.5 py-1 text-[11px] font-semibold text-ink"
      >
        <IconCheck width={12} height={12} className="text-sage" />
        <span className="hidden min-[380px]:inline">Đã lưu</span>
      </span>
    );
  }
  if (state === "error") {
    return (
      <span
        role="alert"
        className="inline-flex items-center gap-1 rounded-full border border-blush-deep/40 bg-blush/50 px-2.5 py-1 text-[11px] font-semibold text-blush-deep"
      >
        Lưu thất bại
      </span>
    );
  }
  return null;
}

function InfoSheet({
  open,
  occasion,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  occasion: Occasion;
  onClose: () => void;
  onSaved: (o: Occasion) => void;
  onDeleted: () => void;
}) {
  const sb = supabaseBrowser();
  const [title, setTitle] = useState(occasion.title);
  const [date, setDate] = useState(occasion.happened_on);
  const [desc, setDesc] = useState(occasion.description ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title="Thông tin kỷ niệm">
      <div className="space-y-4">
        <label className="block">
          <Label>Tên dịp</Label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <Label>Ngày kỷ niệm</Label>
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block">
          <Label>Kể lại đôi dòng</Label>
          <textarea
            className="field min-h-28 font-hand text-lg"
            placeholder="Hôm ấy trời nắng nhẹ, tụi mình đi…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </label>
        {err && (
          <p role="alert" className="text-sm text-blush-deep">
            {err}
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setErr("");
            const changes = {
              title: title.trim() || occasion.title,
              happened_on: date,
              description: desc.trim() || null,
            };
            const { error } = await sb.from("occasions").update(changes).eq("id", occasion.id).select("id").single();
            setBusy(false);
            if (error) return setErr("Không lưu được: " + error.message);
            onSaved({ ...occasion, ...changes });
            onClose();
          }}
        >
          {busy ? "Đang lưu…" : "Lưu thông tin"}
        </button>

        <div className="border-t border-[var(--border-soft)] pt-3">
          {!confirmDelete ? (
            <button
              type="button"
              className="btn btn-ghost w-full text-blush-deep"
              onClick={() => setConfirmDelete(true)}
            >
              <IconTrash width={16} height={16} /> Xóa trang kỷ niệm này
            </button>
          ) : (
            <div className="space-y-2 rounded-2xl border border-blush-deep/35 bg-blush/25 p-3">
              <p className="text-sm font-medium text-ink">Xóa vĩnh viễn trang này và toàn bộ ảnh/ghi chú bên trong?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost flex-1 text-xs"
                  onClick={() => setConfirmDelete(false)}
                >
                  Giữ lại
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1 text-xs"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setErr("");
                    const { data, error: readError } = await sb
                      .from("album_items")
                      .select("storage_path")
                      .eq("occasion_id", occasion.id);
                    const paths = (data ?? []).map((r) => r.storage_path).filter(Boolean) as string[];
                    const { error } = await sb.from("occasions").delete().eq("id", occasion.id).select("id").single();
                    if (error) {
                      setBusy(false);
                      return setErr("Không xóa được: " + error.message);
                    }
                    if (!readError) await removeUnusedFiles(paths);
                    onDeleted();
                  }}
                >
                  Xóa luôn
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function MobileTool({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-medium text-ink hover:bg-[var(--surface-muted)]"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Mini({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition ${
        danger
          ? "border-blush-deep/35 bg-blush/30 text-blush-deep"
          : "border-[var(--border-soft)] bg-[var(--surface-paper)] text-ink"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
