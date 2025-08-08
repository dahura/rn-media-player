import { useAudioController } from "@/hooks/useAudioController";
import { usePlayerStore } from "@/store/player";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import transcript from "@/assets/transcript.json";

const ACCENT = "#DBA604";
const TEXT = "#1B1B1B";

export default function PlayerScreen() {
  const {
    timeline,
    activeIndex,
    currentMs,
    stepToIndex,
    loadTimeline,
    isPlaying,
  } = usePlayerStore();
  const { play, pause, seekTo, rewindToPhraseStart, repeatLastPhrase } =
    useAudioController(require("@/assets/example_audio.mp3"));

  const firstSpeakerName = transcript.speakers?.[0]?.name ?? "";

  // Храним измеренную ширину текста для каждой фразы
  const measuredWidthByIndexRef = useRef<Record<number, number>>({});
  const measuredWidthSV = useSharedValue(0);

  // Прогресс от 0 до 1 для активной фразы
  const progressSV = useSharedValue(0);

  // Анимированный стиль подсветки
  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      width: measuredWidthSV.value * progressSV.value,
    };
  });

  // Построить таймлайн при загрузке
  useEffect(() => {
    loadTimeline(transcript.speakers, transcript.pause);
  }, [loadTimeline]);

  // Прокрутка к активной фразе
  const listRef = useRef<FlatList>(null);
  useEffect(() => {
    if (!timeline.length) return;
    const index = Math.min(Math.max(activeIndex, 0), timeline.length - 1);
    listRef.current?.scrollToIndex({
      index,
      viewPosition: 0.5,
      animated: true,
    });
  }, [activeIndex, timeline.length]);

  const onPressRewind = () => {
    if (!timeline.length) return;
    const curr = timeline[activeIndex];
    if (!curr) return;

    const thresholdMs = 300;
    const phraseDuration = Math.max(1, curr.end - curr.start);

    if ((currentMs ?? 0) > curr.start + thresholdMs) {
      // Restart current phrase from the beginning
      rewindToPhraseStart(curr.start);
      // Reset and restart text highlight immediately
      progressSV.value = 0;
      progressSV.value = withTiming(1, {
        duration: phraseDuration,
        easing: Easing.linear,
      });
      play();
    } else {
      // Jump to previous phrase start
      const prevIndex = Math.max(0, activeIndex - 1);
      const prev = timeline[prevIndex];
      if (prev) {
        stepToIndex(prev.globalIndex);
        seekTo(prev.start);
        // Reset highlight and set measured width if known for the prev phrase
        const knownPrevWidth = measuredWidthByIndexRef.current[prevIndex];
        measuredWidthSV.value = knownPrevWidth ?? 0;
        progressSV.value = 0;
        play();
      }
    }
  };

  const onPressForward = () => {
    if (!timeline.length) return;
    const next = timeline[Math.min(timeline.length - 1, activeIndex + 1)];
    if (next) {
      stepToIndex(next.globalIndex);
      seekTo(next.start);
    }
  };

  const totalMs = timeline.length ? timeline[timeline.length - 1].end : 1;
  const progress = Math.max(0, Math.min(1, (currentMs ?? 0) / totalMs));

  // Сохраняем ширину текста и сразу устанавливаем для активной фразы
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

  // При смене активной фразы или запуске воспроизведения стартуем синхронную анимацию
  useEffect(() => {
    const curr = timeline[activeIndex];
    if (!curr) {
      progressSV.value = 0;
      measuredWidthSV.value = 0;
      return;
    }

    // Не анимируем и не подсвечиваем до старта плеера
    if (!isPlaying) {
      progressSV.value = 0;
      return;
    }

    const phraseDuration = Math.max(1, curr.end - curr.start);
    const knownWidth = measuredWidthByIndexRef.current[activeIndex];
    if (knownWidth != null) {
      measuredWidthSV.value = knownWidth;
    }

    // Вычисляем текущий прогресс и оставшуюся длительность, чтобы не было рассинхрона
    const elapsed = Math.max(
      0,
      Math.min(phraseDuration, (currentMs ?? 0) - curr.start)
    );
    const startProgress = elapsed / phraseDuration;
    const remaining = Math.max(0, phraseDuration - elapsed);

    progressSV.value = startProgress;
    progressSV.value = withTiming(1, {
      duration: remaining,
      easing: Easing.linear,
    });
  }, [
    activeIndex,
    isPlaying,
    progressSV,
    measuredWidthSV,
    timeline,
    currentMs,
  ]);

  const renderItem = ({
    item,
    index,
  }: ListRenderItemInfo<(typeof timeline)[number]>) => {
    const isActive = index === activeIndex;
    const isInitiator = item.phrase.speaker === firstSpeakerName;

    return (
      <View
        style={[
          styles.phraseContainer,
          { alignItems: isInitiator ? "flex-start" : "flex-end" },
        ]}
      >
        <Text
          style={[
            styles.speaker,
            isActive && styles.activeSpeaker,
            isInitiator ? styles.leftSpeaker : styles.rightSpeaker,
          ]}
        >
          {item.phrase.speaker}
        </Text>
        <Pressable
          onPress={() => repeatLastPhrase(item.start, item.end)}
          accessibilityRole="button"
          accessibilityLabel="Repeat slowly"
          style={[
            styles.bubble,
            isInitiator ? styles.leftBubble : styles.rightBubble,
            isActive && styles.activeBubble,
          ]}
        >
          <View style={styles.bubbleInner}>
            <View
              style={styles.progressTextWrapper}
              onLayout={(e) =>
                handleMeasureWidth(index, e.nativeEvent.layout.width, isActive)
              }
            >
              <Text style={styles.words}>{item.phrase.words}</Text>
              {isActive && (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.progressTextOverlay, animatedOverlayStyle]}
                >
                  <Text style={[styles.words, styles.accentText]}>
                    {item.phrase.words}
                  </Text>
                </Animated.View>
              )}
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  const keyExtractor = (item: (typeof timeline)[number]) =>
    String(item.globalIndex);

  const onTogglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top fade */}
      <LinearGradient
        pointerEvents="none"
        colors={["#FFFFFF", "#FFFFFF00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topFade}
      />

      <FlatList
        ref={listRef}
        data={timeline}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 220 }}
        initialNumToRender={8}
      />

      {/* Bottom fade above transport */}
      <LinearGradient
        pointerEvents="none"
        colors={["#FFFFFF00", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bottomFade}
      />

      {/* Progress bar above transport (replaces border) */}
      <View style={[styles.progressBarAbove, { height: 12 }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, height: 12, borderRadius: 6 },
          ]}
        />
      </View>

      <View style={styles.transport}>
        <View style={styles.transportTopRow}>
          <Text style={styles.timeText}>
            {formatMs(timeline[activeIndex]?.start ?? 0)}
          </Text>
          <Text style={styles.timeText}>
            {formatMs(timeline[timeline.length - 1]?.end ?? 0)}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <IconButton
            name="play-back"
            onPress={onPressRewind}
            accessibilityLabel="Rewind"
          />

          <Pressable onPress={onTogglePlay} style={styles.playBtn} hitSlop={12}>
            {isPlaying ? (
              <Ionicons name="pause" size={32} color={TEXT} />
            ) : (
              <Ionicons name="play" size={32} color={TEXT} />
            )}
          </Pressable>

          <IconButton
            name="play-forward"
            onPress={onPressForward}
            accessibilityLabel="Forward"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function IconButton({
  name,
  onPress,
  accessibilityLabel,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={styles.iconBtn}
      hitSlop={10}
    >
      <Ionicons name={name} size={26} color={TEXT} />
    </Pressable>
  );
}

