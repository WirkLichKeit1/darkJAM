"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { animeApi } from "@/lib/api";
import { AnimeResponse, PageResponse } from "@/types/api";
import { Button, Badge, Skeleton } from "@/components/ui";

const statusLabel: Record<string, { label: string; variant: "success" | "warning" | "error" | "default" }> = {
  ONGOING: { label: "Em andamento", variant: "success" },
  COMPLETED: { label: "Completo", variant: "default" },
  UPCOMING: { label: "Em breve", variant: "warning" },
  CANCELLED: { label: "Cancelado", variant: "error" },
};

export default function AdminAnimesPage() {
  const [data, setData] = useState<PageResponse<AnimeResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchAnimes = async () => {
    setLoading(true);
    try {
      const res = await animeApi.getAll(page, 20);
      setData(res);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnimes(); }, [page]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Deletar "${title}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    try {
      await animeApi.delete(id);
      await fetchAnimes();
    } catch {
      alert("Erro ao deletar anime.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Animes</h1>
        <Link href="/admin/animes/new">
          <Button>+ Novo anime</Button>
        </Link>
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 120px 80px 100px 120px",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border)",
          fontSize: "0.75rem", fontWeight: 700,
          color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase",
        }}>
          <span>Título</span>
          <span>Status</span>
          <span>Eps</span>
          <span>Nota</span>
          <span style={{ textAlign: "right" }}>Ações</span>
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
              <Skeleton width="60%" height="1rem" />
            </div>
          ))
        ) : data?.content.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Nenhum anime cadastrado
          </div>
        ) : (
          data?.content.map((anime) => {
            const status = statusLabel[anime.status] ?? { label: anime.status, variant: "default" as const };
            return (
              <div
                key={anime.id}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 120px 80px 100px 120px",
                  padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)",
                  alignItems: "center", transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-alt)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{anime.title}</p>
                  {anime.studio && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>{anime.studio}</p>}
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{anime.totalEpisodes}</span>
                <span style={{ fontSize: "0.85rem", color: anime.rating ? "#facc15" : "var(--text-muted)" }}>
                  {anime.rating ? `★ ${anime.rating}` : "—"}
                </span>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <Link href={`/admin/animes/${anime.id}/edit`}>
                    <Button variant="secondary" size="sm">Editar</Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deleting === anime.id}
                    onClick={() => handleDelete(anime.id, anime.title)}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 0}
            style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem", backgroundColor: "var(--surface-alt)", color: page === 0 ? "var(--text-muted)" : "var(--text-primary)", border: "1px solid var(--border)", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1 }}>
            ← Anterior
          </button>
          <span style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {page + 1} / {data.totalPages}
          </span>
          <button onClick={() => setPage((p) => p + 1)} disabled={data.last}
            style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem", backgroundColor: "var(--surface-alt)", color: data.last ? "var(--text-muted)" : "var(--text-primary)", border: "1px solid var(--border)", cursor: data.last ? "not-allowed" : "pointer", opacity: data.last ? 0.5 : 1 }}>
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}