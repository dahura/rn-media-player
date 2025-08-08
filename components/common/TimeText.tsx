import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";

export function TimeText({
  ms,
  style,
}: {
  ms: number;
  style?: StyleProp<TextStyle>;
}) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return <Text style={style}>{`${pad(m)}:${pad(s)}`}</Text>;
}
