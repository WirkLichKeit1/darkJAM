"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--background)",
      padding: "2rem",
      textAlign: "center",
    }}>
      <p style={{
        fontSize: "8rem",
        fontWeight: 800,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        color: "var(--surface-alt)",
        userSelect: "none",
      }}>
        404
      </p>

      <h1 style={{
        fontSize: "1.5rem",
        fontWeight: 700,
        marginTop: "1rem",
        marginBottom: "0.5rem",
        letterSpacing: "-0.02em",
      }}>
        Página não encontrada
      </h1>

      <p style={{
        fontSize: "0.95rem",
        color: "var(--text-secondary)",
        marginBottom: "2rem",
        maxWidth: "360px",
        lineHeight: 1.6,
      }}>
        A página que você está procurando não existe ou foi removida.
      </p>

      <Link
        href="/"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--background)",
          padding: "0.7rem 1.75rem",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "0.9rem",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
      >
        Voltar para o início
      </Link>
    </div>
  );
}