"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { animeApi } from "@/lib/api";
import { AnimeResponse } from "@/types/api";
import { Skeleton, Badge } from "@/components/ui";
import AnimeCard from "@/components/anime/AnimeCard";

export default function HomePage() {
  const [featured, setFeatured] = useState<AnimeResponse | null>(null);
  const [recent, setRecent] = useState<AnimeResponse[]>([]);
  const [ongoing, setOngoing] = useState<AnimeResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentRes, ongoingRes] = await Promise.all([
          animeApi.getAll(0, 10),
          animeApi.search({ status: "ONGOING", size: 6 }),
        ]);
        setRecent(recentRes.content);
        setOngoing(ongoingRes.content);
        if (recentRes.content.length > 0) setFeatured(recentRes.content[0]);
      } catch {
        // silencioso
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{ position: "relative", height: "clamp(400px, 60vh, 600px)", overflow: "hidden" }}>
        {loading ? (
          <Skeleton height="100%" borderRadius="0" />
        ) : featured?.bannerImageUrl ? (
          <Image
            src={featured.bannerImageUrl}
            alt={featured.title}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #1a1a24 0%, #0a0a0f 100%)",
          }} />
        )}

        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(10,10,15,0.95) 40%, rgba(10,10,15,0.3) 100%)",
        }} />

        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center",
          padding: "0 clamp(1.5rem, 5vw, 5rem)",
          maxWidth: "1280px",
          margin: "0 auto",
          left: 0, right: 0,
        }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>
              <Skeleton width="120px" height="1.5rem" />
              <Skeleton width="80%" height="3rem" />
              <Skeleton width="60%" height="1rem" />
              <Skeleton width="140px" height="2.5rem" borderRadius="8px" />
            </div>
          ) : featured ? (
            <div style={{ maxWidth: "500px" }}>
              <Badge variant="accent">Em destaque</Badge>
              <h1 style={{
                fontSize: "clamp(1.75rem, 4vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginTop: "0.75rem",
                marginBottom: "1rem",
              }}>
                {featured.title}
              </h1>
              {featured.synopsis && (
                <p style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {featured.synopsis}
                </p>
              )}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link
                  href={`/animes/${featured.id}`}
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--background)",
                    padding: "0.7rem 1.75rem",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  Ver anime
                </Link>
                <Link
                  href="/animes"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "var(--text-primary)",
                    padding: "0.7rem 1.75rem",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  Ver todos
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: "500px" }}>
              <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                dark<span style={{ color: "var(--accent)" }}>JAM</span>
              </h1>
              <p style={{ color: "var(--text-secondary)", marginTop: "1rem", marginBottom: "1.5rem" }}>
                Sua plataforma de streaming de animes.
              </p>
              <Link
                href="/animes"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--background)",
                  padding: "0.7rem 1.75rem",
                  borderRadius: "8px",
                  fontWeight: 700,
                }}
              >
                Explorar animes
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Conteúdo */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        {(loading || ongoing.length > 0) && (
          <section style={{ marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Em andamento</h2>
              <Link href="/animes?status=ONGOING" style={{ fontSize: "0.85rem", color: "var(--accent)" }}>Ver mais →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton height="240px" borderRadius="10px" />
                      <Skeleton width="80%" height="0.9rem" style={{ marginTop: "0.5rem" }} />
                    </div>
                  ))
                : ongoing.map((anime) => <AnimeCard key={anime.id} anime={anime} />)
              }
            </div>
          </section>
        )}

        {(loading || recent.length > 0) && (
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Todos os animes</h2>
              <Link href="/animes" style={{ fontSize: "0.85rem", color: "var(--accent)" }}>Ver todos →</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton height="240px" borderRadius="10px" />
                      <Skeleton width="80%" height="0.9rem" style={{ marginTop: "0.5rem" }} />
                    </div>
                  ))
                : recent.map((anime) => <AnimeCard key={anime.id} anime={anime} />)
              }
            </div>
          </section>
        )}
      </div>
    </div>
  );
}