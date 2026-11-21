import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Các trang cần đăng nhập. Trang chủ "/" (đếm ngược) và /login để công khai.
const PROTECTED = ["/qua", "/vuon", "/album", "/thu", "/phieu", "/uoc", "/cai-dat"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // chưa cấu hình .env.local

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Làm mới phiên + kiểm tra nhanh. Quyền thật sự được RLS trong DB kiểm soát.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);
  const path = request.nextUrl.pathname;

  if (!loggedIn && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)"],
};
