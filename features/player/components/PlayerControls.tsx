import { IconButton } from "@/components/common/IconButton";
import { TimeText } from "@/components/common/TimeText";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function PlayerControls({
  leftMs,
  rightMs,
  isPlaying,
  isFinished,
  onTogglePlay,
  onPressRewind,
  onPressForward,
}: {
  leftMs: number;
  rightMs: number;
  isPlaying: boolean;
  isFinished: boolean;
  onTogglePlay: () => void;
  onPressRewind: () => void;
  onPressForward: () => void;
}) {
  return (
    <View style={styles.transport}>
      <View style={styles.transportTopRow}>
        <TimeText ms={leftMs} style={styles.timeText} />
        <TimeText ms={rightMs} style={styles.timeText} />
      </View>

      <View style={styles.controlsRow}>
        <IconButton
          name="play-back"
          onPress={onPressRewind}
          accessibilityLabel="Rewind"
          style={styles.iconBtn}
          color={Colors.tokens.text}
          size={26}
        />

        <Pressable onPress={onTogglePlay} style={styles.playBtn} hitSlop={12}>
          {isPlaying && !isFinished ? (
            <Ionicons name="pause" size={32} color={Colors.tokens.text} />
          ) : (
            <Ionicons name="play" size={32} color={Colors.tokens.text} />
          )}
        </Pressable>

        <IconButton
          name="play-forward"
          onPress={onPressForward}
          accessibilityLabel="Forward"
          style={styles.iconBtn}
          color={Colors.tokens.text}
          size={26}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  transport: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 18,
    backgroundColor: Colors.tokens.transportBg,
    gap: 12,
    zIndex: 10,
    elevation: 20,
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
    backgroundColor: Colors.tokens.iconButtonBg,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.tokens.playButtonBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.tokens.playButtonBorder,
  },
  timeText: {
    width: 60,
    textAlign: "center",
    color: Colors.tokens.timeText,
    fontVariant: ["tabular-nums"],
  },
});
