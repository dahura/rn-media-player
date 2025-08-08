import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { PhraseBubble } from "@/features/player/components/PhraseBubble";

describe("PhraseBubble", () => {
  it("shows words and triggers onRepeat on press", () => {
    const onRepeat = jest.fn();
    const onMeasure = jest.fn();

    render(
      <PhraseBubble
        speaker="Alice"
        words="Test phrase"
        isActive={true}
        isInitiator={true}
        index={0}
        onMeasure={onMeasure}
        animatedOverlayStyle={{}}
        onRepeat={onRepeat}
      />
    );

    // Active bubble renders overlay text as well, so there can be multiple matches
    expect(screen.getAllByText("Test phrase").length).toBeGreaterThan(0);
    fireEvent.press(screen.getByLabelText("Repeat slowly"));
    expect(onRepeat).toHaveBeenCalledTimes(1);
  });
});


