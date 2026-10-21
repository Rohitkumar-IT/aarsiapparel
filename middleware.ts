import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "aarsi_locale";
/** English lives at "/", Hindi at "/hi". Internally every page is served from app/[locale]/…  */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone(); url.pathname = pathname.slice(3) || "/"; return NextResponse.redirect(url, 308);
  }
  if (pathname === "/hi" || pathname.startsWith("/hi/")) return NextResponse.next();
  // Remember the visitor's choice: cookie=hi → send unprefixed pages to /hi
  if (req.cookies.get(COOKIE)?.value === "hi") {
    const url = req.nextUrl.clone(); url.pathname = pathname === "/" ? "/hi" : `/hi${pathname}`; return NextResponse.redirect(url, 307);
  }
  const url = req.nextUrl.clone(); url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}
export const config = { matcher: ["/((?!api|_next|brand|.*\\..*).*)"] };
