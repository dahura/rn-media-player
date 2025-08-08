/**
 * Centralized color tokens for the app. Includes legacy light/dark structure and
 * concrete tokens used across the player feature.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#ffffff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
  // App-specific tokens (light mode baseline)
  tokens: {
    background: "#FFFFFF",
    text: "#1B1B1B",
    accent: "#DBA604",

    speaker: "#8A8A8A",
    timeText: "#555555",

    bubbleBg: "#FFFFFF",
    bubbleBorder: "#F2EEF6",
    bubbleActiveBg: "#E1E4FF",

    progressTrack: "#E8E8FF",
    iconButtonBg: "#ECEEFF",
    playButtonBg: "#E8E9FF",
    playButtonBorder: "#D9DAFF",

    transportBg: "#F6F6FF",
  },
} as const;

export type AppColors = typeof Colors;
