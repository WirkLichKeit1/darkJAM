import { NextRequest, NextResponse } from "next/server";

// Rotas que usuários não autenticados podem acessar
const PUBLIC_ROUTES = ["/login", "/register"];

/**
 * proxy.ts — camada fina de roteamento (Next.js 16)
 *
 * IMPORTANTE: este arquivo faz apenas redirecionamento básico por cookie.
 * A verificação real de permissões (ex: role ADMIN) acontece nos Server
 * Components dos layouts, onde o JWT pode ser validado com segurança.
 *
 * Não coloque lógica pesada aqui — proxy.ts roda em Edge Runtime e
 * não tem acesso a Node.js APIs completas.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Sem token tentando acessar rota protegida → redireciona para login
  if (!isPublic && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Já autenticado tentando acessar login/register → redireciona para home
  if (isPublic && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Aplica em todas as rotas exceto assets estáticos e rotas internas do Next
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};