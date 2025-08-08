import type { TimelineItem } from "@/store/player";
import React, { useRef } from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
import { PhraseBubble } from "./PhraseBubble";

export function TimelineList({
  timeline,
  activeIndex,
  firstSpeakerName,
  onRepeatPhrase,
  onMeasure,
  animatedOverlayStyle,
  onAutoScroll,
}: {
  timeline: TimelineItem[];
  activeIndex: number;
  firstSpeakerName: string;
  onRepeatPhrase: (start: number, end: number) => void;
  onMeasure: (index: number, width: number, isActive: boolean) => void;
  animatedOverlayStyle: any;
  onAutoScroll: (ref: React.RefObject<FlatList<TimelineItem> | null>) => void;
}) {
  const listRef = useRef<FlatList<TimelineItem>>(null);

  // delegate auto-scroll wiring to caller hook
  onAutoScroll(listRef);

  const renderItem = ({ item, index }: ListRenderItemInfo<TimelineItem>) => {
    const isActive = index === activeIndex;
    const isInitiator = item.phrase.speaker === firstSpeakerName;
    return (
      <PhraseBubble
        speaker={item.phrase.speaker}
        words={item.phrase.words}
        isActive={isActive}
        isInitiator={isInitiator}
        index={index}
        onMeasure={onMeasure}
        animatedOverlayStyle={animatedOverlayStyle}
        onRepeat={() => onRepeatPhrase(item.start, item.end)}
      />
    );
  };

  const keyExtractor = (item: TimelineItem) => String(item.globalIndex);

  return (
    <FlatList
      ref={listRef}
      data={timeline}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16, paddingBottom: 220 }}
      initialNumToRender={8}
      onScrollToIndexFailed={(info) => {
        const offset = Math.max(0, (info.averageItemLength ?? 0) * info.index);
        listRef.current?.scrollToOffset({ offset, animated: true });
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: info.index,
            viewPosition: 0.5,
            animated: true,
          });
        }, 250);
      }}
    />
  );
}
