"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabaseBrowser } from "./supabase/client";
import { useUnlock } from "./use-unlock";
import type { Member, Settings } from "./types";

type State =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "not-member"; email: string | null }
  | { status: "locked"; settings: Settings }
  | { status: "ready"; me: Member; partner: Member | null; members: Member[]; settings: Settings };

const Ctx = createContext<State>({ status: "loading" });

export function SessionProvider({ children }: { children: ReactNode }) {
  const left = useUnlock();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const sb = supabaseBrowser();
    let cancelled = false;

    async function load() {
      const { data: auth } = await sb.auth.getUser();
      if (!auth.user) return setState({ status: "signed-out" });

      const [{ data: members }, { data: settings }] = await Promise.all([
        sb.from("members").select("user_id, display_name, role, email"),
        sb.from("settings").select("unlock_at, together_since").eq("id", 1).maybeSingle(),
      ]);
      if (cancelled) return;

      const me = (members ?? []).find((m) => m.user_id === auth.user!.id) as Member | undefined;
      if (!me || !settings) return setState({ status: "not-member", email: auth.user.email ?? null });

      if (me.role !== "owner" && (left === null || left > 0)) {
        return setState({ status: "locked", settings });
      }
      const partner = ((members ?? []).find((m) => m.user_id !== me.user_id) as Member) ?? null;
      setState({ status: "ready", me, partner, members: (members ?? []) as Member[], settings });
    }

    load();
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [left === null || left > 0]);

  return <Ctx value={state}>{children}</Ctx>;
}

export function useSession() {
  return useContext(Ctx);
}

/** Dùng bên trong <AppShell>, lúc này chắc chắn đã "ready". */
export function useReady() {
  const s = useContext(Ctx);
  if (s.status !== "ready") throw new Error("useReady() chỉ dùng bên trong AppShell");
  return s;
}
