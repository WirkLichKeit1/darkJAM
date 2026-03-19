import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];
const ADMIN_ROUTES = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const userRaw = request.cookies.get("user")?.value;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

  // Redireciona para login se não autenticado em rota protegida
  if (!isPublic && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redireciona para home se já autenticado tentando acessar login/register
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redireciona para home se não for admin tentando acessar rota admin
  if (isAdmin && userRaw) {
    try {
      const user = JSON.parse(userRaw);
      if (user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};