"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { animeApi, episodeApi } from "@/lib/api";
import { Skeleton } from "@/components/ui";

interface Stats {
  totalAnimes: number;
  ongoing: number;
  completed: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [all, ongoing, completed] = await Promise.all([
          animeApi.getAll(0, 1),
          animeApi.search({ status: "ONGOING", size: 1 }),
          animeApi.search({ status: "COMPLETED", size: 1 }),
        ]);
        setStats({
          totalAnimes: all.totalElements,
          ongoing: ongoing.totalElements,
          completed: completed.totalElements,
        });
      } catch {}
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total de animes", value: stats?.totalAnimes, icon: "🎌", href: "/admin/animes" },
    { label: "Em andamento", value: stats?.ongoing, icon: "📺", href: "/admin/animes?status=ONGOING" },
    { label: "Completos", value: stats?.completed, icon: "✅", href: "/admin/animes?status=COMPLETED" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "2rem" }}>
        Dashboard
      </h1>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.25rem",
              textDecoration: "none",
              transition: "border-color 0.2s",
              display: "block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{card.icon}</div>
            {loading ? (
              <Skeleton width="60px" height="2rem" />
            ) : (
              <p style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{card.value}</p>
            )}
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Ações rápidas */}
      <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "1rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Ações rápidas
      </h2>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {[
          { href: "/admin/animes/new", label: "+ Novo anime" },
          { href: "/admin/animes", label: "Gerenciar animes" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}