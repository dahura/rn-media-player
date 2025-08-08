import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";

import transcript from "@/assets/transcript.json";
import { Colors } from "@/constants/Colors";
import { useAudioController } from "@/hooks/useAudioController";
import { usePlayerStore } from "@/store/player";

import { PlayerControls } from "../components/PlayerControls";
import { ProgressBarAbove } from "../components/ProgressBarAbove";
import { TimelineList } from "../components/TimelineList";
import { useAutoScrollToActive } from "../hooks/useAutoScrollToActive";
import { usePhraseHighlightAnimation } from "../hooks/usePhraseHighlightAnimation";
import { usePlayToggle } from "../hooks/usePlayToggle";
import { useSeekSync } from "../hooks/useSeekSync";
import { useTranscriptTimeline } from "../hooks/useTranscriptTimeline";
import { useTransportControls } from "../hooks/useTransportControls";
import { useTransportProgressBar } from "../hooks/useTransportProgressBar";

const ACCENT = Colors.tokens.accent;
const TEXT = Colors.tokens.text;

export const PlayerScreen = () => {
  const { activeIndex, currentMs, stepToIndex, isPlaying, isFinished } =
    usePlayerStore();
  const { play, pause, seekTo, rewindToPhraseStart, repeatLastPhrase } =
    useAudioController(require("@/assets/example_audio.mp3"));

  const { timeline, totalMs, firstSpeakerName } =
    useTranscriptTimeline(transcript);

  const highlight = usePhraseHighlightAnimation({
    timeline,
    activeIndex,
    isPlaying,
    currentMs,
  });

  const progressBar = useTransportProgressBar({
    isPlaying,
    currentMs,
    totalMs,
  });

  useSeekSync({
    isPlaying,
    currentMs,
    totalMs,
    onLargeSeek: (now) => progressBar.restartGlobalFrom(now, totalMs),
  });

  const { onPressRewind, onPressForward } = useTransportControls({
    timeline,
    activeIndex,
    currentMs,
    stepToIndex,
    seekTo,
    rewindToPhraseStart,
    play,
    setKnownWidthForIndex: highlight.setKnownWidthForIndex,
    resetHighlight: highlight.resetHighlight,
    restartHighlightFromStart: highlight.restartFromStart,
  });

  const { onTogglePlay } = usePlayToggle({
    isPlaying,
    isFinished,
    play,
    pause,
    stepToIndex,
    seekTo,
    resetAllAnimations: () => {
      progressBar.resetGlobalProgress();
      highlight.resetHighlight();
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        pointerEvents="none"
        colors={["#FFFFFF", "#FFFFFF00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topFade}
      />

      <TimelineList
        timeline={timeline}
        activeIndex={activeIndex}
        firstSpeakerName={firstSpeakerName}
        onRepeatPhrase={(start, end) => repeatLastPhrase(start, end)}
        onMeasure={highlight.handleMeasureWidth}
        animatedOverlayStyle={highlight.animatedOverlayStyle}
        onAutoScroll={(listRef) =>
          useAutoScrollToActive(listRef as any, activeIndex, timeline.length)
        }
      />

      <LinearGradient
        pointerEvents="none"
        colors={["#FFFFFF00", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bottomFade}
      />

      <ProgressBarAbove
        animatedStyle={progressBar.animatedProgressBarStyle}
        onLayout={progressBar.onTrackLayout}
      />

      <PlayerControls
        leftMs={timeline[activeIndex]?.start ?? 0}
        rightMs={timeline[timeline.length - 1]?.end ?? 0}
        isPlaying={isPlaying}
        isFinished={isFinished}
        onTogglePlay={onTogglePlay}
        onPressRewind={onPressRewind}
        onPressForward={onPressForward}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.tokens.background,
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    zIndex: 5,
  },
  bottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 88,
    height: 64,
    zIndex: 5,
  },
});
