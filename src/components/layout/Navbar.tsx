"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authenticated, admin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/animes", label: "Animes" },
    ...(authenticated ? [
      { href: "/favorites", label: "Favoritos" },
      { href: "/history", label: "Histórico" },
    ] : []),
    ...(admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "all 0.3s ease",
        backgroundColor: scrolled ? "rgba(10,10,15,0.95)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "0 1.5rem",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}>
            dark<span style={{ color: "var(--accent)" }}>JAM</span>
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          gap: "2rem",
        }} className="hidden-mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: pathname.startsWith(link.href)
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                transition: "color 0.2s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = pathname.startsWith(link.href) ? "var(--text-primary)" : "var(--text-secondary)")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth — desktop */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }} className="hidden-mobile">
          {authenticated ? (
            <>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                {user?.username}
              </span>
              <button
                onClick={logout}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                Entrar
              </Link>
              <Link
                href="/register"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--background)",
                  backgroundColor: "var(--accent)",
                  padding: "0.4rem 1rem",
                  borderRadius: "6px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
              >
                Criar conta
              </Link>
            </>
          )}
        </div>

        {/* Hamburguer — mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="show-mobile"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem",
            display: "none",
            flexDirection: "column",
            gap: "5px",
          }}
          aria-label="Menu"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: "22px",
                height: "2px",
                backgroundColor: "var(--text-primary)",
                borderRadius: "2px",
                transition: "all 0.3s ease",
                transform: menuOpen
                  ? i === 0 ? "translateY(7px) rotate(45deg)"
                  : i === 2 ? "translateY(-7px) rotate(-45deg)"
                  : "scaleX(0)"
                  : "none",
              }}
            />
          ))}
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div style={{
          backgroundColor: "var(--surface)",
          borderTop: "1px solid var(--border)",
          padding: "1rem 1.5rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "1rem",
                fontWeight: 500,
                color: pathname.startsWith(link.href) ? "var(--accent)" : "var(--text-primary)",
                padding: "0.5rem 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {link.label}
            </Link>
          ))}
          {authenticated ? (
            <button
              onClick={logout}
              style={{
                textAlign: "left",
                fontSize: "1rem",
                color: "var(--text-secondary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem 0",
              }}
            >
              Sair ({user?.username})
            </button>
          ) : (
            <div style={{ display: "flex", gap: "1rem", paddingTop: "0.5rem" }}>
              <Link href="/login" style={{
                flex: 1,
                textAlign: "center",
                padding: "0.75rem",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontWeight: 500,
                color: "var(--text-primary)",
              }}>
                Entrar
              </Link>
              <Link href="/register" style={{
                flex: 1,
                textAlign: "center",
                padding: "0.75rem",
                backgroundColor: "var(--accent)",
                borderRadius: "8px",
                fontWeight: 600,
                color: "var(--background)",
              }}>
                Criar conta
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  );
}