import { useEffect, useRef, useCallback } from "react";
import { historyApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface UseWatchProgressOptions {
  episodeId: number;
  duration: number; // duração total em segundos
  intervalSeconds?: number; // salva a cada X segundos (padrão: 10)
}

interface UseWatchProgressReturn {
  onTimeUpdate: (currentTime: number) => void;
  onEnded: () => void;
}

export function useWatchProgress({
  episodeId,
  duration,
  intervalSeconds = 10,
}: UseWatchProgressOptions): UseWatchProgressReturn {
  const lastSavedRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);

  const saveProgress = useCallback(
    async (progressSeconds: number, completed: boolean) => {
      if (!isAuthenticated()) return;
      try {
        await historyApi.saveProgress({ episodeId, progressSeconds, completed });
        lastSavedRef.current = progressSeconds;
      } catch {
        // falha silenciosa — não interrompe a experiência do usuário
      }
    },
    [episodeId]
  );

  // Salva ao sair da página
  useEffect(() => {
    const handleUnload = () => {
      if (currentTimeRef.current > 0) {
        const completed = duration > 0 && currentTimeRef.current / duration >= 0.95;
        // sendBeacon para garantir envio mesmo no unload
        const data = JSON.stringify({
          episodeId,
          progressSeconds: Math.floor(currentTimeRef.current),
          completed,
        });
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL}/api/history`,
          new Blob([data], { type: "application/json" })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [episodeId, duration]);

  const onTimeUpdate = useCallback(
    (currentTime: number) => {
      currentTimeRef.current = currentTime;

      // Salva a cada N segundos
      if (currentTime - lastSavedRef.current >= intervalSeconds) {
        const completed = duration > 0 && currentTime / duration >= 0.95;
        saveProgress(Math.floor(currentTime), completed);
      }
    },
    [saveProgress, intervalSeconds, duration]
  );

  const onEnded = useCallback(() => {
    saveProgress(Math.floor(duration), true);
  }, [saveProgress, duration]);

  return { onTimeUpdate, onEnded };
}