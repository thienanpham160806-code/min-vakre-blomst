"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "@/lib/use-session";
import { supabaseBrowser } from "@/lib/supabase/client";
import { IconGarden, IconLetter, IconSettings, IconStar, IconTicket, Sprout } from "./icons";

const NAV = [
  { href: "/vuon", label: "Vườn", Icon: IconGarden },
  { href: "/thu", label: "Thư", Icon: IconLetter },
  { href: "/phieu", label: "Phiếu", Icon: IconTicket },
  { href: "/uoc", label: "Điều ước", Icon: IconStar },
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

  if (s.status === "loading")
    return (
      <Center>
        <Sprout className="h-14 w-14" />
        <span className="sr-only">Đang tải</span>
      </Center>
    );
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
  const items = isOwner ? [...NAV, { href: "/cai-dat", label: "Cài đặt", Icon: IconSettings }] : NAV;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 pb-[env(safe-area-inset-bottom)]" aria-label="Điều hướng chính">
      <ul className="mx-auto flex max-w-md justify-around px-1">
        {items.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-14 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] transition-colors ${active ? "font-semibold text-blush-deep" : "text-ink-soft hover:text-ink"}`}
              >
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${active ? "bg-blush/35" : "group-hover:bg-ink/5"}`}>
                  <Icon width={20} height={20} />
                </span>
                {label}
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
    <header className="mx-auto flex max-w-2xl items-start justify-between gap-3 px-5 pt-9 pb-5">
      <div className="min-w-0">
        <h1 className="font-script text-4xl leading-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 font-hand text-lg leading-snug text-ink-soft">{subtitle}</p>}
      </div>
      {right && <div className="mt-1.5 shrink-0">{right}</div>}
    </header>
  );
}
