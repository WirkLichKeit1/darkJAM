"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { episodeApi } from "@/lib/api";
import { EpisodeResponse } from "@/types/api";
import { Skeleton, Badge } from "@/components/ui";
import VideoPlayer from "@/components/player/VideoPlayer";

export default function WatchPage() {
  const { id, ep } = useParams<{ id: string; ep: string }>();
  const router = useRouter();
  const animeId = Number(id);
  const episodeId = Number(ep);

  const [episode, setEpisode] = useState<EpisodeResponse | null>(null);
  const [allEpisodes, setAllEpisodes] = useState<EpisodeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [epData, allEps] = await Promise.all([
          episodeApi.getById(animeId, episodeId),
          episodeApi.getByAnime(animeId),
        ]);
        setEpisode(epData);
        setAllEpisodes(allEps);
      } catch {
        router.push(`/animes/${animeId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [animeId, episodeId, router]);

  const currentIndex = allEpisodes.findIndex((e) => e.id === episodeId);
  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  const handleNext = () => {
    if (nextEpisode) router.push(`/animes/${animeId}/watch/${nextEpisode.id}`);
  };

  const handlePrev = () => {
    if (prevEpisode) router.push(`/animes/${animeId}/watch/${prevEpisode.id}`);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <Skeleton height="56.25vw" style={{ maxHeight: "600px" }} borderRadius="12px" />
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Skeleton width="60%" height="1.75rem" />
          <Skeleton width="40%" height="1rem" />
        </div>
      </div>
    );
  }

  if (!episode) return null;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <Link href="/animes" style={{ color: "var(--text-muted)", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >Animes</Link>
        <span>/</span>
        <Link href={`/animes/${animeId}`} style={{ color: "var(--text-muted)", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >{episode.animeTitle}</Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>T{episode.seasonNumber} EP{episode.episodeNumber}</span>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Player + info */}
        <div style={{ flex: "1 1 600px", minWidth: 0 }}>

          {/* Player */}
          {episode.videoStatus === "READY" ? (
            <VideoPlayer
              episodeId={episodeId}
              title={`${episode.animeTitle} — T${episode.seasonNumber} EP${episode.episodeNumber}: ${episode.title}`}
              duration={episode.durationSeconds ?? 0}
              onNext={nextEpisode ? handleNext : undefined}
              onPrev={prevEpisode ? handlePrev : undefined}
            />
          ) : (
            <div style={{
              aspectRatio: "16/9",
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}>
              <span style={{ fontSize: "2.5rem" }}>
                {episode.videoStatus === "PROCESSING" ? "⏳" : "⚠️"}
              </span>
              <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                {episode.videoStatus === "PROCESSING"
                  ? "Vídeo em processamento..."
                  : "Erro ao processar o vídeo"}
              </p>
              {episode.videoStatus === "PROCESSING" && (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Tente novamente em alguns instantes
                </p>
              )}
            </div>
          )}

          {/* Info do episódio */}
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                  Temporada {episode.seasonNumber} · Episódio {episode.episodeNumber}
                </p>
                <h1 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {episode.title}
                </h1>
              </div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", flexShrink: 0, paddingTop: "0.25rem" }}>
                {episode.views.toLocaleString()} views
              </span>
            </div>

            {episode.synopsis && (
              <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                {episode.synopsis}
              </p>
            )}
          </div>

          {/* Nav prev/next */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            {prevEpisode && (
              <Link
                href={`/animes/${animeId}/watch/${prevEpisode.id}`}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>← Episódio anterior</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  EP{prevEpisode.episodeNumber}: {prevEpisode.title}
                </span>
              </Link>
            )}
            {nextEpisode && (
              <Link
                href={`/animes/${animeId}/watch/${nextEpisode.id}`}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                  textAlign: "right",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Próximo episódio →</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  EP{nextEpisode.episodeNumber}: {nextEpisode.title}
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Lista de episódios */}
        <div style={{
          width: "300px",
          flexShrink: 0,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)" }}>
            <Link href={`/animes/${animeId}`} style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
              {episode.animeTitle}
            </Link>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              {allEpisodes.length} episódios
            </p>
          </div>

          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            {allEpisodes.map((ep) => {
              const isActive = ep.id === episodeId;
              return (
                <Link
                  key={ep.id}
                  href={`/animes/${animeId}/watch/${ep.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: isActive ? "var(--accent-muted)" : "transparent",
                    transition: "background-color 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--surface-alt)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    width: "64px", height: "36px",
                    borderRadius: "4px", overflow: "hidden",
                    backgroundColor: "var(--surface-alt)", flexShrink: 0,
                    position: "relative",
                  }}>
                    {ep.thumbnailUrl ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/${ep.thumbnailUrl}`}
                        alt={ep.title}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isActive ? "var(--accent)" : "var(--text-muted)",
                        fontSize: "0.9rem",
                      }}>
                        {isActive ? "▶" : ep.episodeNumber}
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: "0.75rem",
                      color: isActive ? "var(--accent)" : "var(--text-muted)",
                      marginBottom: "0.1rem",
                    }}>
                      EP {ep.episodeNumber}
                    </p>
                    <p style={{
                      fontSize: "0.82rem",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "var(--accent)" : "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {ep.title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}