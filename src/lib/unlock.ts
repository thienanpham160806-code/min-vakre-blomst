export type UnlockInfo = { unlock_at: string; server_now: string };

/** elapsed dùng đồng hồ đơn điệu để đổi giờ máy giữa phiên không đổi đồng hồ đếm ngược. */
export function remainingMs(info: UnlockInfo, elapsedMs = 0): number {
  return Math.max(0, Date.parse(info.unlock_at) - Date.parse(info.server_now) - elapsedMs);
}
