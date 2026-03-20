// *** SEM "use client" — este é um Server Component ***
// Isso permite ler cookies server-side e redirecionar antes de renderizar qualquer coisa.
// A sidebar interativa ficou no AdminShell.tsx (client component separado).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

/**
 * Layout do painel admin.
 *
 * Por ser Server Component, pode verificar o cookie de autenticação
 * diretamente no servidor — sem expor lógica de auth para o cliente
 * e sem depender apenas do proxy.ts (que faz verificação superficial).
 *
 * Se o usuário não tiver role ADMIN, é redirecionado antes de qualquer
 * renderização, evitando flash de conteúdo protegido.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userRaw = cookieStore.get("user")?.value;

  // Sem token → manda para login
  if (!token) {
    redirect("/login");
  }

  // Com token mas sem cookie de user (estado inconsistente) → login
  if (!userRaw) {
    redirect("/login");
  }

  try {
    const user = JSON.parse(userRaw);
    // Role diferente de ADMIN → manda para home sem mostrar nada do admin
    if (user.role !== "ADMIN") {
      redirect("/");
    }
  } catch {
    // Cookie corrompido → login
    redirect("/login");
  }

  // Usuário é ADMIN — renderiza o shell com a sidebar
  return <AdminShell>{children}</AdminShell>;
}