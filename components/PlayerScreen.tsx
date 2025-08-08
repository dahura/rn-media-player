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
  cancelAnimation,
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
    isFinished,
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
      cancelAnimation(progressSV);
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
        cancelAnimation(progressSV);
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
  // const progress = Math.max(0, Math.min(1, (currentMs ?? 0) / totalMs));

  // ====== Глобальный прогресс плеера: плавная линейная анимация ======
  const trackWidthSV = useSharedValue(0);
  const playbackProgressSV = useSharedValue(0);

  const animatedProgressBarStyle = useAnimatedStyle(() => {
    return {
      width: trackWidthSV.value * playbackProgressSV.value,
    };
  });

  // Обновляем прогресс при паузе/перемотке без анимации
  useEffect(() => {
    if (!isPlaying) {
      const current =
        totalMs > 0 ? Math.max(0, Math.min(1, (currentMs ?? 0) / totalMs)) : 0;
      cancelAnimation(playbackProgressSV);
      playbackProgressSV.value = current;
    }
  }, [isPlaying, currentMs, totalMs, playbackProgressSV]);

  // Перезапускаем анимацию при старте воспроизведения
  useEffect(() => {
    if (!isPlaying) return;
    const current =
      totalMs > 0 ? Math.max(0, Math.min(1, (currentMs ?? 0) / totalMs)) : 0;
    const remainingMs = Math.max(0, totalMs - (currentMs ?? 0));

    // Устанавливаем текущую точку и анимируем до конца линейно
    cancelAnimation(playbackProgressSV);
    playbackProgressSV.value = current;
    playbackProgressSV.value = withTiming(1, {
      duration: Math.max(1, remainingMs),
      easing: Easing.linear,
    });
  }, [isPlaying, totalMs, playbackProgressSV]);

  // Детектируем крупные скачки позиции (seek) во время воспроизведения и перезапускаем анимацию
  const prevMsRef = useRef<number>(0);
  useEffect(() => {
    const prev = prevMsRef.current;
    const now = currentMs ?? 0;
    prevMsRef.current = now;
    if (!isPlaying) return;
    if (Math.abs(now - prev) > 500) {
      const current = totalMs > 0 ? Math.max(0, Math.min(1, now / totalMs)) : 0;
      const remainingMs = Math.max(0, totalMs - now);
      cancelAnimation(playbackProgressSV);
      playbackProgressSV.value = current;
      playbackProgressSV.value = withTiming(1, {
        duration: Math.max(1, remainingMs),
        easing: Easing.linear,
      });
    }
  }, [currentMs, isPlaying, totalMs, playbackProgressSV]);

  useEffect(() => {}, [currentMs]);

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
      cancelAnimation(progressSV);
      progressSV.value = 0;
      measuredWidthSV.value = 0;
      return;
    }

    // Не анимируем и не подсвечиваем до старта плеера
    if (!isPlaying) {
      cancelAnimation(progressSV);
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

    cancelAnimation(progressSV);
    progressSV.value = startProgress;
    progressSV.value = withTiming(1, {
      duration: remaining,
      easing: Easing.linear,
    });
  }, [activeIndex, isPlaying, timeline]);

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
    if (isPlaying && !isFinished) {
      pause();
      return;
    }

    // If finished, reset to start before playing again
    if (isFinished) {
      stepToIndex(0);
      seekTo(0);
      cancelAnimation(playbackProgressSV);
      playbackProgressSV.value = 0;
      cancelAnimation(progressSV);
      progressSV.value = 0;
    }
    play();
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
      <View
        style={[styles.progressBarAbove]}
        onLayout={(e) => {
          trackWidthSV.value = e.nativeEvent.layout.width;
        }}
      >
        <Animated.View
          style={[
            styles.progressFill,
            styles.progressFillRounded,
            animatedProgressBarStyle,
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
            {isPlaying && !isFinished ? (
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
  },
  topFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 2,
  },
  bottomFade: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 2,
  },
  phraseContainer: {
    marginVertical: 8,
    gap: 6,
    width: "100%",
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    maxWidth: "80%",
  },
  leftBubble: {
    backgroundColor: "#F0F0F0",
    borderTopLeftRadius: 4,
  },
  rightBubble: {
    backgroundColor: "#F7F7F7",
    borderTopRightRadius: 4,
  },
  speaker: {
    fontWeight: "600",
    fontSize: 12,
    color: TEXT,
    opacity: 0.8,
  },
  leftSpeaker: {
    alignSelf: "flex-start",
    marginLeft: 6,
  },
  rightSpeaker: {
    alignSelf: "flex-end",
    marginRight: 6,
  },
  activeSpeaker: {
    color: ACCENT,
  },
  bubbleInner: {
    position: "relative",
  },
  progressTextWrapper: {
    position: "relative",
  },
  progressTextOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    overflow: "hidden",
  },
  accentText: {
    color: ACCENT,
  },
  words: {
    fontSize: 18,
    color: TEXT,
  },
  activeBubble: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  transport: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 44,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
  },
  progressBarAbove: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 120,
    height: 4,
    backgroundColor: "#EAEAEA",
  },
  progressFill: {
    height: "100%",
    backgroundColor: ACCENT,
  },
  progressFillRounded: {
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: TEXT,
  },
  transportTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  timeText: {
    fontSize: 12,
    color: TEXT,
    opacity: 0.8,
  },
});
