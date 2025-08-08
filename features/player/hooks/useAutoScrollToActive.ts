import { useEffect } from "react";
import { FlatList } from "react-native";

export function useAutoScrollToActive<T>(
  listRef: React.RefObject<FlatList<T> | null>,
  activeIndex: number,
  timelineLength: number
) {
  useEffect(() => {
    if (!timelineLength) return;
    const index = Math.min(Math.max(activeIndex, 0), timelineLength - 1);
    listRef.current?.scrollToIndex({
      index,
      viewPosition: 0.5,
      animated: true,
    });
  }, [activeIndex, timelineLength, listRef]);
}
