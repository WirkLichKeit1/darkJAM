"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</p>

      <h1 style={{
        fontSize: "1.5rem",
        fontWeight: 700,
        marginBottom: "0.5rem",
        letterSpacing: "-0.02em",
      }}>
        Algo deu errado
      </h1>

      <p style={{
        fontSize: "0.9rem",
        color: "var(--text-secondary)",
        marginBottom: "2rem",
        maxWidth: "360px",
        lineHeight: 1.6,
      }}>
        Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
      </p>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={reset}
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--background)",
            padding: "0.7rem 1.5rem",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.9rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
        <a
          href="/"
          style={{
            backgroundColor: "var(--surface)",
            color: "var(--text-primary)",
            padding: "0.7rem 1.5rem",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "0.9rem",
            border: "1px solid var(--border)",
          }}
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}