import type { TimelineItem } from "@/store/player";
import { useCallback } from "react";

type Params = {
  timeline: TimelineItem[];
  activeIndex: number;
  currentMs: number | null;
  stepToIndex: (i: number) => void;
  seekTo: (ms: number) => void;
  rewindToPhraseStart: (ms: number) => void;
  play: () => void;
  setKnownWidthForIndex: (index: number) => void;
  resetHighlight: () => void;
  restartHighlightFromStart: (durationMs: number) => void;
};

export function useTransportControls({
  timeline,
  activeIndex,
  currentMs,
  stepToIndex,
  seekTo,
  rewindToPhraseStart,
  play,
  setKnownWidthForIndex,
  resetHighlight,
  restartHighlightFromStart,
}: Params) {
  const onPressRewind = useCallback(() => {
    if (!timeline.length) return;
    const curr = timeline[activeIndex];
    if (!curr) return;

    const thresholdMs = 300;
    const phraseDuration = Math.max(1, curr.end - curr.start);

    if ((currentMs ?? 0) > curr.start + thresholdMs) {
      rewindToPhraseStart(curr.start);
      restartHighlightFromStart(phraseDuration);
      play();
    } else {
      const prevIndex = Math.max(0, activeIndex - 1);
      const prev = timeline[prevIndex];
      if (prev) {
        stepToIndex(prev.globalIndex);
        seekTo(prev.start);
        setKnownWidthForIndex(prevIndex);
        resetHighlight();
        play();
      }
    }
  }, [
    timeline,
    activeIndex,
    currentMs,
    stepToIndex,
    seekTo,
    rewindToPhraseStart,
    play,
    setKnownWidthForIndex,
    resetHighlight,
    restartHighlightFromStart,
  ]);

  const onPressForward = useCallback(() => {
    if (!timeline.length) return;
    const next = timeline[Math.min(timeline.length - 1, activeIndex + 1)];
    if (next) {
      stepToIndex(next.globalIndex);
      seekTo(next.start);
    }
  }, [timeline, activeIndex, stepToIndex, seekTo]);

  return { onPressRewind, onPressForward };
}
