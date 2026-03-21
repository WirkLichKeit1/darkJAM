"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { episodeApi } from "@/lib/api";
import { EpisodeResponse, EpisodeRequest, VideoStatus } from "@/types/api";
import { Button, Input } from "@/components/ui";

interface EpisodeFormProps {
  animeId: number;
  initial?: EpisodeResponse;
}

// Simula progresso visual enquanto o backend processa.
// O backend não expõe progresso real (o Cloudinary não retorna % durante chunked upload),
// então animamos uma barra que avança até 90% e trava — os últimos 10% completam
// quando o polling confirma que o status virou READY.
function useSimulatedProgress(active: boolean) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      setProgress(0);
      // Avança ~1% a cada 3s, desacelerando perto de 90%
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const increment = Math.max(0.3, (90 - prev) * 0.03);
          return Math.min(90, prev + increment);
        });
      }, 3000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const complete = () => setProgress(100);
  const reset = () => setProgress(0);

  return { progress, complete, reset };
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
  const [pollingEpisodeId, setPollingEpisodeId] = useState<number | null>(null);
  const [videoStatus, setVideoStatus] = useState<VideoStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { progress, complete: completeProgress, reset: resetProgress } =
    useSimulatedProgress(uploadingVideo);

  // Polling: consulta o status do episódio a cada 5s enquanto PROCESSING
  useEffect(() => {
    if (!pollingEpisodeId) return;

    const poll = async () => {
      try {
        const ep = await episodeApi.getById(animeId, pollingEpisodeId);
        setVideoStatus(ep.videoStatus);

        if (ep.videoStatus === "READY") {
          completeProgress();
          setUploadingVideo(false);
          setPollingEpisodeId(null);
          // Redireciona após 1.5s para o usuário ver o 100%
          setTimeout(() => router.push(`/admin/animes/${animeId}/edit`), 1500);
        } else if (ep.videoStatus === "ERROR") {
          setUploadingVideo(false);
          setPollingEpisodeId(null);
          resetProgress();
          setError("O vídeo falhou ao ser processado. Tente enviar novamente.");
        }
        // Se ainda PROCESSING, continua o intervalo
      } catch {
        // Falha silenciosa no poll — tenta novamente no próximo ciclo
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [pollingEpisodeId, animeId, completeProgress, resetProgress, router]);

  const set = (key: keyof EpisodeRequest, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let episode: EpisodeResponse;
      if (isEditing) {
        episode = await episodeApi.update(animeId, initial!.id, form);
      } else {
        episode = await episodeApi.create(animeId, form);
      }

      if (thumbnailFile) {
        await episodeApi.uploadThumbnail(animeId, episode.id, thumbnailFile);
      }

      if (videoFile) {
        setLoading(false);
        setUploadingVideo(true);
        setVideoStatus("PROCESSING");

        // Envia o arquivo — o backend responde imediatamente (upload é async lá)
        await episodeApi.uploadVideo(animeId, episode.id, videoFile);

        // Inicia o polling para acompanhar o status real no Cloudinary
        setPollingEpisodeId(episode.id);
      } else {
        router.push(`/admin/animes/${animeId}/edit`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "Erro ao salvar episódio.");
      setLoading(false);
      setUploadingVideo(false);
      resetProgress();
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
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    letterSpacing: "0.03em",
    display: "block",
    marginBottom: "0.4rem",
  };

  const isSubmitting = loading || uploadingVideo;

  const progressLabel =
    videoStatus === "READY"
      ? "Concluído!"
      : progress < 30
      ? "Enviando para o servidor..."
      : progress < 70
      ? "Fazendo upload para o Cloudinary..."
      : progress < 90
      ? "Quase lá..."
      : "Finalizando processamento...";

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "700px" }}
    >
      <Input
        label="Título *"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        required
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <Input
          label="Temporada"
          type="number"
          min={1}
          value={form.seasonNumber ?? 1}
          onChange={(e) => set("seasonNumber", Number(e.target.value))}
        />
        <Input
          label="Número do episódio *"
          type="number"
          min={1}
          value={form.episodeNumber}
          onChange={(e) => set("episodeNumber", Number(e.target.value))}
          required
        />
        <Input
          label="Duração (segundos)"
          type="number"
          min={1}
          value={form.durationSeconds ?? ""}
          onChange={(e) =>
            set("durationSeconds", e.target.value ? Number(e.target.value) : undefined)
          }
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
        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
          Publicado (visível para usuários)
        </span>
      </label>

      {/* Upload vídeo */}
      <div>
        <label style={labelStyle}>
          Arquivo de vídeo {!isEditing && "*"}
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            {" "}(mp4, mkv, avi, webm)
          </span>
        </label>
        <input
          type="file"
          accept="video/mp4,video/x-matroska,video/avi,video/webm"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          style={{ ...selectStyle, cursor: "pointer" }}
          disabled={isSubmitting}
        />
        {videoFile && !uploadingVideo && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
            {(videoFile.size / 1_048_576).toFixed(1)} MB selecionado
          </p>
        )}
        {initial?.videoStatus === "READY" && !videoFile && !uploadingVideo && (
          <p style={{ fontSize: "0.75rem", color: "#4ade80", marginTop: "0.35rem" }}>
            ✓ Vídeo já enviado e pronto
          </p>
        )}
        {initial?.videoStatus === "PROCESSING" && !videoFile && !uploadingVideo && (
          <p style={{ fontSize: "0.75rem", color: "#fb923c", marginTop: "0.35rem" }}>
            ⏳ Vídeo em processamento — aguarde ou envie outro arquivo para substituir
          </p>
        )}

        {/* Barra de progresso */}
        {uploadingVideo && (
          <div style={{ marginTop: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {progressLabel}
              </span>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: videoStatus === "READY" ? "#4ade80" : "var(--accent)",
                }}
              >
                {Math.round(progress)}%
              </span>
            </div>
            {/* Track */}
            <div
              style={{
                width: "100%",
                height: "6px",
                backgroundColor: "var(--border)",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              {/* Fill */}
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  backgroundColor: videoStatus === "READY" ? "#4ade80" : "var(--accent)",
                  borderRadius: "6px",
                  transition: "width 2s ease, background-color 0.3s ease",
                }}
              />
            </div>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                marginTop: "0.4rem",
              }}
            >
              Vídeos grandes podem levar alguns minutos. Não feche esta aba.
            </p>
          </div>
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
        <p
          style={{
            fontSize: "0.85rem",
            color: "#f87171",
            backgroundColor: "#ef444415",
            border: "1px solid #ef444430",
            borderRadius: "8px",
            padding: "0.75rem 1rem",
          }}
        >
          {error}
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