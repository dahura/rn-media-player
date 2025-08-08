import { usePlayerStore } from "@/store/player";
import { Asset } from "expo-asset";
import { useCallback, useEffect, useRef } from "react";

// Web-specific implementation using HTMLAudioElement
// Keeps the same public API as the native hook so the UI code stays unchanged
export function useAudioController(source: any) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { setPlaying, setPosition, rate, setRate, markLoaded } =
    usePlayerStore();

  // Resolve asset URL for web using expo-asset
  const resolveSourceUrl = async (src: any): Promise<string | undefined> => {
    if (!src) return undefined;
    try {
      const asset = await Asset.fromModule(src).downloadAsync();
      return asset.localUri ?? asset.uri;
    } catch {
      if (typeof src === "string") return src;
      return undefined;
    }
  };

  // Initialize audio element and attach event listeners
  useEffect(() => {
    let disposed = false;
    let audio: HTMLAudioElement | null = null;

    (async () => {
      const url = await resolveSourceUrl(source);
      if (disposed) return;
      audio = new Audio(url);

      // Hint browsers to preserve pitch when changing playbackRate
      // These vendor props are safe no-ops where unsupported
      (audio as any).preservesPitch = true;
      (audio as any).mozPreservesPitch = true;
      (audio as any).webkitPreservesPitch = true;

      audio.preload = "auto";
      audio.crossOrigin = "anonymous";

      const handleLoaded = () => markLoaded(true);
      const handlePlay = () => setPlaying(true);
      const handlePause = () => setPlaying(false);
      const handleTimeUpdate = () =>
        setPosition(Math.max(0, Math.floor(audio!.currentTime * 1000)));

      audio.addEventListener("loadedmetadata", handleLoaded);
      audio.addEventListener("canplaythrough", handleLoaded);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("timeupdate", handleTimeUpdate);

      audioRef.current = audio;
    })();

    return () => {
      disposed = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      audioRef.current = null;
    };
  }, [source, markLoaded, setPlaying, setPosition]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    // Apply current rate when playing
    if (rate !== undefined) audio.playbackRate = rate;
    try {
      await audio.play();
    } catch {
      // Autoplay restrictions; ignore here (user gesture should trigger play)
    }
  }, [rate]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  const seekTo = useCallback(async (ms: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = ms / 1000;
  }, []);

  const rewindToPhraseStart = useCallback(
    async (startMs: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.playbackRate = 1;
      setRate(1);
      audio.currentTime = startMs / 1000;
    },
    [setRate]
  );

  const repeatLastPhrase = useCallback(
    async (startMs: number, endMs: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Ensure no stale timer is running
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      audio.playbackRate = 0.75;
      setRate(0.75);
      audio.currentTime = startMs / 1000;

      try {
        await audio.play();
      } catch {
        // Ignore play errors caused by autoplay policy
      }

      intervalRef.current = setInterval(() => {
        if (audio.currentTime * 1000 >= endMs) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          audio.pause();
          audio.playbackRate = 1;
          setRate(1);
        }
      }, 50);
    },
    [setRate]
  );

  return { play, pause, seekTo, rewindToPhraseStart, repeatLastPhrase };
}
