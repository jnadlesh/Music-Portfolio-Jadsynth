import { useEffect, useState } from "react";

const cache = new Map<string, string>();

function format(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useTrackDuration(src: string, fallback: string): string {
  const [duration, setDuration] = useState<string>(
    () => cache.get(src) ?? fallback,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = cache.get(src);
    if (cached) {
      setDuration(cached);
      return;
    }

    const audio = new Audio();
    audio.preload = "metadata";

    const onLoaded = () => {
      const formatted = format(audio.duration);
      cache.set(src, formatted);
      setDuration(formatted);
    };
    const onError = () => {
      /* leave fallback */
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
    audio.src = src;

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      audio.src = "";
    };
  }, [src]);

  return duration;
}