function formatMs(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(m)}:${pad(s)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
  },
  phraseContainer: { marginBottom: 16, width: "100%" },
  speaker: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#8A8A8A",
    fontSize: 13,
    letterSpacing: -0.13,
    fontFamily: "Outfit_600SemiBold",
  },
  leftSpeaker: { alignSelf: "flex-start", textAlign: "left" },
  rightSpeaker: { alignSelf: "flex-end", textAlign: "right" },
  activeSpeaker: { color: ACCENT },
  bubble: {
    maxWidth: 283,
    width: 283,
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F2EEF6",
    backgroundColor: "#FFF",
  },
  bubbleInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeBubble: {
    width: 283,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#E1E4FF",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  leftBubble: { alignSelf: "flex-start" },
  rightBubble: { alignSelf: "flex-end" },
  words: {
    color: TEXT,
    fontSize: 17,
    lineHeight: 17,
    letterSpacing: -0.17,
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "600",
    flex: 1,
    flexWrap: "wrap",
  },
  accentText: { color: ACCENT },
  progressTextWrapper: {
    flex: 1,
    position: "relative",
  },
  progressTextOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  // Gradient fades
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
    bottom: 88, // sit above transport area
    height: 64,
    zIndex: 5,
  },
  // Transport
  transport: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 18,
    backgroundColor: "#F6F6FF",
    gap: 12,
    zIndex: 10,
    elevation: 20,
  },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: "#E8E8FF",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: ACCENT,
  },
  progressBarAbove: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 118,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E8E8FF",
    overflow: "hidden",
    zIndex: 100,
  },
  transportTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingTop: 2,
  },
  iconBtn: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ECEEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#E8E9FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D9DAFF",
  },
  timeText: {
    width: 60,
    textAlign: "center",
    color: "#555",
    fontVariant: ["tabular-nums"],
  },
});
