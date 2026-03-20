"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { animeApi } from "@/lib/api";
import { AnimeResponse, PageResponse } from "@/types/api";
import { Skeleton } from "@/components/ui";
import AnimeCard from "@/components/anime/AnimeCard";
import AnimeFilters from "@/components/anime/AnimeFilters";

function AnimeListContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PageResponse<AnimeResponse> | null>(null);
  const [loading, setLoading] = useState(true);

  const page = Number(searchParams.get("page") ?? 0);
  const title = searchParams.get("title") ?? undefined;
  const genre = searchParams.get("genre") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  useEffect(() => {
    setLoading(true);
    animeApi
      .search({ title, genre, status, page, size: 24 })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [title, genre, status, page]);

  return (
    <div>
      {/* Filtros */}
      <div style={{ marginBottom: "2rem" }}>
        <AnimeFilters />
      </div>

      {/* Resultados */}
      {!loading && data?.totalElements === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 0",
            color: "var(--text-secondary)",
          }}
        >
          <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎌</p>
          <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
            Nenhum anime encontrado
          </p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Tente outros filtros
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "1rem",
          }}
        >
          {loading
            ? Array.from({ length: 24 }).map((_, i) => (
                <div key={i}>
                  <Skeleton height="240px" borderRadius="10px" />
                  <Skeleton
                    width="80%"
                    height="0.9rem"
                    style={{ marginTop: "0.5rem" }}
                  />
                  <Skeleton
                    width="50%"
                    height="0.75rem"
                    style={{ marginTop: "0.35rem" }}
                  />
                </div>
              ))
            : data?.content.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
        </div>
      )}

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "3rem",
            flexWrap: "wrap",
          }}
        >
          <PaginationLink
            page={page - 1}
            disabled={page === 0}
            label="← Anterior"
            searchParams={searchParams}
          />

          {Array.from({ length: data.totalPages }, (_, i) => i)
            .filter(
              (i) =>
                i === 0 ||
                i === data.totalPages - 1 ||
                Math.abs(i - page) <= 2
            )
            .map((i, idx, arr) => (
              <span key={i}>
                {idx > 0 && arr[idx - 1] !== i - 1 && (
                  <span
                    style={{ color: "var(--text-muted)", padding: "0 0.25rem" }}
                  >
                    …
                  </span>
                )}
                <PaginationLink
                  page={i}
                  current={i === page}
                  label={String(i + 1)}
                  searchParams={searchParams}
                />
              </span>
            ))}

          <PaginationLink
            page={page + 1}
            disabled={data.last}
            label="Próxima →"
            searchParams={searchParams}
          />
        </div>
      )}

      {/* Total */}
      {data && (
        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
          }}
        >
          {data.totalElements} anime
          {data.totalElements !== 1 ? "s" : ""} encontrado
          {data.totalElements !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

/**
 * *** CORRIGIDO: substituído <a href> por <Link> do Next.js ***
 *
 * <a href> forçava um full page reload ao paginar, perdendo o bundle
 * carregado e todos os estados da página.
 * <Link> faz navegação client-side suave, mantendo o bundle em memória.
 */
function PaginationLink({
  page,
  disabled,
  current,
  label,
  searchParams,
}: {
  page: number;
  disabled?: boolean;
  current?: boolean;
  label: string;
  searchParams: URLSearchParams;
}) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page));
  const href = `/animes?${params.toString()}`;

  const style: React.CSSProperties = {
    padding: "0.4rem 0.75rem",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: current ? 700 : 500,
    backgroundColor: current ? "var(--accent)" : "var(--surface-alt)",
    color: current
      ? "var(--background)"
      : disabled
        ? "var(--text-muted)"
        : "var(--text-primary)",
    border: "1px solid var(--border)",
    pointerEvents: disabled ? "none" : "auto",
    textDecoration: "none",
    display: "inline-block",
    opacity: disabled ? 0.5 : 1,
  };

  if (disabled) {
    return <span style={style}>{label}</span>;
  }

  return (
    <Link href={href} style={style}>
      {label}
    </Link>
  );
}

export default function AnimesPage() {
  return (
    <div
      style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}
    >
      <h1
        style={{
          fontSize: "1.75rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: "1.5rem",
        }}
      >
        Animes
      </h1>
      <Suspense
        fallback={
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "1rem",
            }}
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i}>
                <Skeleton height="240px" borderRadius="10px" />
                <Skeleton
                  width="80%"
                  height="0.9rem"
                  style={{ marginTop: "0.5rem" }}
                />
              </div>
            ))}
          </div>
        }
      >
        <AnimeListContent />
      </Suspense>
    </div>
  );
}