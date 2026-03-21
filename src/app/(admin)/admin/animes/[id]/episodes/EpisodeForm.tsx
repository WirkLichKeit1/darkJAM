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

/**
 * Faz upload do vídeo para /api/upload/video/[animeId]/[episodeId]
 * (Route Handler do Next.js no Vercel), que por sua vez faz o proxy
 * para o Cloudinary com a assinatura do backend.
 *
 * Isso elimina o problema de CORS: o browser só fala com o próprio
 * domínio Vercel, e o Vercel faz o upload para o Cloudinary server-side.
 *
 * O XMLHttpRequest é usado (em vez de fetch) porque expõe
 * upload.onprogress para a barra de progresso real.
 */
async function uploadVideoViaProxy(
  file: File,
  animeId: number,
  episodeId: number,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    const url = `/api/upload/video/${animeId}/${episodeId}`;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // A barra vai até 90% durante o upload do browser → Vercel.
        // Os últimos 10% cobrem o trecho Vercel → Cloudinary (não visível ao browser).
        const percent = Math.round((event.loaded / event.total) * 90);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        let msg = `Erro no upload: status ${xhr.status}`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.message) msg = data.message;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error("Erro de rede durante o upload."));
    xhr.ontimeout = () => reject(new Error("Timeout: o upload demorou muito."));
    xhr.timeout = 30 * 60 * 1000; // 30 minutos

    xhr.open("POST", url);
    // Não define Content-Type — o browser define automaticamente com o boundary correto
    xhr.send(formData);
  });
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

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
        setUploadPhase("uploading");
        setUploadProgress(0);

        // Upload via Route Handler (sem CORS, com progresso real)
        await uploadVideoViaProxy(
          videoFile,
          animeId,
          episode.id,
          (percent) => setUploadProgress(percent)
        );

        setUploadPhase("done");
        setUploadProgress(100);

        setTimeout(() => {
          router.push(`/admin/animes/${animeId}/edit`);
        }, 1200);
      } else {
        router.push(`/admin/animes/${animeId}/edit`);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err as Error)?.message ??
        "Erro ao salvar episódio.";
      setError(msg);
      setLoading(false);
      setUploadPhase("error");
    }
  };

  const isUploading = uploadPhase === "uploading";
  const isSubmitting = loading || isUploading || uploadPhase === "done";

  const progressLabel =
    uploadPhase === "uploading"
      ? uploadProgress < 90
        ? `Enviando... ${uploadProgress}%`
        : "Processando no Cloudinary..."
      : uploadPhase === "done"
      ? "Concluído!"
      : "";

  const progressColor = uploadPhase === "done" ? "#4ade80" : "var(--accent)";

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

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "700px" }}
    >
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
        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
          Publicado (visível para usuários)
        </span>
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
        {videoFile && uploadPhase === "idle" && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
            {(videoFile.size / 1_048_576).toFixed(1)} MB selecionado
          </p>
        )}
        {initial?.videoStatus === "READY" && !videoFile && uploadPhase === "idle" && (
          <p style={{ fontSize: "0.75rem", color: "#4ade80", marginTop: "0.35rem" }}>
            ✓ Vídeo já enviado e pronto
          </p>
        )}
        {initial?.videoStatus === "PROCESSING" && !videoFile && uploadPhase === "idle" && (
          <p style={{ fontSize: "0.75rem", color: "#fb923c", marginTop: "0.35rem" }}>
            ⏳ Vídeo em processamento — aguarde ou envie outro para substituir
          </p>
        )}

        {/* Barra de progresso */}
        {(isUploading || uploadPhase === "done") && (
          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {progressLabel}
              </span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: progressColor }}>
                {uploadProgress}%
              </span>
            </div>
            <div style={{ width: "100%", height: "6px", backgroundColor: "var(--border)", borderRadius: "6px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${uploadProgress}%`,
                backgroundColor: progressColor,
                borderRadius: "6px",
                transition: "width 0.5s ease, background-color 0.3s ease",
              }} />
            </div>
            {isUploading && uploadProgress >= 90 && (
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                Arquivo enviado — aguardando processamento no Cloudinary...
              </p>
            )}
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
        <p style={{
          fontSize: "0.85rem",
          color: "#f87171",
          backgroundColor: "#ef444415",
          border: "1px solid #ef444430",
          borderRadius: "8px",
          padding: "0.75rem 1rem",
          lineHeight: 1.6,
        }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {isUploading ? "Enviando vídeo..."
            : uploadPhase === "done" ? "Concluído!"
            : loading ? "Salvando..."
            : isEditing ? "Salvar alterações"
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