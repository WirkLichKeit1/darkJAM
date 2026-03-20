"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "⊞" },
  { href: "/admin/animes", label: "Animes", icon: "🎌" },
  { href: "/admin/episodes", label: "Episódios", icon: "▶" },
];

/**
 * AdminShell — componente client que contém a sidebar e o layout visual do admin.
 * Separado do layout.tsx para que o layout possa ser um Server Component
 * (necessário para verificar cookies/auth server-side).
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh", paddingTop: "64px" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          backgroundColor: "var(--surface)",
          borderRight: "1px solid var(--border)",
          padding: "1.5rem 0",
          position: "sticky",
          top: "64px",
          height: "calc(100vh - 64px)",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "0 1rem", marginBottom: "1.5rem" }}>
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Admin Panel
          </span>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            padding: "0 0.75rem",
          }}
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive
                    ? "var(--accent-muted)"
                    : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  transition: "all 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.backgroundColor =
                      "var(--surface-alt)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo */}
      <main
        style={{ flex: 1, padding: "2rem 1.5rem", overflowX: "hidden" }}
      >
        {children}
      </main>
    </div>
  );
}