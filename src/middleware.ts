import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = ["/", "/beranda-masyarakat", "/tentang", "/hubungi-kami"];
const AUTH_PAGES = ["/masuk", "/daftar"];

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
  const isPublic = PUBLIC_PAGES.includes(pathname);
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
