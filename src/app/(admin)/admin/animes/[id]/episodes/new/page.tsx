"use client";

import { useParams } from "next/navigation";
import EpisodeForm from "../EpisodeForm";

export default function NewEpisodePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "2rem" }}>
        Novo episódio
      </h1>
      <EpisodeForm animeId={Number(id)} />
    </div>
  );
}