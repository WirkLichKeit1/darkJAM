"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWatchProgress } from "@/lib/hooks/useWatchProgress";
import { getToken } from "@/lib/auth";

interface VideoPlayerProps {
  episodeId: number;
  title: string;
  duration: number;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function VideoPlayer({ episodeId, title, duration, onNext, onPrev }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const { onTimeUpdate, onEnded } = useWatchProgress({ episodeId, duration });

  // ─── Carrega o vídeo autenticado via fetch → Blob URL ──────────────────────
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadVideo = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/videos/stream/${episodeId}`,
          { headers }
        );

        if (!response.ok) throw new Error("Erro ao carregar vídeo");

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        setError("Não foi possível carregar o vídeo. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    loadVideo();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [episodeId]);

  // ─── Controles ────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = Number(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = Number(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
  }, [duration]);

  // ─── Auto-hide controls ───────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (playing) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      switch (e.key) {
        case " ": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": skip(10); break;
        case "ArrowLeft": skip(-10); break;
        case "f": toggleFullscreen(); break;
        case "m": toggleMute(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay, skip, toggleFullscreen, toggleMute]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        backgroundColor: "#000",
        borderRadius: fullscreen ? "0" : "12px",
        overflow: "hidden",
        cursor: showControls ? "default" : "none",
        userSelect: "none",
      }}
    >
      {/* Vídeo */}
      {blobUrl && (
        <video
          ref={videoRef}
          src={blobUrl}
          style={{ width: "100%", height: "100%", display: "block" }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            setCurrentTime(t);
            onTimeUpdate(t);
            const buf = e.currentTarget.buffered;
            if (buf.length > 0) setBuffered(buf.end(buf.length - 1));
          }}
          onEnded={() => { setPlaying(false); onEnded(); }}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          volume={volume}
          muted={muted}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
        }}>
          <div style={{
            width: "48px", height: "48px",
            border: "3px solid rgba(255,255,255,0.2)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {/* Erro */}
      {error && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.8)",
          gap: "1rem",
        }}>
          <span style={{ fontSize: "2rem" }}>⚠️</span>
          <p style={{ color: "#f87171", fontSize: "0.95rem" }}>{error}</p>
          <button
            onClick={(e) => { e.stopPropagation(); window.location.reload(); }}
            style={{
              padding: "0.5rem 1.25rem", borderRadius: "8px",
              backgroundColor: "var(--accent)", color: "var(--background)",
              border: "none", cursor: "pointer", fontWeight: 600,
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Play/Pause center icon */}
      {!loading && !error && showControls && !playing && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem",
          }}>
            ▶
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
          padding: "2rem 1rem 0.75rem",
          transition: "opacity 0.3s ease",
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? "auto" : "none",
        }}
      >
        {/* Título */}
        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.75rem", fontWeight: 500 }}>
          {title}
        </p>

        {/* Progress bar */}
        <div style={{ position: "relative", marginBottom: "0.5rem" }}>
          {/* Buffer */}
          <div style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            left: 0, height: "3px", borderRadius: "3px",
            width: `${duration > 0 ? (buffered / duration) * 100 : 0}%`,
            backgroundColor: "rgba(255,255,255,0.2)",
            pointerEvents: "none",
          }} />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: "100%", height: "3px",
              appearance: "none", background: `linear-gradient(to right, var(--accent) ${progress}%, rgba(255,255,255,0.15) ${progress}%)`,
              borderRadius: "3px", cursor: "pointer", position: "relative",
            }}
          />
        </div>

        {/* Botões */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Prev */}
          {onPrev && (
            <button onClick={onPrev} style={btnStyle}>⏮</button>
          )}

          {/* Play/Pause */}
          <button onClick={togglePlay} style={{ ...btnStyle, fontSize: "1.1rem" }}>
            {playing ? "⏸" : "▶"}
          </button>

          {/* Next */}
          {onNext && (
            <button onClick={onNext} style={btnStyle}>⏭</button>
          )}

          {/* Skip */}
          <button onClick={() => skip(-10)} style={btnStyle} title="-10s">«10</button>
          <button onClick={() => skip(10)} style={btnStyle} title="+10s">10»</button>

          {/* Volume */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <button onClick={toggleMute} style={btnStyle}>
              {muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              style={{
                width: "70px", height: "3px", appearance: "none",
                background: `linear-gradient(to right, white ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(muted ? 0 : volume) * 100}%)`,
                borderRadius: "3px", cursor: "pointer",
              }}
            />
          </div>

          {/* Tempo */}
          <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginLeft: "auto" }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} style={btnStyle}>
            {fullscreen ? "⊡" : "⛶"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "rgba(255,255,255,0.85)",
  fontSize: "0.95rem",
  padding: "0.25rem",
  transition: "color 0.2s",
  display: "flex",
  alignItems: "center",
};