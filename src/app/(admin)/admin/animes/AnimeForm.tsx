"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { animeApi } from "@/lib/api";
import { AnimeResponse, AnimeRequest, AnimeStatus } from "@/types/api";
import { Button, Input } from "@/components/ui";

interface AnimeFormProps {
  initial?: AnimeResponse;
}

const statusOptions: { value: AnimeStatus; label: string }[] = [
  { value: "ONGOING", label: "Em andamento" },
  { value: "COMPLETED", label: "Completo" },
  { value: "UPCOMING", label: "Em breve" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function AnimeForm({ initial }: AnimeFormProps) {
  const router = useRouter();
  const isEditing = !!initial;

  const [form, setForm] = useState<AnimeRequest>({
    title: initial?.title ?? "",
    originalTitle: initial?.originalTitle ?? "",
    synopsis: initial?.synopsis ?? "",
    genre: initial?.genre ?? "",
    studio: initial?.studio ?? "",
    releaseYear: initial?.releaseYear ?? undefined,
    status: initial?.status ?? "ONGOING",
    rating: initial?.rating ?? undefined,
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof AnimeRequest, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let anime: AnimeResponse;
      if (isEditing) {
        anime = await animeApi.update(initial!.id, form);
      } else {
        anime = await animeApi.create(form);
      }

      if (coverFile) await animeApi.uploadCover(anime.id, coverFile);
      if (bannerFile) await animeApi.uploadBanner(anime.id, bannerFile);

      router.push("/admin/animes");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Erro ao salvar anime.");
    } finally {
      setLoading(false);
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

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "700px" }}>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Input label="Título *" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        <Input label="Título original" value={form.originalTitle ?? ""} onChange={(e) => set("originalTitle", e.target.value)} />
      </div>

      <div>
        <label style={labelStyle}>Sinopse</label>
        <textarea
          value={form.synopsis ?? ""}
          onChange={(e) => set("synopsis", e.target.value)}
          rows={4}
          style={{ ...selectStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Input label="Gênero" value={form.genre ?? ""} onChange={(e) => set("genre", e.target.value)} />
        <Input label="Estúdio" value={form.studio ?? ""} onChange={(e) => set("studio", e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <Input
          label="Ano de lançamento"
          type="number"
          min={1900} max={2100}
          value={form.releaseYear ?? ""}
          onChange={(e) => set("releaseYear", e.target.value ? Number(e.target.value) : undefined)}
        />
        <div>
          <label style={labelStyle}>Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value as AnimeStatus)} style={selectStyle}>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <Input
          label="Nota (0–10)"
          type="number"
          min={0} max={10} step={0.1}
          value={form.rating ?? ""}
          onChange={(e) => set("rating", e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>

      {/* Upload de imagens */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Imagem de capa</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            style={{ ...selectStyle, cursor: "pointer" }}
          />
          {initial?.coverImageUrl && !coverFile && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
              ✓ Imagem atual mantida
            </p>
          )}
        </div>
        <div>
          <label style={labelStyle}>Banner</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
            style={{ ...selectStyle, cursor: "pointer" }}
          />
          {initial?.bannerImageUrl && !bannerFile && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
              ✓ Banner atual mantido
            </p>
          )}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: "0.85rem", color: "#f87171", backgroundColor: "#ef444415", border: "1px solid #ef444430", borderRadius: "8px", padding: "0.75rem 1rem" }}>
          {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
        <Button type="submit" loading={loading}>
          {isEditing ? "Salvar alterações" : "Criar anime"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/animes")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}