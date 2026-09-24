import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = ["/", "/beranda-masyarakat", "/tentang", "/hubungi-kami"];
const AUTH_PAGES = ["/masuk", "/daftar"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Halaman masuk/daftar: wajib lewat beranda dulu (anti bypass)
  const visited = req.cookies.get("visited");
  if (AUTH_PAGES.includes(pathname) && (!visited || visited.value !== "1")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Halaman dalam (bukan publik/auth): wajib ada cookie "session" yang berisi
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
