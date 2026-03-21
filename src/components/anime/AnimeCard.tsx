"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimeResponse } from "@/types/api";
import { Badge } from "@/components/ui";

const statusLabel: Record<string, { label: string; variant: "success" | "warning" | "error" | "default" }> = {
  ONGOING: { label: "Em andamento", variant: "success" },
  COMPLETED: { label: "Completo", variant: "default" },
  UPCOMING: { label: "Em breve", variant: "warning" },
  CANCELLED: { label: "Cancelado", variant: "error" },
};

interface AnimeCardProps {
  anime: AnimeResponse;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const status = statusLabel[anime.status] ?? { label: anime.status, variant: "default" };

  return (
    <Link
      href={`/animes/${anime.id}`}
      style={{ display: "block", textDecoration: "none" }}
    >
      <div
        style={{ borderRadius: "10px", overflow: "hidden", transition: "transform 0.2s ease" }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        {/* Cover */}
        <div style={{ position: "relative", aspectRatio: "2/3", backgroundColor: "var(--surface-alt)" }}>
          {anime.coverImageUrl ? (
            <Image
              src={anime.coverImageUrl}
              alt={anime.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 768px) 50vw, 200px"
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, var(--surface-alt), var(--border))",
            }}>
              <span style={{ fontSize: "2rem" }}>🎌</span>
            </div>
          )}

          {/* Overlay no hover */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(10,10,15,0.8) 0%, transparent 50%)",
          }} />

          {/* Badge de status */}
          <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem" }}>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          {/* Rating */}
          {anime.rating && (
            <div style={{
              position: "absolute", top: "0.5rem", right: "0.5rem",
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              borderRadius: "6px",
              padding: "0.2rem 0.5rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#facc15",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}>
              ★ {anime.rating}
            </div>
          )}

          {/* Episódios */}
          <div style={{
            position: "absolute", bottom: "0.5rem", right: "0.5rem",
            fontSize: "0.7rem",
            color: "var(--text-secondary)",
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            borderRadius: "4px",
            padding: "0.15rem 0.4rem",
          }}>
            {anime.totalEpisodes} ep
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "0.6rem 0.25rem" }}>
          <h3 style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {anime.title}
          </h3>
          {anime.genre && (
            <p style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "0.25rem",
            }}>
              {anime.genre}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}