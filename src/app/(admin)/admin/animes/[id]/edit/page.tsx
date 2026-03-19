"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { animeApi, episodeApi } from "@/lib/api";
import { AnimeResponse, EpisodeResponse } from "@/types/api";
import { Button, Badge, Skeleton } from "@/components/ui";
import AnimeForm from "../AnimeForm";

export default function EditAnimePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const animeId = Number(id);

  const [anime, setAnime] = useState<AnimeResponse | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingEp, setDeletingEp] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [animeData, epsData] = await Promise.all([
        animeApi.getById(animeId),
        episodeApi.getByAnime(animeId),
      ]);
      setAnime(animeData);
      setEpisodes(epsData);
    } catch {
      router.push("/admin/animes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [animeId]);

  const handleDeleteEpisode = async (epId: number, title: string) => {
    if (!confirm(`Deletar episódio "${title}"?`)) return;
    setDeletingEp(epId);
    try {
      await episodeApi.delete(animeId, epId);
      setEpisodes((prev) => prev.filter((ep) => ep.id !== epId));
    } catch {
      alert("Erro ao deletar episódio.");
    } finally {
      setDeletingEp(null);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Skeleton width="300px" height="2rem" />
      <Skeleton height="400px" borderRadius="12px" />
    </div>
  );

  if (!anime) return null;

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "2rem" }}>
        Editar: {anime.title}
      </h1>

      {/* Formulário do anime */}
      <AnimeForm initial={anime} />

      {/* Episódios */}
      <div style={{ marginTop: "3rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            Episódios ({episodes.length})
          </h2>
          <Link href={`/admin/animes/${animeId}/episodes/new`}>
            <Button size="sm">+ Novo episódio</Button>
          </Link>
        </div>

        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          {episodes.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Nenhum episódio cadastrado
            </div>
          ) : (
            episodes.map((ep) => (
              <div
                key={ep.id}
                style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-alt)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    T{ep.seasonNumber} · EP{ep.episodeNumber}
                  </p>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ep.title}
                  </p>
                </div>

                <Badge variant={ep.videoStatus === "READY" ? "success" : ep.videoStatus === "PROCESSING" ? "warning" : "error"}>
                  {ep.videoStatus === "READY" ? "Pronto" : ep.videoStatus === "PROCESSING" ? "Processando" : "Erro"}
                </Badge>

                <Badge variant={ep.published ? "success" : "default"}>
                  {ep.published ? "Publicado" : "Rascunho"}
                </Badge>

                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <Link href={`/admin/animes/${animeId}/episodes/${ep.id}/edit`}>
                    <Button variant="secondary" size="sm">Editar</Button>
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={deletingEp === ep.id}
                    onClick={() => handleDeleteEpisode(ep.id, ep.title)}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}