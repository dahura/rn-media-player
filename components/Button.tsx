import { Pressable, PressableProps } from "react-native";

export const Button = ({ children, ...props }: PressableProps) => {
  return <Pressable {...props}>{children}</Pressable>;
};
