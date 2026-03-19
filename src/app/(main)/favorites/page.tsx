"use client";

import { useEffect, useState } from "react";
import { favoriteApi } from "@/lib/api";
import { AnimeResponse, PageResponse } from "@/types/api";
import { Skeleton } from "@/components/ui";
import AnimeCard from "@/components/anime/AnimeCard";

export default function FavoritesPage() {
  const [data, setData] = useState<PageResponse<AnimeResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    favoriteApi
      .getAll(page, 24)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "2rem" }}>
        Meus favoritos
      </h1>

      {!loading && data?.totalElements === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>♡</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Nenhum favorito ainda</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>
            Explore os animes e adicione aos favoritos
          </p>
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "1rem",
          }}>
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton height="240px" borderRadius="10px" />
                    <Skeleton width="80%" height="0.9rem" style={{ marginTop: "0.5rem" }} />
                  </div>
                ))
              : data?.content.map((anime) => <AnimeCard key={anime.id} anime={anime} />)
            }
          </div>

          {/* Paginação */}
          {data && data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                style={pageBtnStyle(false, page === 0)}
              >
                ← Anterior
              </button>
              <span style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
                style={pageBtnStyle(false, data.last)}
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const pageBtnStyle = (current: boolean, disabled: boolean): React.CSSProperties => ({
  padding: "0.4rem 0.75rem",
  borderRadius: "6px",
  fontSize: "0.85rem",
  fontWeight: 500,
  backgroundColor: current ? "var(--accent)" : "var(--surface-alt)",
  color: disabled ? "var(--text-muted)" : "var(--text-primary)",
  border: "1px solid var(--border)",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
});