import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = ["/", "/beranda-masyarakat", "/tentang", "/hubungi-kami"];
const AUTH_PAGES = ["/masuk", "/daftar"];
// Prefix halaman publik tanpa session: lupa password (form + link reset dari email),
// verifikasi email pendaftaran (link dari email). Wajib bisa diakses user belum login
// dan dari Referer email client (bukan dari situs sendiri).
const PUBLIC_PREFIXES = ["/lupa-password", "/verifikasi"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  // ===== 1. Anti-bypass halaman masuk/daftar =====
  // Wajib dibuka lewat navigasi dari situs sendiri (harus ada Referer dari host yang sama)
  if (AUTH_PAGES.includes(pathname)) {
    const referer = req.headers.get("referer");
    const dariSitusSendiri = referer !== null && referer.includes(host);
    if (!dariSitusSendiri) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ===== 2. Halaman dalam: wajib cookie session =====
  // Halaman publik = PUBLIC_PAGES exact match ATAU PUBLIC_PREFIXES (root + sub-path /id).
  const isPublic =
    PUBLIC_PAGES.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthPage = AUTH_PAGES.includes(pathname);
  if (!isPublic && !isAuthPage) {
    const sessionCookie = req.cookies.get("session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon|icon|apple-icon|.*\\..*).*)"],
};
