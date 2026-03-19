"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { historyApi } from "@/lib/api";
import { WatchHistoryResponse, PageResponse } from "@/types/api";
import { Skeleton } from "@/components/ui";

function ProgressBar({ progress, duration }: { progress: number; duration?: number | null }) {
  if (!duration) return null;
  const percent = Math.min((progress / duration) * 100, 100);
  return (
    <div style={{
      width: "100%", height: "3px",
      backgroundColor: "var(--border)",
      borderRadius: "3px",
      marginTop: "0.5rem",
      overflow: "hidden",
    }}>
      <div style={{
        width: `${percent}%`,
        height: "100%",
        backgroundColor: "var(--accent)",
        borderRadius: "3px",
      }} />
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (mins > 0) return `${mins}min atrás`;
  return "Agora";
}

function formatProgress(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HistoryPage() {
  const [data, setData] = useState<PageResponse<WatchHistoryResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setLoading(true);
    historyApi
      .getAll(page, 20)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "2rem" }}>
        Histórico
      </h1>

      {!loading && data?.totalElements === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎬</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Nenhum episódio assistido</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>
            Comece a assistir e seu histórico aparecerá aqui
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <Skeleton width="120px" height="68px" borderRadius="8px" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <Skeleton width="50%" height="0.75rem" />
                      <Skeleton width="80%" height="1rem" />
                      <Skeleton width="30%" height="0.75rem" />
                    </div>
                  </div>
                ))
              : data?.content.map((item) => (
                  <Link
                    key={item.id}
                    href={`/animes/${item.animeId}/watch/${item.episodeId}`}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                      padding: "0.75rem",
                      borderRadius: "12px",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                      transition: "border-color 0.2s, background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.backgroundColor = "var(--surface-alt)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.backgroundColor = "var(--surface)";
                    }}
                  >
                    {/* Cover */}
                    <div style={{
                      width: "120px", height: "68px",
                      borderRadius: "8px", overflow: "hidden",
                      backgroundColor: "var(--surface-alt)", flexShrink: 0,
                      position: "relative",
                    }}>
                      {item.animeCoverImageUrl ? (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_URL}/${item.animeCoverImageUrl}`}
                          alt={item.animeTitle}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          width: "100%", height: "100%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.5rem",
                        }}>🎌</div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                        {item.animeTitle} · T{item.seasonNumber} EP{item.episodeNumber}
                      </p>
                      <p style={{
                        fontSize: "0.95rem", fontWeight: 600,
                        color: "var(--text-primary)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {item.episodeTitle}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                        {item.completed ? (
                          <span style={{ fontSize: "0.7rem", color: "#4ade80", fontWeight: 600 }}>✓ Concluído</span>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {formatProgress(item.progressSeconds)}
                          </span>
                        )}
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {formatTimeAgo(item.watchedAt)}
                        </span>
                      </div>
                      {!item.completed && (
                        <ProgressBar progress={item.progressSeconds} duration={item.progressSeconds * 1.2} />
                      )}
                    </div>

                    {/* Play icon */}
                    <div style={{
                      flexShrink: 0, width: "32px", height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--accent)", fontSize: "0.8rem",
                    }}>▶</div>
                  </Link>
                ))
            }
          </div>

          {/* Paginação */}
          {data && data.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                style={{
                  padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem",
                  backgroundColor: "var(--surface-alt)", color: page === 0 ? "var(--text-muted)" : "var(--text-primary)",
                  border: "1px solid var(--border)", cursor: page === 0 ? "not-allowed" : "pointer",
                  opacity: page === 0 ? 0.5 : 1,
                }}
              >
                ← Anterior
              </button>
              <span style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
                style={{
                  padding: "0.4rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem",
                  backgroundColor: "var(--surface-alt)", color: data.last ? "var(--text-muted)" : "var(--text-primary)",
                  border: "1px solid var(--border)", cursor: data.last ? "not-allowed" : "pointer",
                  opacity: data.last ? 0.5 : 1,
                }}
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