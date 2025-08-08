import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  style,
  color = "#1B1B1B",
  size = 26,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        {
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#ECEEFF",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
      hitSlop={10}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}
