import { useEffect, useRef } from "react";

type Params = {
  isPlaying: boolean;
  currentMs: number | null;
  totalMs: number; // kept for API symmetry
  onLargeSeek: (now: number) => void;
  thresholdMs?: number;
};

export function useSeekSync({
  isPlaying,
  currentMs,
  onLargeSeek,
  thresholdMs = 500,
}: Params) {
  const prevMsRef = useRef<number>(0);

  useEffect(() => {
    const prev = prevMsRef.current;
    const now = currentMs ?? 0;
    prevMsRef.current = now;
    if (!isPlaying) return;
    if (Math.abs(now - prev) > thresholdMs) {
      onLargeSeek(now);
    }
  }, [currentMs, isPlaying, onLargeSeek, thresholdMs]);
}
