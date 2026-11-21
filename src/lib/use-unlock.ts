"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase/client";
import { remainingMs, type UnlockInfo } from "./unlock";

export function useUnlock() {
  const [clock, setClock] = useState<{ left: number | null; unlockAt: string | null }>({ left: null, unlockAt: null });
  useEffect(() => {
    let alive = true;
    let sample: { info: UnlockInfo; at: number } | null = null;
    let nextSync = 0;
    let busy = false;
    async function tick() {
      const now = performance.now();
      if (!busy && now >= nextSync) {
        busy = true;
        try {
          const { data, error } = await supabaseBrowser().rpc("unlock_info").single();
          if (!error && data) sample = { info: data as UnlockInfo, at: performance.now() };
        } catch {
          // Mất mạng: giữ mẫu máy chủ gần nhất, chưa có mẫu thì tiếp tục chờ.
        } finally {
          busy = false;
          const remaining = sample ? remainingMs(sample.info, performance.now() - sample.at) : Infinity;
          nextSync = performance.now() + (remaining > 0 && remaining < 10_000 ? 1000 : 10_000);
        }
      }
      if (alive && sample) setClock({ left: remainingMs(sample.info, performance.now() - sample.at), unlockAt: sample.info.unlock_at });
    }
    void tick();
    const timer = setInterval(() => void tick(), 1000);
    return () => { alive = false; clearInterval(timer); };
  }, []);
  return clock;
}
