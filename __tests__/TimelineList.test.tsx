import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { TimelineList } from "@/features/player/components/TimelineList";
import type { TimelineItem } from "@/store/player";

const sampleTimeline: TimelineItem[] = [
  {
    phrase: { speaker: "Alice", words: "Hello", time: 500, indexInSpeaker: 0 },
    start: 0,
    end: 500,
    globalIndex: 0,
  },
  {
    phrase: { speaker: "Bob", words: "World", time: 700, indexInSpeaker: 0 },
    start: 700,
    end: 1400,
    globalIndex: 1,
  },
];

describe("TimelineList", () => {
  it("renders bubbles and calls onRepeatPhrase on press", () => {
    const onRepeatPhrase = jest.fn();
    const onMeasure = jest.fn();
    const onAutoScroll = jest.fn();

    render(
      <TimelineList
        timeline={sampleTimeline}
        activeIndex={0}
        firstSpeakerName="Alice"
        onRepeatPhrase={onRepeatPhrase}
        onMeasure={onMeasure}
        animatedOverlayStyle={{}}
        onAutoScroll={onAutoScroll}
      />
    );

    // Bubble buttons are exposed with label "Repeat slowly"
    const repeatButtons = screen.getAllByLabelText("Repeat slowly");
    expect(repeatButtons.length).toBe(2);
    fireEvent.press(repeatButtons[1]);
    expect(onRepeatPhrase).toHaveBeenCalledTimes(1);
  });
});


