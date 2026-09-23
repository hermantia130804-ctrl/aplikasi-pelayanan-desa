import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = ["/", "/beranda-masyarakat", "/tentang", "/hubungi-kami"];
const AUTH_PAGES = ["/masuk", "/daftar"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Tandai pengunjung yang sudah melewati gerbang beranda
  let res = NextResponse.next();
  if (pathname === "/" && req.cookies.get("visited")?.value !== "1") {
    res.cookies.set("visited", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // 2. Halaman masuk/daftar: wajib lewat beranda dulu (anti bypass)
  if (AUTH_PAGES.includes(pathname) && req.cookies.get("visited")?.value !== "1") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. Halaman dalam (bukan publik, bukan auth): wajib ada cookie sesi
  const isPublic = PUBLIC_PAGES.includes(pathname);
  const isAuthPage = AUTH_PAGES.includes(pathname);
  if (!isPublic && !isAuthPage) {
    const cookieNames = [...req.cookies.keys()];
    const hasSession = cookieNames.some((n) => n.toLowerCase().includes("session"));
    if (!hasSession) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
