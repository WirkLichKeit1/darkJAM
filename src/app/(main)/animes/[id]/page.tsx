"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { animeApi, episodeApi, favoriteApi } from "@/lib/api";
import { AnimeResponse, EpisodeResponse } from "@/types/api";
import { Badge, Skeleton, Button } from "@/components/ui";
import { isAuthenticated } from "@/lib/auth";

const statusLabel: Record<string, { label: string; variant: "success" | "warning" | "error" | "default" }> = {
  ONGOING: { label: "Em andamento", variant: "success" },
  COMPLETED: { label: "Completo", variant: "default" },
  UPCOMING: { label: "Em breve", variant: "warning" },
  CANCELLED: { label: "Cancelado", variant: "error" },
};

export default function AnimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const animeId = Number(id);

  const [anime, setAnime] = useState<AnimeResponse | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeResponse[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [animeData, episodesData] = await Promise.all([
          animeApi.getById(animeId),
          episodeApi.getByAnime(animeId),
        ]);
        setAnime(animeData);
        setEpisodes(episodesData);

        if (isAuthenticated()) {
          const fav = await favoriteApi.check(animeId);
          setIsFavorite(fav);
        }
      } catch {
        router.push("/animes");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [animeId, router]);

  const toggleFavorite = async () => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await favoriteApi.remove(animeId);
        setIsFavorite(false);
      } else {
        await favoriteApi.add(animeId);
        setIsFavorite(true);
      }
    } catch {}
    finally { setFavoriteLoading(false); }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  if (loading) {
    return (
      <div>
        <Skeleton height="400px" borderRadius="0" />
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <Skeleton width="200px" height="300px" borderRadius="12px" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Skeleton width="60%" height="2.5rem" />
              <Skeleton width="40%" height="1rem" />
              <Skeleton width="100%" height="5rem" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!anime) return null;

  const status = statusLabel[anime.status] ?? { label: anime.status, variant: "default" as const };
  const firstEpisode = episodes[0];

  return (
    <div>
      {/* Banner */}
      <div style={{ position: "relative", height: "400px", overflow: "hidden" }}>
        {anime.bannerImageUrl ? (
          <Image
            src={anime.bannerImageUrl}
            alt={anime.title}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1a1a24, #0a0a0f)" }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, var(--background) 0%, rgba(10,10,15,0.5) 60%, transparent 100%)",
        }} />
      </div>

      {/* Conteúdo */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem 3rem" }}>
        <div style={{
          display: "flex",
          gap: "2rem",
          marginTop: "-120px",
          position: "relative",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}>
          {/* Cover */}
          <div style={{
            width: "160px",
            flexShrink: 0,
            borderRadius: "12px",
            overflow: "hidden",
            border: "3px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            aspectRatio: "2/3",
            position: "relative",
            backgroundColor: "var(--surface-alt)",
          }}>
            {anime.coverImageUrl ? (
              <Image
                src={anime.coverImageUrl}
                alt={anime.title}
                fill
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "3rem",
              }}>🎌</div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: "280px", paddingBottom: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              <Badge variant={status.variant}>{status.label}</Badge>
              {anime.genre && <Badge>{anime.genre}</Badge>}
              {anime.releaseYear && <Badge>{anime.releaseYear}</Badge>}
            </div>

            <h1 style={{
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              marginBottom: "0.25rem",
            }}>
              {anime.title}
            </h1>

            {anime.originalTitle && (
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                {anime.originalTitle}
              </p>
            )}

            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {anime.studio && (
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Estúdio: </span>{anime.studio}
                </span>
              )}
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--text-muted)" }}>Episódios: </span>{anime.totalEpisodes}
              </span>
              {anime.rating && (
                <span style={{ fontSize: "0.85rem", color: "#facc15" }}>
                  ★ {anime.rating}
                </span>
              )}
            </div>

            {/* Ações */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {firstEpisode && (
                <Link
                  href={`/animes/${animeId}/watch/${firstEpisode.id}`}
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    padding: "0.7rem 1.5rem",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  ▶ Assistir agora
                </Link>
              )}
              <Button
                variant="secondary"
                onClick={toggleFavorite}
                loading={favoriteLoading}
              >
                {isFavorite ? "♥ Favoritado" : "♡ Favoritar"}
              </Button>
            </div>
          </div>
        </div>

        {/* Sinopse */}
        {anime.synopsis && (
          <div style={{ marginTop: "2.5rem", maxWidth: "800px" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Sinopse
            </h2>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "var(--text-secondary)" }}>
              {anime.synopsis}
            </p>
          </div>
        )}

        {/* Episódios */}
        {episodes.length > 0 && (
          <div style={{ marginTop: "2.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "1rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Episódios ({episodes.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/animes/${animeId}/watch/${ep.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    transition: "border-color 0.2s, background-color 0.2s",
                    textDecoration: "none",
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
                  {/* Thumbnail */}
                  <div style={{
                    width: "100px", height: "56px",
                    borderRadius: "6px", overflow: "hidden",
                    backgroundColor: "var(--surface-alt)", flexShrink: 0,
                    position: "relative",
                  }}>
                    {ep.thumbnailUrl ? (
                      <Image
                        src={ep.thumbnailUrl}
                        alt={ep.title}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--text-muted)", fontSize: "1.25rem",
                      }}>▶</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                      T{ep.seasonNumber} · EP {ep.episodeNumber}
                    </p>
                    <p style={{
                      fontSize: "0.9rem", fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {ep.title}
                    </p>
                  </div>

                  {/* Duração + views */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.2rem", flexShrink: 0 }}>
                    {formatDuration(ep.durationSeconds) && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {formatDuration(ep.durationSeconds)}
                      </span>
                    )}
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {ep.views.toLocaleString()} views
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}