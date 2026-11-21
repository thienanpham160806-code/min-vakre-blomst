"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { SessionProvider, useSession } from "@/lib/use-session";
import { supabaseBrowser } from "@/lib/supabase/client";
import { IconGarden, IconLetter, IconPalette, IconSettings, IconStar, IconTicket, Sprout } from "./icons";
import { ThemeSheet } from "./ThemePicker";

const NAV = [
  { href: "/vuon", label: "Vườn", Icon: IconGarden },
  { href: "/thu", label: "Thư", Icon: IconLetter },
  { href: "/phieu", label: "Phiếu", Icon: IconTicket },
  { href: "/uoc", label: "Điều ước", Icon: IconStar },
];

/** Khung chung cho các trang đã đăng nhập: kiểm tra quyền + điều hướng thích ứng (bottom nav trên mobile, top nav trên iPad/laptop). */
export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <SessionProvider>
      <Gate hideNav={hideNav}>{children}</Gate>
    </SessionProvider>
  );
}

function Gate({ children, hideNav }: { children: ReactNode; hideNav: boolean }) {
  const s = useSession();
  const [themeOpen, setThemeOpen] = useState(false);

  if (s.status === "loading")
    return (
      <Center>
        <Sprout className="h-14 w-14" />
        <p className="font-hand text-xl text-ink-soft">Đang mở cánh cổng khu vườn…</p>
      </Center>
    );
  if (s.status === "signed-out")
    return (
      <Center>
        <div className="paper-card max-w-sm space-y-4 p-7 text-center animate-pop">
          <Sprout className="mx-auto h-12 w-12" />
          <p className="font-script text-3xl text-ink">min vakre blomst</p>
          <p className="font-hand text-lg text-ink-soft">Hãy đăng nhập để ghé khu vườn nhỏ của hai đứa nha.</p>
          <Link href="/login" className="btn btn-primary w-full">
            Đăng nhập
          </Link>
        </div>
      </Center>
    );
  if (s.status === "not-member")
    return (
      <Center>
        <div className="paper-card max-w-sm space-y-4 p-7 text-center animate-pop">
          <p className="font-hand text-xl text-ink">
            Tài khoản <span className="font-sans text-base font-semibold">{s.email}</span> chưa được thêm vào khu vườn này.
          </p>
          <SignOut />
        </div>
      </Center>
    );
  if (s.status === "locked")
    return (
      <Center>
        <div className="paper-card max-w-sm space-y-4 p-7 text-center animate-pop">
          <Sprout className="mx-auto h-14 w-14" />
          <p className="font-script text-4xl text-ink">Chưa tới giờ đâu nha</p>
          <p className="font-hand text-lg text-ink-soft">Hạt giống vẫn đang ủ dưới đất, chờ tới đúng khoảnh khắc để nở hoa.</p>
          <Link href="/" className="btn btn-primary w-full">
            Xem đồng hồ đếm ngược
          </Link>
        </div>
      </Center>
    );

  const isOwner = s.me.role === "owner";

  return (
    <div className="flex min-h-dvh flex-col">
      {!hideNav && <DesktopTopNav isOwner={isOwner} onOpenTheme={() => setThemeOpen(true)} />}
      <main className={hideNav ? "flex-1" : "flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-12"}>
        {children}
      </main>
      {!hideNav && <MobileBottomNav isOwner={isOwner} />}
      <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
    </div>
  );
}

function DesktopTopNav({ isOwner, onOpenTheme }: { isOwner: boolean; onOpenTheme: () => void }) {
  const path = usePathname();
  const items = isOwner ? [...NAV, { href: "/cai-dat", label: "Cài đặt", Icon: IconSettings }] : NAV;

  return (
    <header className="sticky top-0 z-40 hidden border-b border-[var(--border-soft)] bg-[var(--surface-paper)]/92 backdrop-blur-md md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
        <Link href="/vuon" className="group flex shrink-0 items-center gap-2 rounded-full py-1 pr-1 whitespace-nowrap">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage transition-transform group-hover:scale-105">
            <IconGarden width={20} height={20} />
          </span>
          <span className="font-script text-2xl leading-none text-ink">min vakre blomst</span>
        </Link>

        <nav aria-label="Điều hướng chính">
          <ul className="flex items-center gap-1 lg:gap-1.5">
            {items.map(({ href, label, Icon }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition lg:gap-2 lg:px-3.5 ${
                      active
                        ? "border-blush-deep/40 bg-blush text-ink font-semibold shadow-xs"
                        : "border-transparent text-ink-soft hover:border-[var(--border-soft)] hover:bg-[var(--surface-muted)] hover:text-ink"
                    }`}
                  >
                    <Icon width={17} height={17} className={active ? "text-blush-deep" : ""} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          onClick={onOpenTheme}
          className="btn btn-ghost min-h-10 shrink-0 px-3 py-1.5 text-sm lg:px-3.5"
          aria-label="Đổi giao diện sổ tay"
        >
          <IconPalette width={17} height={17} className="text-blush-deep" />
          <span className="hidden lg:inline">Giao diện</span>
        </button>
      </div>
    </header>
  );
}

function MobileBottomNav({ isOwner }: { isOwner: boolean }) {
  const path = usePathname();
  const items = isOwner ? [...NAV, { href: "/cai-dat", label: "Cài đặt", Icon: IconSettings }] : NAV;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-soft)] bg-[var(--surface-paper)]/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_22px_-12px_rgba(0,0,0,0.22)] backdrop-blur-md md:hidden"
      aria-label="Điều hướng chính"
    >
      <ul className="mx-auto flex max-w-md justify-around px-1">
        {items.map(({ href, label, Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-[58px] flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] transition-colors ${
                  active ? "font-semibold text-blush-deep" : "text-ink-soft hover:text-ink"
                }`}
              >
                <span
                  className={`relative flex h-7 w-12 items-center justify-center rounded-full border transition-all ${
                    active
                      ? "border-blush-deep/35 bg-blush text-blush-deep"
                      : "border-transparent group-hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <Icon width={19} height={19} />
                </span>
                <span className="truncate max-w-full px-0.5">{label}</span>
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
      type="button"
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
  return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  right,
  maxWidth = "max-w-3xl",
  showMobileTheme = true,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  maxWidth?: string;
  showMobileTheme?: boolean;
}) {
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <>
      <header className={`mx-auto flex ${maxWidth} items-start justify-between gap-3 px-4 pt-6 pb-4 sm:px-6 md:pt-8`}>
        <div className="min-w-0">
          <h1 className="font-script text-4xl leading-tight text-ink sm:text-[2.65rem]">{title}</h1>
          {subtitle && <p className="mt-0.5 font-hand text-lg leading-snug text-ink-soft sm:text-xl">{subtitle}</p>}
        </div>
        <div className="mt-1 flex shrink-0 items-center gap-2">
          {showMobileTheme && (
            <button
              type="button"
              onClick={() => setThemeOpen(true)}
              className="btn btn-ghost min-h-10 h-10 w-10 p-0 md:hidden"
              aria-label="Đổi giao diện"
              title="Đổi giao diện"
            >
              <IconPalette width={18} height={18} className="text-blush-deep" />
            </button>
          )}
          {right}
        </div>
      </header>
      <ThemeSheet open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
  );
}
