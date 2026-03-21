"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { episodeApi } from "@/lib/api";
import { EpisodeResponse, EpisodeRequest } from "@/types/api";
import { Button, Input } from "@/components/ui";

interface EpisodeFormProps {
  animeId: number;
  initial?: EpisodeResponse;
}

// Tipos do Cloudinary Upload Widget
declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: unknown, result: CloudinaryWidgetResult) => void
      ) => CloudinaryWidget;
    };
  }
}

interface CloudinaryWidgetResult {
  event: string;
  info?: {
    public_id?: string;
    secure_url?: string;
    bytes?: number;
    duration?: number;
  };
}

interface CloudinaryWidget {
  open: () => void;
  close: () => void;
  destroy: () => void;
}

export default function EpisodeForm({ animeId, initial }: EpisodeFormProps) {
  const router = useRouter();
  const isEditing = !!initial;
  const widgetRef = useRef<CloudinaryWidget | null>(null);

  const [form, setForm] = useState<EpisodeRequest>({
    title: initial?.title ?? "",
    episodeNumber: initial?.episodeNumber ?? 1,
    seasonNumber: initial?.seasonNumber ?? 1,
    synopsis: initial?.synopsis ?? "",
    durationSeconds: initial?.durationSeconds ?? undefined,
    published: initial?.published ?? false,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<
    "idle" | "uploading" | "confirming" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Carrega o script do Cloudinary Upload Widget
  useEffect(() => {
    if (document.getElementById("cloudinary-widget-script")) return;
    const script = document.createElement("script");
    script.id = "cloudinary-widget-script";
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Destrói o widget ao desmontar o componente
  useEffect(() => {
    return () => {
      widgetRef.current?.destroy();
    };
  }, []);

  const set = (key: keyof EpisodeRequest, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /**
   * Abre o Cloudinary Upload Widget para o upload do vídeo.
   *
   * O widget usa um upload "unsigned" com um upload_preset configurado
   * no painel do Cloudinary. Isso é seguro para vídeos porque:
   * 1. O upload_preset pode restringir tipos de arquivo (video/*)
   * 2. O episódio só fica "READY" após o backend confirmar via video-confirm
   * 3. O public_id é salvo no banco apenas após a confirmação
   *
   * IMPORTANTE: você precisa criar um upload_preset no Cloudinary:
   * console.cloudinary.com → Settings → Upload → Upload presets → Add preset
   * - Signing mode: Unsigned
   * - Allowed formats: mp4,mkv,avi,webm
   * - Resource type: video
   * Copie o nome do preset e coloque em NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
   * e o cloud name em NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   */
  const openVideoWidget = (episodeId: number) => {
    if (!window.cloudinary) {
      setError("Cloudinary widget não carregou. Tente recarregar a página.");
      return;
    }

    // Destrói widget anterior se existir
    widgetRef.current?.destroy();

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setError(
        "Variáveis NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME e NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET " +
        "não estão configuradas. Adicione-as nas variáveis de ambiente do Vercel."
      );
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources: ["local"],
        resourceType: "video",
        clientAllowedFormats: ["mp4", "mkv", "avi", "webm"],
        maxFileSize: 3 * 1024 * 1024 * 1024, // 3 GB
        folder: `darkjam/videos`,
        publicId: `episode-${episodeId}-${Date.now()}`,
        showUploadMoreButton: false,
        singleUploadAutoClose: false,
        language: "pt",
        text: {
          pt: {
            queue: {
              title: "Fila de upload",
              title_uploading_with_counter: "Enviando {{num}} arquivo",
              title_uploading: "Enviando arquivo",
            },
            crop: { title: "Recortar" },
            local: {
              browse: "Selecionar arquivo",
              dd_title_single: "Arraste e solte o arquivo de vídeo aqui",
              drop_title_single: "Solte o arquivo para fazer o upload",
            },
          },
        },
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary widget error:", error);
          setError("Erro no upload. Tente novamente.");
          setUploadPhase("error");
          return;
        }

        if (result.event === "upload-added") {
          setUploadPhase("uploading");
        }

        if (result.event === "success" && result.info?.public_id) {
          setUploadedPublicId(result.info.public_id);
          widget.close();
          // Confirma com o backend
          confirmUpload(episodeId, result.info.public_id);
        }

        if (result.event === "close" && uploadPhase === "uploading") {
          // Usuário fechou sem terminar
          setUploadPhase("idle");
        }
      }
    );

    widgetRef.current = widget;
    widget.open();
  };

  const confirmUpload = async (episodeId: number, publicId: string) => {
    setUploadPhase("confirming");
    try {
      await episodeApi.confirmVideoUpload(animeId, episodeId, publicId);
      setUploadPhase("done");
    } catch {
      setError("Vídeo enviado mas falhou ao confirmar com o servidor. Tente novamente.");
      setUploadPhase("error");
    }
  };

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

      setLoading(false);

      if (!uploadedPublicId && !isEditing) {
        // Sem vídeo — abre o widget agora
        openVideoWidget(episode.id);
      } else if (uploadedPublicId) {
        // Vídeo já foi enviado via widget antes do submit
        await confirmUpload(episode.id, uploadedPublicId);
        setTimeout(() => router.push(`/admin/animes/${animeId}/edit`), 1200);
      } else {
        // Edição sem novo vídeo
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

  const isSubmitting = loading || uploadPhase === "uploading" || uploadPhase === "confirming" || uploadPhase === "done";

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

      {/* Status do vídeo */}
      <div>
        <label style={labelStyle}>
          Vídeo
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> (mp4, mkv, avi, webm)</span>
        </label>

        {uploadPhase === "idle" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {initial?.videoStatus === "READY" && (
              <p style={{ fontSize: "0.75rem", color: "#4ade80" }}>
                ✓ Vídeo já enviado e pronto — salve o formulário para substituir
              </p>
            )}
            {initial?.videoStatus === "PROCESSING" && (
              <p style={{ fontSize: "0.75rem", color: "#fb923c" }}>
                ⏳ Vídeo em processamento
              </p>
            )}
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {isEditing
                ? "O vídeo será solicitado após salvar as alterações."
                : "O widget de upload abrirá após criar o episódio."}
            </p>
          </div>
        )}

        {uploadPhase === "uploading" && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "var(--surface-alt)",
            border: "1px solid var(--border)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}>
            ⏳ Upload em andamento no widget do Cloudinary...
          </div>
        )}

        {uploadPhase === "confirming" && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "var(--surface-alt)",
            border: "1px solid var(--border)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}>
            ⏳ Confirmando com o servidor...
          </div>
        )}

        {uploadPhase === "done" && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "#16a34a15",
            border: "1px solid #4ade8030",
            fontSize: "0.85rem",
            color: "#4ade80",
          }}>
            ✓ Vídeo enviado com sucesso! Redirecionando...
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
          {uploadPhase === "uploading" ? "Aguardando upload..."
            : uploadPhase === "confirming" ? "Confirmando..."
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