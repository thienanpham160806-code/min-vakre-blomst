"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BUILTIN_STICKERS, EMOJI_STICKERS, StickerView } from "@/components/stickers";
import { Label, Sheet } from "@/components/Sheet";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { formatDate } from "@/lib/format";
import { MAX_VIDEO_MB, removeUnusedFiles, compressImage, signedUrls, uploadToBucket, videoAspect } from "@/lib/media";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { AlbumItem, Background, ItemStyle, Occasion } from "@/lib/types";
import { FONT_CLASS, ItemView } from "./item-view";

/** Khung logic của một trang: 1000 x 1400. Mọi toạ độ lưu trong DB theo khung này. */
const PAGE_W = 1000;
const PAGE_H = 1400;

type Pt = { x: number; y: number };
type Snapshot = Pick<AlbumItem, "x" | "y" | "width" | "rotation"> & { size?: number };
type Gesture =
  | { mode: "drag"; id: string; start: Pt; snap: Snapshot }
  | { mode: "pinch"; id: string; d0: number; a0: number; c0: Pt; snap: Snapshot }
  | { mode: "handle"; id: string; v0: Pt; snap: Snapshot };

const TEXT_COLORS = ["#3d2b2b", "#e0708f", "#ffffff", "#6f9a6b", "#5a7bd6", "#e0a92a"];

