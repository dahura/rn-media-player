import { usePlayerStore } from "@/store/player";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useCallback, useEffect } from "react";

export function useAudioController(source: number) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const { setPlaying, setPosition, rate, setRate, markLoaded } =
    usePlayerStore();

  useEffect(() => {
    // Включаем проигрывание в беззвучном режиме iOS
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Синхронизация статуса плеера с zustand
  useEffect(() => {
    if (!status) return;
    markLoaded(status.isLoaded);
    setPlaying(status.playing);
    setPosition(Math.max(0, Math.floor((status.currentTime ?? 0) * 1000)));
  }, [status, markLoaded, setPlaying, setPosition]);

  const play = useCallback(async () => {
    if (rate !== undefined) player.setPlaybackRate(rate);
    player.play();
  }, [player, rate]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const seekTo = useCallback(
    async (ms: number) => {
      await player.seekTo(ms / 1000);
    },
    [player]
  );

  const rewindToPhraseStart = useCallback(
    async (startMs: number) => {
      player.setPlaybackRate(1);
      setRate(1);
      await player.seekTo(startMs / 1000);
    },
    [player, setRate]
  );

  const repeatLastPhrase = useCallback(
    async (startMs: number, endMs: number) => {
      player.setPlaybackRate(0.75);
      setRate(0.75);
      await player.seekTo(startMs / 1000);
      player.play();
      const timer = setInterval(() => {
        const ct = player.currentStatus?.currentTime ?? 0;
        if (ct * 1000 >= endMs) {
          clearInterval(timer);
          player.pause();
          player.setPlaybackRate(1);
          setRate(1);
        }
      }, 50);
    },
    [player, setRate]
  );

  return { play, pause, seekTo, rewindToPhraseStart, repeatLastPhrase };
}
