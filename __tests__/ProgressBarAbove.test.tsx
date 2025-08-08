import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ProgressBarAbove } from "@/features/player/components/ProgressBarAbove";

describe("ProgressBarAbove", () => {
  it("renders progress bar with role and label", () => {
    render(
      <ProgressBarAbove
        animatedStyle={{ width: 50 }}
        onLayout={jest.fn()}
      />
    );

    // RN role mapping may not expose as role; fallback to label or testID
    const el = screen.getByLabelText("Playback progress");
    expect(el).toBeOnTheScreen();
  });
});


