import { useEffect } from "react";
import { LayoutChangeEvent } from "react-native";
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Params = {
  isPlaying: boolean;
  currentMs: number | null;
  totalMs: number;
};

export function useTransportProgressBar({
  isPlaying,
  currentMs,
  totalMs,
}: Params) {
  const trackWidthSV = useSharedValue(0);
  const playbackProgressSV = useSharedValue(0);

  const animatedProgressBarStyle = useAnimatedStyle(() => ({
    width: trackWidthSV.value * playbackProgressSV.value,
  }));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidthSV.value = e.nativeEvent.layout.width;
  };

  const resetGlobalProgress = () => {
    cancelAnimation(playbackProgressSV);
    playbackProgressSV.value = 0;
  };

  const restartGlobalFrom = (nowMs: number, total: number) => {
    const current = total > 0 ? Math.max(0, Math.min(1, nowMs / total)) : 0;
    const remainingMs = Math.max(0, total - nowMs);
    cancelAnimation(playbackProgressSV);
    playbackProgressSV.value = current;
    playbackProgressSV.value = withTiming(1, {
      duration: Math.max(1, remainingMs),
      easing: Easing.linear,
    });
  };

  useEffect(() => {
    if (!isPlaying) {
      const current =
        totalMs > 0 ? Math.max(0, Math.min(1, (currentMs ?? 0) / totalMs)) : 0;
      cancelAnimation(playbackProgressSV);
      playbackProgressSV.value = current;
    }
  }, [isPlaying, currentMs, totalMs]);

  useEffect(() => {
    if (!isPlaying) return;
    const now = currentMs ?? 0;
    restartGlobalFrom(now, totalMs);
  }, [isPlaying, totalMs]);

  return {
    animatedProgressBarStyle,
    onTrackLayout,
    resetGlobalProgress,
    restartGlobalFrom,
  };
}