export function Scrapbook() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sb = supabaseBrowser();

  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "sticker" | "text" | "background" | "info">(null);
  const [textDraft, setTextDraft] = useState<{ id?: string; content: string; font: NonNullable<ItemStyle["font"]>; color: string }>({ content: "", font: "hand", color: TEXT_COLORS[0] });
  const [uploading, setUploading] = useState<string | null>(null);

  const [notice, setNotice] = useState("");
  const [deleted, setDeleted] = useState<AlbumItem[]>([]);
  const pendingDeletes = useRef(new Map<string, { item: AlbumItem; timer: ReturnType<typeof setTimeout> }>());
  useEffect(() => {
    const pending = pendingDeletes.current;
    return () => { for (const entry of pending.values()) clearTimeout(entry.timer); };
  }, []);

  async function undo(item: AlbumItem) {
    const entry = pendingDeletes.current.get(item.id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pendingDeletes.current.delete(item.id);
    setDeleted((list) => list.filter((i) => i.id !== item.id));
    const { error } = await sb.from("album_items").insert(item);
    if (error) { setNotice("Không hoàn tác được: " + error.message); return; }
    setItems((list) => list.some((i) => i.id === item.id) ? list : [...list, item]);
  }

  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.36);
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<Gesture | null>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // ───────────── Tải dữ liệu ─────────────
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
      setOccasion((o.data as Occasion) ?? null);
      const list = (it.data as AlbumItem[]) ?? [];
      setItems(list);
      setLoaded(true);
      resolveUrls(list);
    });

    // Realtime: thấy người kia dán gì lên trang ngay lập tức
    const channel = sb
      .channel(`album:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "album_items", filter: `occasion_id=eq.${id}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          setItems((l) => l.filter((i) => i.id !== (payload.old as AlbumItem).id));
          return;
        }
        const row = payload.new as AlbumItem;
        if (gesture.current?.id === row.id) return; // đang kéo món này, bỏ qua
        setItems((l) => (l.some((i) => i.id === row.id) ? l.map((i) => (i.id === row.id ? row : i)) : [...l, row]));
        resolveUrls([row]);
      })
      .subscribe();

    return () => {
      alive = false;
      sb.removeChannel(channel);
    };
  }, [id, sb, resolveUrls]);

  // ───────────── Tỉ lệ khung theo bề ngang màn hình ─────────────
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / PAGE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, [loaded]);

  // ───────────── Lưu ─────────────
  const patch = useCallback((itemId: string, changes: Partial<AlbumItem>) => {
    setItems((l) => l.map((i) => (i.id === itemId ? { ...i, ...changes } : i)));
  }, []);

  const persist = useCallback(
    async (itemId: string, changes: Partial<AlbumItem>) => {
      const { data, error } = await sb.from("album_items").update({ ...changes, updated_at: new Date().toISOString() }).eq("id", itemId).select().single();
      if (error || !data) {
        setNotice("Không lưu được: " + (error?.message ?? "Mục không còn tồn tại"));
        const result = await sb.from("album_items").select("*").eq("occasion_id", id).order("z");
        if (!result.error) setItems(result.data as AlbumItem[]);
        else setNotice("Không tải lại được trang. Hãy tải lại trước khi sửa tiếp.");
        return false;
      }
      patch(itemId, data as AlbumItem);
      return true;
    },
    [sb, id, patch],
  );

  const maxZ = () => itemsRef.current.reduce((m, i) => Math.max(m, i.z), 0);

  async function addItem(partial: Partial<AlbumItem> & Pick<AlbumItem, "kind">) {
    const row = {
      occasion_id: id,
      x: PAGE_W / 2 + (Math.random() - 0.5) * 200,
      y: PAGE_H / 2 + (Math.random() - 0.5) * 300,
      width: 400,
      rotation: Math.round((Math.random() - 0.5) * 12),
      z: maxZ() + 1,
      style: {},
      ...partial,
    };
    const { data, error } = await sb.from("album_items").insert(row).select().single();
    if (error || !data) {
      alert("Không thêm được: " + (error?.message ?? ""));
      return null;
    }
    const item = data as AlbumItem;
    setItems((l) => (l.some((i) => i.id === item.id) ? l : [...l, item]));
    setSelected(item.id);
    return item;
  }

  async function removeItem(item: AlbumItem) {
    const { data, error } = await sb.from("album_items").delete().eq("id", item.id).select("id").single();
    if (error || !data) return setNotice("Không xoá được: " + (error?.message ?? "Mục không còn tồn tại"));
    setItems((l) => l.filter((i) => i.id !== item.id));
    setSelected(null);
    setDeleted((list) => [...list, item]);
    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(item.id);
      setDeleted((list) => list.filter((i) => i.id !== item.id));
      if (item.storage_path && ![...pendingDeletes.current.values()].some((p) => p.item.storage_path === item.storage_path)) {
        await removeUnusedFiles([item.storage_path]);
      }
    }, 6000);
    pendingDeletes.current.set(item.id, { item, timer });
  }

  async function duplicate(item: AlbumItem) {
    const { id: _omit, ...rest } = item;
    void _omit;
    await addItem({ ...rest, x: item.x + 40, y: item.y + 40 });
  }

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
            alert(`Video "${f.name}" nặng quá ${MAX_VIDEO_MB}MB, nén lại rồi up nha.`);
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
        alert("Tải lên lỗi: " + (e as Error).message);
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
    } finally {
      setUploading(null);
    }
  }

  // ───────────── Kéo, xoay, phóng to ─────────────
  const toPage = (e: { clientX: number; clientY: number }): Pt => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  };
  const snapOf = (i: AlbumItem): Snapshot => ({ x: i.x, y: i.y, width: i.width, rotation: i.rotation, size: i.style.size });

  function startPinchIfTwo(itemId: string) {
    const pts = [...pointers.current.values()];
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (pts.length < 2 || !item) return;
    const [a, b] = pts;
    gesture.current = {
      mode: "pinch",
      id: itemId,
      d0: Math.hypot(b.x - a.x, b.y - a.y),
      a0: Math.atan2(b.y - a.y, b.x - a.x),
      c0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      snap: snapOf(item),
    };
  }

  function onItemPointerDown(e: React.PointerEvent, item: AlbumItem) {
    if (!editing) return;
    e.stopPropagation();
    stageRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, toPage(e));
    setSelected(item.id);
    if (pointers.current.size === 1) gesture.current = { mode: "drag", id: item.id, start: toPage(e), snap: snapOf(item) };
    else startPinchIfTwo(item.id);
  }

  function onHandlePointerDown(e: React.PointerEvent, item: AlbumItem) {
    e.stopPropagation();
    stageRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, toPage(e));
    const p = toPage(e);
    gesture.current = { mode: "handle", id: item.id, v0: { x: p.x - item.x, y: p.y - item.y }, snap: snapOf(item) };
  }

  function onStagePointerDown(e: React.PointerEvent) {
    if (!editing) return;
    pointers.current.set(e.pointerId, toPage(e));
    // Ngón thứ hai đặt ra ngoài món đang chọn vẫn tính là chụm/xoay
    if (selected && pointers.current.size === 2) {
      stageRef.current?.setPointerCapture(e.pointerId);
      startPinchIfTwo(selected);
    } else if (pointers.current.size === 1) {
      setSelected(null);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, toPage(e));
    const g = gesture.current;
    if (!g) return;
    const item = itemsRef.current.find((i) => i.id === g.id);
    if (!item) return;

    const apply = (k: number, rot: number, x: number, y: number) => {
      const width = Math.min(1600, Math.max(60, g.snap.width * k));
      const ratio = width / g.snap.width;
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
      patch(g.id, { x: g.snap.x + p.x - g.start.x, y: g.snap.y + p.y - g.start.y });
    } else if (g.mode === "pinch") {
      const pts = [...pointers.current.values()];
      if (pts.length < 2) return;
      const [a, b] = pts;
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      apply(d / g.d0, g.snap.rotation + ((ang - g.a0) * 180) / Math.PI, g.snap.x + c.x - g.c0.x, g.snap.y + c.y - g.c0.y);
    } else {
      const p = toPage(e);
      const v = { x: p.x - g.snap.x, y: p.y - g.snap.y };
      const k = Math.hypot(v.x, v.y) / Math.max(1, Math.hypot(g.v0.x, g.v0.y));
      const rot = g.snap.rotation + ((Math.atan2(v.y, v.x) - Math.atan2(g.v0.y, g.v0.x)) * 180) / Math.PI;
      apply(k, rot, g.snap.x, g.snap.y);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (pointers.current.size === 1 && g.mode === "pinch") {
      // còn một ngón: chuyển về kéo
      const item = itemsRef.current.find((i) => i.id === g.id);
      const [p] = [...pointers.current.values()];
      if (item) gesture.current = { mode: "drag", id: g.id, start: p, snap: snapOf(item) };
      return;
    }
    if (pointers.current.size === 0) {
      const item = itemsRef.current.find((i) => i.id === g.id);
      gesture.current = null;
      if (item) persist(item.id, { x: item.x, y: item.y, width: item.width, rotation: item.rotation, style: item.style });
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
        if (!await persist(item.id, { content, style })) return;
      }
    } else {
      if (!await addItem({ kind: "text", content, width: 600, rotation: 0, style: { font: textDraft.font, color: textDraft.color, size: 64 } })) return;
    }
    setSheet(null);
  }

  if (!loaded) return <div className="flex min-h-dvh items-center justify-center text-3xl">📖</div>;
  if (!occasion)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <p className="font-hand text-xl">Không tìm thấy trang này.</p>
        <Link href="/vuon" className="btn btn-ghost">Về vườn</Link>
      </div>
    );

  const sel = items.find((i) => i.id === selected) ?? null;
  const sorted = [...items].sort((a, b) => a.z - b.z);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="fixed inset-x-3 top-16 z-50 space-y-2" aria-live="polite">
        {notice && <p role="alert" className="paper-card p-3">{notice} <button onClick={() => setNotice("")}>Đóng</button></p>}
        {deleted.map((item) => <div key={item.id} className="paper-card p-3">Đã xoá · <button className="underline" onClick={() => undo(item)}>Hoàn tác</button></div>)}
      </div>
      {/* Đầu trang */}
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-paper/90 px-3 py-2 backdrop-blur">
        <Link href="/vuon" className="btn btn-ghost px-3 py-2" aria-label="Về vườn">←</Link>
        <button className="min-w-0 flex-1 text-left" onClick={() => setSheet("info")}>
          <h1 className="truncate font-script text-2xl leading-tight">{occasion.title}</h1>
          <p className="text-xs text-ink-soft">{formatDate(occasion.happened_on)}</p>
        </button>
        <button className={`btn ${editing ? "btn-primary" : "btn-ghost"}`} onClick={() => { setEditing((v) => !v); setSelected(null); }}>
          {editing ? "Xong" : "✏️ Trang trí"}
        </button>
      </header>

      {/* Trang scrapbook */}
      <div className="mx-auto w-full max-w-lg flex-1 px-3 pb-40 pt-2">
        <div
          ref={stageRef}
          className={`bg-${occasion.background} relative isolate w-full overflow-hidden rounded-[10px] shadow-[0_10px_30px_-12px_rgba(61,43,43,0.4)] ${editing ? "touch-none select-none" : ""}`}
          style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}` }}
          onPointerDown={onStagePointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {sorted.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center p-10 text-center font-hand text-xl text-ink-soft">
              {editing ? "Bấm các nút bên dưới để thêm ảnh, sticker, chữ nha" : "Trang này còn trống. Bấm “Trang trí” để bắt đầu."}
            </p>
          )}

          {sorted.map((item) => {
            const isSel = editing && item.id === selected;
            return (
              <div
                key={item.id}
                className={`absolute ${editing ? "cursor-grab" : ""}`}
                style={{
                  left: item.x * scale,
                  top: item.y * scale,
                  transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                  zIndex: isSel ? 100000 : item.z, // món đang chọn nổi lên trên để luôn bấm được tay cầm
                }}
                onPointerDown={(e) => onItemPointerDown(e, item)}
                onDoubleClick={() => {
                  if (editing && item.kind === "text") {
                    setTextDraft({ id: item.id, content: item.content ?? "", font: item.style.font ?? "hand", color: item.style.color ?? TEXT_COLORS[0] });
                    setSheet("text");
                  }
                }}
              >
                <div className={isSel ? "outline-2 outline-offset-4 outline-dashed outline-blush-deep" : ""}>
                  <ItemView item={item} url={item.storage_path ? urls[item.storage_path] : undefined} scale={scale} editing={editing} />
                </div>
                {isSel && (
                  <>
                    <button
                      className="absolute -bottom-4 -right-4 flex h-8 w-8 touch-none items-center justify-center rounded-full bg-blush-deep text-sm text-white shadow"
                      onPointerDown={(e) => onHandlePointerDown(e, item)}
                      aria-label="Xoay và phóng to"
                    >
                      ⤡
                    </button>
                    <button
                      className="absolute -right-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm shadow"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => removeItem(item)}
                      aria-label="Xoá"
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {!editing && occasion.description && (
          <p className="mt-5 whitespace-pre-wrap px-2 font-hand text-xl leading-relaxed">{occasion.description}</p>
        )}
      </div>

      {/* Thanh công cụ khi trang trí */}
      {editing && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          {sel && (
            <div className="flex gap-2 overflow-x-auto border-b border-ink/10 px-3 py-2 text-sm">
              <Mini onClick={() => { const z = maxZ() + 1; patch(sel.id, { z }); persist(sel.id, { z }); }}>⬆️ Lên trên</Mini>
              <Mini onClick={() => { const z = Math.min(...items.map((i) => i.z)) - 1; patch(sel.id, { z }); persist(sel.id, { z }); }}>⬇️ Xuống dưới</Mini>
              {(sel.kind === "photo" || sel.kind === "video") && (
                <Mini
                  onClick={() => {
                    const order = ["polaroid", "tape", "plain", "round"] as const;
                    const cur = sel.style.frame ?? "polaroid";
                    const style = { ...sel.style, frame: order[(order.indexOf(cur) + 1) % order.length] };
                    patch(sel.id, { style });
                    persist(sel.id, { style });
                  }}
                >
                  🖼️ Đổi khung
                </Mini>
              )}
              {sel.kind === "photo" && (
                <Mini
                  onClick={() => {
                    const caption = prompt("Chú thích dưới ảnh:", sel.style.caption ?? "");
                    if (caption === null) return;
                    const style = { ...sel.style, caption, frame: "polaroid" as const };
                    patch(sel.id, { style });
                    persist(sel.id, { style });
                  }}
                >
                  ✍️ Chú thích
                </Mini>
              )}
              {sel.kind === "text" && (
                <Mini onClick={() => { setTextDraft({ id: sel.id, content: sel.content ?? "", font: sel.style.font ?? "hand", color: sel.style.color ?? TEXT_COLORS[0] }); setSheet("text"); }}>
                  ✏️ Sửa chữ
                </Mini>
              )}
              <Mini onClick={() => { const rotation = 0; patch(sel.id, { rotation }); persist(sel.id, { rotation }); }}>↺ Thẳng lại</Mini>
              <Mini onClick={() => duplicate(sel)}>⧉ Nhân bản</Mini>
              <Mini onClick={() => removeItem(sel)}>🗑️ Xoá</Mini>
            </div>
          )}
          <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
            <label className="flex cursor-pointer flex-col items-center px-2 text-xs">
              <span className="text-2xl">📷</span>Ảnh/Video
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
            </label>
            <Tool icon="🌸" label="Sticker" onClick={() => setSheet("sticker")} />
            <Tool icon="✍️" label="Chữ" onClick={() => { setTextDraft({ content: "", font: "hand", color: TEXT_COLORS[0] }); setSheet("text"); }} />
            <Tool icon="🎨" label="Nền" onClick={() => setSheet("background")} />
          </div>
          {uploading && <p className="pb-2 text-center text-xs text-ink-soft">{uploading}</p>}
        </div>
      )}

      {/* Chọn sticker */}
      <Sheet open={sheet === "sticker"} onClose={() => setSheet(null)} title="Sticker">
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(BUILTIN_STICKERS).map(([key, s]) => (
            <button
              key={key}
              className="flex aspect-square items-center justify-center rounded-2xl bg-ink/5 p-3 active:scale-95"
              onClick={() => { setSheet(null); addItem({ kind: "sticker", content: `builtin:${key}`, width: key.startsWith("tape") ? 340 : 220 }); }}
              aria-label={s.label}
            >
              <div className="w-full"><StickerView content={`builtin:${key}`} /></div>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-6 gap-2 text-3xl">
          {EMOJI_STICKERS.map((em) => (
            <button key={em} className="rounded-xl py-1 active:scale-90" onClick={() => { setSheet(null); addItem({ kind: "sticker", content: `emoji:${em}`, width: 160 }); }}>
              {em}
            </button>
          ))}
        </div>
        <label className="btn btn-ghost mt-5 w-full cursor-pointer">
          ➕ Tự làm sticker từ ảnh (PNG nền trong)
          <input type="file" accept="image/png,image/webp,image/gif" className="hidden" onChange={(e) => onCustomSticker(e.target.files?.[0])} />
        </label>
      </Sheet>

      {/* Viết chữ */}
      <Sheet open={sheet === "text"} onClose={() => setSheet(null)} title={textDraft.id ? "Sửa chữ" : "Viết chữ"}>
        <textarea
          className={`field min-h-28 text-2xl ${FONT_CLASS[textDraft.font]}`}
          style={{ color: textDraft.color === "#ffffff" ? "#3d2b2b" : textDraft.color }}
          placeholder="Viết gì đó…"
          value={textDraft.content}
          onChange={(e) => setTextDraft((d) => ({ ...d, content: e.target.value }))}
          autoFocus
        />
        <div className="mt-3 flex gap-2">
          {(Object.keys(FONT_CLASS) as (keyof typeof FONT_CLASS)[]).map((f) => (
            <button key={f} className={`flex-1 rounded-xl border-2 py-2 text-lg ${FONT_CLASS[f]} ${textDraft.font === f ? "border-blush-deep" : "border-ink/10"}`} onClick={() => setTextDraft((d) => ({ ...d, font: f }))}>
              Yêu
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {TEXT_COLORS.map((c) => (
            <button key={c} className={`h-9 w-9 rounded-full border-4 ${textDraft.color === c ? "border-ink/40" : "border-ink/5"}`} style={{ background: c }} onClick={() => setTextDraft((d) => ({ ...d, color: c }))} aria-label={c} />
          ))}
        </div>
        <button className="btn btn-primary mt-5 w-full" onClick={saveText}>Xong</button>
      </Sheet>

      {/* Đổi nền */}
      <Sheet open={sheet === "background"} onClose={() => setSheet(null)} title="Nền trang">
        <div className="grid grid-cols-3 gap-3">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.value}
              className="flex flex-col items-center gap-1 text-sm"
              onClick={async () => {
                const previous = occasion;
                setOccasion({ ...occasion, background: b.value as Background });
                setSheet(null);
                const { error } = await sb.from("occasions").update({ background: b.value }).eq("id", occasion.id).select("id").single();
                if (error) { setOccasion(previous); setNotice("Không đổi được nền: " + error.message); }
              }}
            >
              <span className={`bg-${b.value} aspect-[5/7] w-full rounded-xl border-2 ${occasion.background === b.value ? "border-blush-deep" : "border-ink/10"}`} />
              {b.label}
            </button>
          ))}
        </div>
      </Sheet>

      <InfoSheet
        open={sheet === "info"}
        occasion={occasion}
        onClose={() => setSheet(null)}
        onSaved={(o) => setOccasion(o)}
        onDeleted={() => router.push("/vuon")}
      />
    </div>
  );
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

  return (
    <Sheet open={open} onClose={onClose} title="Thông tin dịp này">
      <div className="space-y-4">
        <label className="block"><Label>Tên</Label><input className="field" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block"><Label>Ngày</Label><input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="block"><Label>Kể lại một chút</Label><textarea className="field min-h-28 font-hand text-lg" value={desc} onChange={(e) => setDesc(e.target.value)} /></label>
        <button
          className="btn btn-primary w-full"
          onClick={async () => {
            const changes = { title: title.trim() || occasion.title, happened_on: date, description: desc.trim() || null };
            const { error } = await sb.from("occasions").update(changes).eq("id", occasion.id).select("id").single();
            if (error) return alert("Không lưu được: " + error.message);
            onSaved({ ...occasion, ...changes });
            onClose();
          }}
        >
          Lưu
        </button>
        <button
          className="btn btn-ghost w-full text-blush-deep"
          onClick={async () => {
            if (!confirm("Xoá cả trang này và mọi ảnh trong đó?")) return;
            const { data, error: readError } = await sb.from("album_items").select("storage_path").eq("occasion_id", occasion.id);
            const paths = (data ?? []).map((r) => r.storage_path).filter(Boolean) as string[];
            const { error } = await sb.from("occasions").delete().eq("id", occasion.id).select("id").single();
            if (error) return alert("Không xoá được: " + error.message);
            if (!readError) await removeUnusedFiles(paths);
            onDeleted();
          }}
        >
          Xoá trang này
        </button>
      </div>
    </Sheet>
  );
}

function Tool({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button className="flex flex-col items-center px-2 text-xs" onClick={onClick}>
      <span className="text-2xl">{icon}</span>
      {label}
    </button>
  );
}

function Mini({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button className="shrink-0 rounded-full bg-ink/5 px-3 py-1.5" onClick={onClick}>
      {children}
    </button>
  );
}
