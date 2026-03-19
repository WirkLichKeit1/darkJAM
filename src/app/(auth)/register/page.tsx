"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button, Input } from "@/components/ui";

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (form.password !== form.confirmPassword) {
      setValidationError("As senhas não coincidem");
      return;
    }
    if (form.password.length < 6) {
      setValidationError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    await register({ username: form.username, email: form.email, password: form.password });
  };

  const displayError = validationError || error;

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
            Crie sua conta gratuita
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
              label="E-mail"
              type="email"
              placeholder="voce@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              error={validationError === "As senhas não coincidem" ? validationError : undefined}
            />

            {displayError && (
              <p style={{
                fontSize: "0.85rem",
                color: "#f87171",
                backgroundColor: "#ef444415",
                border: "1px solid #ef444430",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
              }}>
                {displayError}
              </p>
            )}

            <Button type="submit" loading={loading} fullWidth style={{ marginTop: "0.5rem" }}>
              Criar conta
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          Já tem conta?{" "}
          <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}