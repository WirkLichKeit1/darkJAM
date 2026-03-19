"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { animeApi } from "@/lib/api";
import { AnimeStatus } from "@/types/api";

const statusOptions: { value: AnimeStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "ONGOING", label: "Em andamento" },
  { value: "COMPLETED", label: "Completo" },
  { value: "UPCOMING", label: "Em breve" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function AnimeFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [genres, setGenres] = useState<string[]>([]);
  const [search, setSearch] = useState(searchParams.get("title") ?? "");
  const [genre, setGenre] = useState(searchParams.get("genre") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");

  useEffect(() => {
    animeApi.getGenres().then(setGenres).catch(() => {});
  }, []);

  const applyFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("page");
    router.push(`/animes?${params.toString()}`);
  };

  const selectStyle = {
    backgroundColor: "var(--surface-alt)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "0.6rem 1rem",
    fontSize: "0.875rem",
    color: "var(--text-primary)",
    outline: "none",
    cursor: "pointer",
    minWidth: "150px",
  };

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "0.75rem",
      alignItems: "center",
    }}>
      {/* Busca */}
      <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
        <input
          type="text"
          placeholder="Buscar anime..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") applyFilters({ title: search }); }}
          style={{
            ...selectStyle,
            width: "100%",
            paddingLeft: "2.5rem",
          }}
        />
        <span style={{
          position: "absolute", left: "0.85rem", top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-muted)", fontSize: "0.9rem",
          pointerEvents: "none",
        }}>
          🔍
        </span>
      </div>

      {/* Gênero */}
      <select
        value={genre}
        onChange={(e) => { setGenre(e.target.value); applyFilters({ genre: e.target.value }); }}
        style={selectStyle}
      >
        <option value="">Todos os gêneros</option>
        {genres.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
        style={selectStyle}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Limpar filtros */}
      {(search || genre || status) && (
        <button
          onClick={() => {
            setSearch(""); setGenre(""); setStatus("");
            router.push("/animes");
          }}
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}