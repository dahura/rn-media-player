import { PlayerControls } from "@/features/player/components/PlayerControls";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

describe("PlayerControls", () => {
  it("renders play icon when not playing and toggles on press", () => {
    const onTogglePlay = jest.fn();
    const onPressRewind = jest.fn();
    const onPressForward = jest.fn();

    render(
      <PlayerControls
        leftMs={0}
        rightMs={0}
        isPlaying={false}
        isFinished={false}
        onTogglePlay={onTogglePlay}
        onPressRewind={onPressRewind}
        onPressForward={onPressForward}
      />
    );

    const playButton = screen.getByRole("button", { name: "Toggle Play" });
    fireEvent.press(playButton);
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it("rewind/forward buttons call handlers", () => {
    const onTogglePlay = jest.fn();
    const onPressRewind = jest.fn();
    const onPressForward = jest.fn();

    render(
      <PlayerControls
        leftMs={0}
        rightMs={0}
        isPlaying={true}
        isFinished={false}
        onTogglePlay={onTogglePlay}
        onPressRewind={onPressRewind}
        onPressForward={onPressForward}
      />
    );

    fireEvent.press(screen.getByLabelText("Rewind"));
    fireEvent.press(screen.getByLabelText("Forward"));
    expect(onPressRewind).toHaveBeenCalledTimes(1);
    expect(onPressForward).toHaveBeenCalledTimes(1);
  });
});
