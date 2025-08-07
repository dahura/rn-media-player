import { useAudioController } from "@/hooks/useAudioController";
import { usePlayerStore } from "@/store/player";
import { Image } from "expo-image";
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

  // Build timeline once
  useEffect(() => {
    loadTimeline(transcript.speakers, transcript.pause);
  }, [loadTimeline]);

  // Scroll to active item
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
    const target = timeline[Math.max(0, activeIndex - 1)];
    if (target) rewindToPhraseStart(target.start);
  };

  const onPressForward = () => {
    if (!timeline.length) return;
    const next = timeline[Math.min(timeline.length - 1, activeIndex + 1)];
    if (next) {
      stepToIndex(next.globalIndex);
      seekTo(next.start);
    }
  };

  const onPressRepeat = () => {
    const t = timeline[activeIndex];
    if (t) repeatLastPhrase(t.start, t.end);
  };

  const totalMs = timeline.length ? timeline[timeline.length - 1].end : 1;
  const progress = Math.max(0, Math.min(1, (currentMs ?? 0) / totalMs));

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
        <View
          style={[
            styles.bubble,
            isInitiator ? styles.leftBubble : styles.rightBubble,
            isActive && styles.activeBubble,
          ]}
        >
          <Text style={[styles.words, isActive && styles.activeWords]}>
            {item.phrase.words}
          </Text>
        </View>
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
      <FlatList
        ref={listRef}
        data={timeline}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 220 }}
        initialNumToRender={8}
      />

      <View style={styles.transport}>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>

        <View style={styles.transportTopRow}>
          <Text style={styles.timeText}>
            {formatMs(timeline[activeIndex]?.start ?? 0)}
          </Text>
          <Text style={styles.timeText}>
            {formatMs(timeline[timeline.length - 1]?.end ?? 0)}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <IconImageButton
            source={require("@/assets/rewind.png")}
            onPress={onPressRewind}
            accessibilityLabel="Rewind"
          />

          <Pressable onPress={onTogglePlay} style={styles.playBtn}>
            <Image
              source={require("@/assets/play.png")}
              style={{ width: 28, height: 28 }}
              contentFit="contain"
            />
          </Pressable>

          <IconImageButton
            source={require("@/assets/fast-forward.png")}
            onPress={onPressForward}
            accessibilityLabel="Forward"
          />

          <Pressable onPress={onPressRepeat} style={styles.smallTextBtn}>
            <Text style={styles.smallTextBtnLabel}>0.75x</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function IconImageButton({
  source,
  onPress,
  accessibilityLabel,
}: {
  source: number;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={styles.iconBtn}
    >
      <Image
        source={source}
        style={{ width: 26, height: 26 }}
        contentFit="contain"
      />
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  // Chat
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
    minHeight: 41,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "#FFF",
  },
  activeBubble: {
    width: 283,
    minHeight: 51,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ACCENT,
    paddingTop: 4,
    paddingBottom: 4,
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
  },
  activeWords: { color: ACCENT },
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
    borderTopColor: "#E3E3FF",
    borderTopWidth: 1,
    gap: 12,
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
  smallTextBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#ECEEFF",
    borderWidth: 1,
    borderColor: "#DDDFFE",
  },
  smallTextBtnLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.14,
  },
  timeText: {
    width: 60,
    textAlign: "center",
    color: "#555",
    fontVariant: ["tabular-nums"],
  },
});
