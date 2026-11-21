export function normalizeDriveUrl(input: string): string {
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new Error("Dán một đường liên kết Google Drive đầy đủ."); }
  if (url.protocol !== "https:") throw new Error("Liên kết phải dùng https.");
  if (url.hostname !== "drive.google.com" || url.port || url.username || url.password) {
    throw new Error("Chỉ nhận liên kết từ drive.google.com.");
  }
  const id = url.pathname === "/open" ? url.searchParams.get("id") : url.pathname.match(/^\/file\/d\/([A-Za-z0-9_-]+)(?:\/.*)?$/)?.[1];
  if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    throw new Error("Dùng liên kết của một file (/file/d/… hoặc /open?id=…), không dùng thư mục.");
  }
  return `https://drive.google.com/file/d/${id}/view`;
}
