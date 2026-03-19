"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { episodeApi } from "@/lib/api";
import { EpisodeResponse } from "@/types/api";
import { Skeleton } from "@/components/ui";
import EpisodeForm from "../EpisodeForm";

export default function EditEpisodePage() {
  const { id, epId } = useParams<{ id: string; epId: string }>();
  const router = useRouter();
  const animeId = Number(id);
  const episodeId = Number(epId);

  const [episode, setEpisode] = useState<EpisodeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    episodeApi
      .getById(animeId, episodeId)
      .then(setEpisode)
      .catch(() => router.push(`/admin/animes/${animeId}/edit`))
      .finally(() => setLoading(false));
  }, [animeId, episodeId, router]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Skeleton width="300px" height="2rem" />
      <Skeleton height="400px" borderRadius="12px" />
    </div>
  );

  if (!episode) return null;

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "2rem" }}>
        Editar: EP{episode.episodeNumber} — {episode.title}
      </h1>
      <EpisodeForm animeId={animeId} initial={episode} />
    </div>
  );
}