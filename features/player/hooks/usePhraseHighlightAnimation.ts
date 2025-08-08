import type { TimelineItem } from "@/store/player";
import { useEffect, useRef } from "react";
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Params = {
  timeline: TimelineItem[];
  activeIndex: number;
  isPlaying: boolean;
  currentMs: number | null;
};

export function usePhraseHighlightAnimation({
  timeline,
  activeIndex,
  isPlaying,
  currentMs,
}: Params) {
  const measuredWidthByIndexRef = useRef<Record<number, number>>({});
  const measuredWidthSV = useSharedValue(0);
  const progressSV = useSharedValue(0);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    width: measuredWidthSV.value * progressSV.value,
  }));

  const handleMeasureWidth = (
    index: number,
    width: number,
    isActive: boolean
  ) => {
    const stored = measuredWidthByIndexRef.current[index];
    if (Math.abs((stored ?? 0) - width) > 0.5) {
      measuredWidthByIndexRef.current[index] = width;
      if (isActive) measuredWidthSV.value = width;
    } else if (isActive && stored == null) {
      measuredWidthSV.value = width;
    }
  };

  const resetHighlight = () => {
    cancelAnimation(progressSV);
    progressSV.value = 0;
  };

  const setKnownWidthForIndex = (index: number) => {
    const known = measuredWidthByIndexRef.current[index];
    measuredWidthSV.value = known ?? 0;
  };

  const restartFromStart = (durationMs: number) => {
    cancelAnimation(progressSV);
    progressSV.value = 0;
    progressSV.value = withTiming(1, {
      duration: Math.max(1, durationMs),
      easing: Easing.linear,
    });
  };

  useEffect(() => {
    const curr = timeline[activeIndex];
    if (!curr) {
      cancelAnimation(progressSV);
      progressSV.value = 0;
      measuredWidthSV.value = 0;
      return;
    }
    if (!isPlaying) {
      cancelAnimation(progressSV);
      progressSV.value = 0;
      return;
    }

    const phraseDuration = Math.max(1, curr.end - curr.start);
    const knownWidth = measuredWidthByIndexRef.current[activeIndex];
    if (knownWidth != null) measuredWidthSV.value = knownWidth;

    const elapsed = Math.max(
      0,
      Math.min(phraseDuration, (currentMs ?? 0) - curr.start)
    );
    const startProgress = elapsed / phraseDuration;
    const remaining = Math.max(0, phraseDuration - elapsed);

    cancelAnimation(progressSV);
    progressSV.value = startProgress;
    progressSV.value = withTiming(1, {
      duration: remaining,
      easing: Easing.linear,
    });
  }, [activeIndex, isPlaying, timeline]);

  return {
    animatedOverlayStyle,
    handleMeasureWidth,
    resetHighlight,
    setKnownWidthForIndex,
    restartFromStart,
  };
}
