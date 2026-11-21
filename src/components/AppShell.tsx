"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "@/lib/use-session";
import { supabaseBrowser } from "@/lib/supabase/client";

const NAV = [
  { href: "/vuon", label: "Vườn", icon: "🌷" },
  { href: "/thu", label: "Thư", icon: "💌" },
  { href: "/phieu", label: "Phiếu", icon: "🎟️" },
  { href: "/uoc", label: "Điều ước", icon: "⭐" },
];

/** Khung chung cho các trang đã đăng nhập: kiểm tra quyền + thanh điều hướng dưới đáy. */
export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <SessionProvider>
      <Gate hideNav={hideNav}>{children}</Gate>
    </SessionProvider>
  );
}

function Gate({ children, hideNav }: { children: ReactNode; hideNav: boolean }) {
  const s = useSession();

  if (s.status === "loading") return <Center>🌱</Center>;
  if (s.status === "signed-out")
    return (
      <Center>
        <Link href="/login" className="btn btn-primary">Đăng nhập</Link>
      </Center>
    );
  if (s.status === "not-member")
    return (
      <Center>
        <p className="font-hand text-xl text-center max-w-xs">
          Tài khoản {s.email} chưa được thêm vào khu vườn này.
        </p>
        <SignOut />
      </Center>
    );
  if (s.status === "locked")
    return (
      <Center>
        <p className="font-script text-3xl">Chưa tới giờ đâu nha</p>
        <Link href="/" className="btn btn-ghost">Xem đồng hồ đếm ngược</Link>
      </Center>
    );

  return (
    <div className="flex min-h-dvh flex-col">
      <main className={hideNav ? "flex-1" : "flex-1 pb-24"}>{children}</main>
      {!hideNav && <BottomNav isOwner={s.me.role === "owner"} />}
    </div>
  );
}

function BottomNav({ isOwner }: { isOwner: boolean }) {
  const path = usePathname();
  const items = isOwner ? [...NAV, { href: "/cai-dat", label: "Cài đặt", icon: "⚙️" }] : NAV;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md justify-around">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link href={it.href} className={`flex flex-col items-center px-3 py-2 text-xs ${active ? "text-blush-deep font-semibold" : "text-ink-soft"}`}>
                <span className="text-xl">{it.icon}</span>
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SignOut() {
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost"
      onClick={async () => {
        await supabaseBrowser().auth.signOut();
        router.replace("/login");
      }}
    >
      Đăng xuất
    </button>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-3xl">{children}</div>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="mx-auto flex max-w-2xl items-end justify-between gap-3 px-5 pt-8 pb-4">
      <div>
        <h1 className="font-script text-4xl leading-tight">{title}</h1>
        {subtitle && <p className="font-hand text-lg text-ink-soft">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
