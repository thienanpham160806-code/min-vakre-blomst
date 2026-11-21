const TZ = "Asia/Ho_Chi_Minh";

export function formatDate(d: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...opts,
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function formatDateTime(d: string | Date) {
  return formatDate(d, { hour: "2-digit", minute: "2-digit" });
}

/** Số ngày từ `since` (YYYY-MM-DD) tới hôm nay, tính cả ngày đầu. */
export function daysSince(since: string) {
  const start = new Date(since + "T00:00:00+07:00").getTime();
  return Math.floor((Date.now() - start) / 86_400_000) + 1;
}

/** Chuyển giá trị <input type="datetime-local"> (hiểu là giờ VN) sang ISO. */
export function localInputToIso(value: string) {
  return new Date(value + ":00+07:00").toISOString();
}

/** Băm chuỗi thành số ổn định (để rải hoa trong vườn mà lần nào cũng giống nhau). */
export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
