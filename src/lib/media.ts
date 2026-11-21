"use client";

import { supabaseBrowser } from "./supabase/client";

export const BUCKET = "memories";
/** Giới hạn mặc định của Supabase gói miễn phí là 50MB/tệp. */
export const MAX_VIDEO_MB = 50;

const urlCache = new Map<string, { url: string; exp: number }>();

/** Lấy signed URL cho nhiều tệp một lúc (bucket riêng tư). Cache 50 phút. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const p of paths) {
    const hit = urlCache.get(p);
    if (hit && hit.exp > now) out[p] = hit.url;
    else missing.push(p);
  }
  if (missing.length) {
    const { data } = await supabaseBrowser().storage.from(BUCKET).createSignedUrls(missing, 3600);
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) {
        out[row.path] = row.signedUrl;
        urlCache.set(row.path, { url: row.signedUrl, exp: now + 50 * 60_000 });
      }
    }
  }
  return out;
}

/** Thu nhỏ ảnh (cạnh dài tối đa `max`px) trước khi up để đỡ tốn dung lượng. Giữ nền trong suốt cho PNG. */
export async function compressImage(file: File, max = 2000): Promise<{ blob: Blob; aspect: number; ext: string }> {
  const bitmap = await createImageBitmap(file);
  const aspect = bitmap.height / bitmap.width;
  if (file.type === "image/gif") return { blob: file, aspect, ext: "gif" };

  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const keepAlpha = file.type === "image/png" || file.type === "image/webp";
  const type = keepAlpha ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Không nén được ảnh"))), type, 0.85),
  );
  return { blob, aspect, ext: keepAlpha ? "webp" : "jpg" };
}

export function videoAspect(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve(v.videoWidth ? v.videoHeight / v.videoWidth : 9 / 16);
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => resolve(9 / 16);
    v.src = URL.createObjectURL(file);
  });
}

export async function uploadToBucket(folder: string, body: Blob, ext: string, contentType?: string) {
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseBrowser()
    .storage.from(BUCKET)
    .upload(path, body, { contentType: contentType ?? body.type, upsert: false });
  if (error) throw error;
  return path;
}
