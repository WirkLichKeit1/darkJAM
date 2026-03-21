"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { episodeApi } from "@/lib/api";
import { EpisodeResponse, EpisodeRequest } from "@/types/api";
import { Button, Input } from "@/components/ui";

interface EpisodeFormProps {
  animeId: number;
  initial?: EpisodeResponse;
}

export default function EpisodeForm({ animeId, initial }: EpisodeFormProps) {
  const router = useRouter();
  const isEditing = !!initial;

  const [form, setForm] = useState<EpisodeRequest>({
    title: initial?.title ?? "",
    episodeNumber: initial?.episodeNumber ?? 1,
    seasonNumber: initial?.seasonNumber ?? 1,
    synopsis: initial?.synopsis ?? "",
    durationSeconds: initial?.durationSeconds ?? undefined,
    published: initial?.published ?? false,
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const set = (key: keyof EpisodeRequest, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let episode: EpisodeResponse;
      if (isEditing) {
        episode = await episodeApi.update(animeId, initial!.id, form);
      } else {
        episode = await episodeApi.create(animeId, form);
      }

      // Thumbnail é pequena — upload síncrono normal
      if (thumbnailFile) await episodeApi.uploadThumbnail(animeId, episode.id, thumbnailFile);

      if (videoFile) {
        // O backend agora responde imediatamente — o upload para o Cloudinary
        // acontece em background. O frontend não precisa (e não deve) esperar.
        setLoading(false);
        setUploadingVideo(true);

        try {
          await episodeApi.uploadVideo(animeId, episode.id, videoFile);
          // uploadVideo retornou — significa que o backend recebeu o arquivo
          // e iniciou o upload assíncrono. O status já é PROCESSING no banco.
          setSuccessMessage(
            "Episódio salvo! O vídeo está sendo enviado para o servidor em segundo plano. " +
            "O status mudará para 'Pronto' automaticamente em alguns minutos."
          );
        } finally {
          setUploadingVideo(false);
        }

        // Não navega imediatamente — deixa o usuário ler o aviso
        setTimeout(() => {
          router.push(`/admin/animes/${animeId}/edit`);
        }, 4000);
      } else {
        router.push(`/admin/animes/${animeId}/edit`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Erro ao salvar episódio.");
      setLoading(false);
      setUploadingVideo(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    backgroundColor: "var(--surface-alt)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "0.65rem 1rem",
    fontSize: "0.9rem",
    color: "var(--text-primary)",
    outline: "none",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.8rem", fontWeight: 500,
    color: "var(--text-secondary)", letterSpacing: "0.03em",
    display: "block", marginBottom: "0.4rem",
  };

  const isSubmitting = loading || uploadingVideo;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "700px" }}>

      <Input label="Título *" value={form.title} onChange={(e) => set("title", e.target.value)} required />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <Input
          label="Temporada"
          type="number" min={1}
          value={form.seasonNumber ?? 1}
          onChange={(e) => set("seasonNumber", Number(e.target.value))}
        />
        <Input
          label="Número do episódio *"
          type="number" min={1}
          value={form.episodeNumber}
          onChange={(e) => set("episodeNumber", Number(e.target.value))}
          required
        />
        <Input
          label="Duração (segundos)"
          type="number" min={1}
          value={form.durationSeconds ?? ""}
          onChange={(e) => set("durationSeconds", e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>

      <div>
        <label style={labelStyle}>Sinopse</label>
        <textarea
          value={form.synopsis ?? ""}
          onChange={(e) => set("synopsis", e.target.value)}
          rows={3}
          style={{ ...selectStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => set("published", e.target.checked)}
          style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }}
        />
        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Publicado (visível para usuários)</span>
      </label>

      {/* Upload vídeo */}
      <div>
        <label style={labelStyle}>
          Arquivo de vídeo {!isEditing && "*"}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> (mp4, mkv, avi, webm)</span>
        </label>
        <input
          type="file"
          accept="video/mp4,video/x-matroska,video/avi,video/webm"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          style={{ ...selectStyle, cursor: "pointer" }}
          disabled={isSubmitting}
        />
        {videoFile && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
            {(videoFile.size / 1_048_576).toFixed(1)} MB selecionado
          </p>
        )}
        {initial?.videoStatus === "READY" && !videoFile && (
          <p style={{ fontSize: "0.75rem", color: "#4ade80", marginTop: "0.35rem" }}>
            ✓ Vídeo já enviado e pronto
          </p>
        )}
        {initial?.videoStatus === "PROCESSING" && !videoFile && (
          <p style={{ fontSize: "0.75rem", color: "#fb923c", marginTop: "0.35rem" }}>
            ⏳ Vídeo em processamento — aguarde ou envie outro arquivo para substituir
          </p>
        )}
        {/* Aviso de upload em background enquanto está enviando */}
        {uploadingVideo && (
          <p style={{
            fontSize: "0.8rem", color: "#fb923c",
            backgroundColor: "#fb923c15", border: "1px solid #fb923c30",
            borderRadius: "8px", padding: "0.75rem 1rem", marginTop: "0.5rem",
          }}>
            ⏳ Enviando vídeo para o servidor... Não feche esta aba. O episódio já foi salvo
            e o vídeo ficará disponível automaticamente quando o envio terminar.
          </p>
        )}
      </div>

      {/* Upload thumbnail */}
      <div>
        <label style={labelStyle}>Thumbnail</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
          style={{ ...selectStyle, cursor: "pointer" }}
          disabled={isSubmitting}
        />
        {initial?.thumbnailUrl && !thumbnailFile && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
            ✓ Thumbnail atual mantida
          </p>
        )}
      </div>

      {error && (
        <p style={{
          fontSize: "0.85rem", color: "#f87171",
          backgroundColor: "#ef444415", border: "1px solid #ef444430",
          borderRadius: "8px", padding: "0.75rem 1rem",
        }}>
          {error}
        </p>
      )}

      {successMessage && (
        <p style={{
          fontSize: "0.85rem", color: "#4ade80",
          backgroundColor: "#4ade8015", border: "1px solid #4ade8030",
          borderRadius: "8px", padding: "0.75rem 1rem",
        }}>
          ✓ {successMessage}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {uploadingVideo
            ? "Enviando vídeo..."
            : loading
            ? "Salvando..."
            : isEditing
            ? "Salvar alterações"
            : "Criar episódio"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/admin/animes/${animeId}/edit`)}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}