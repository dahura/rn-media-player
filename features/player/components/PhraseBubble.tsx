import { Colors } from "@/constants/Colors";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

export function PhraseBubble({
  speaker,
  words,
  isActive,
  isInitiator,
  index,
  onMeasure,
  animatedOverlayStyle,
  onRepeat,
}: {
  speaker: string;
  words: string;
  isActive: boolean;
  isInitiator: boolean;
  index: number;
  onMeasure: (index: number, width: number, isActive: boolean) => void;
  animatedOverlayStyle: any;
  onRepeat: () => void;
}) {
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
        {speaker}
      </Text>
      <Pressable
        onPress={onRepeat}
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
              onMeasure(index, e.nativeEvent.layout.width, isActive)
            }
          >
            <Text style={styles.words}>{words}</Text>
            {isActive && (
              <Animated.View
                pointerEvents="none"
                style={[styles.progressTextOverlay, animatedOverlayStyle]}
              >
                <Text style={[styles.words, styles.accentText]}>{words}</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  phraseContainer: { marginBottom: 16, width: "100%" },
  speaker: {
    marginBottom: 6,
    fontWeight: "600",
    color: Colors.tokens.speaker,
    fontSize: 13,
    letterSpacing: -0.13,
    fontFamily: "Outfit_600SemiBold",
  },
  leftSpeaker: { alignSelf: "flex-start", textAlign: "left" },
  rightSpeaker: { alignSelf: "flex-end", textAlign: "right" },
  activeSpeaker: { color: Colors.tokens.accent },
  bubble: {
    maxWidth: 283,
    width: 283,
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.tokens.bubbleBorder,
    backgroundColor: Colors.tokens.bubbleBg,
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
    backgroundColor: Colors.tokens.bubbleActiveBg,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  leftBubble: { alignSelf: "flex-start" },
  rightBubble: { alignSelf: "flex-end" },
  words: {
    color: Colors.tokens.text,
    fontSize: 17,
    lineHeight: 17,
    letterSpacing: -0.17,
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "600",
    flex: 1,
    flexWrap: "wrap",
  },
  accentText: { color: Colors.tokens.accent },
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
});
