"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(form);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--background)",
      padding: "1.5rem",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/">
            <span style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              dark<span style={{ color: "var(--accent)" }}>JAM</span>
            </span>
          </Link>
          <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Entre na sua conta
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "2rem",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <Input
              label="Usuário"
              type="text"
              placeholder="seu_usuario"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            {error && (
              <p style={{
                fontSize: "0.85rem",
                color: "#f87171",
                backgroundColor: "#ef444415",
                border: "1px solid #ef444430",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
              }}>
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} fullWidth style={{ marginTop: "0.5rem" }}>
              Entrar
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Não tem conta?{" "}
          <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}