import { Colors } from "@/constants/Colors";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

export function ProgressBarAbove({
  animatedStyle,
  onLayout,
}: {
  animatedStyle: any;
  onLayout: (e: any) => void;
}) {
  return (
    <View
      style={styles.progressBarAbove}
      onLayout={onLayout}
      testID="progress-bar-above"
      accessibilityRole="progressbar"
      accessibilityLabel="Playback progress"
    >
      <Animated.View
        style={[styles.progressFill, styles.progressFillRounded, animatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progressFill: {
    height: "100%",
    backgroundColor: Colors.tokens.accent,
  },
  progressFillRounded: {
    borderRadius: 6,
  },
  progressBarAbove: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 118,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.tokens.progressTrack,
    overflow: "hidden",
    zIndex: 100,
  },
});
