"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      backgroundColor: "var(--surface)",
      padding: "2rem 1.5rem",
      marginTop: "auto",
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}>
        <span style={{
          fontSize: "1.1rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}>
          dark<span style={{ color: "var(--accent)" }}>JAM</span>
        </span>

        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {[
            { href: "/animes", label: "Animes" },
            { href: "/favorites", label: "Favoritos" },
            { href: "/history", label: "Histórico" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} darkJAM
        </span>
      </div>
    </footer>
  );
}