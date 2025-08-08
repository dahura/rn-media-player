import { useAudioController as useAudioControllerNative } from "@/hooks/useAudioController";
import { act, render } from "@testing-library/react-native";
import React from "react";
import { View } from "react-native";

// For web runs in Jest, the .web.ts implementation may be resolved automatically by module resolver.
// We keep tests minimal, focusing on public API: play, pause, seekTo, rewindToPhraseStart, repeatLastPhrase.

jest.mock("expo-audio", () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  useAudioPlayer: () => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    setPlaybackRate: jest.fn(),
    currentStatus: { currentTime: 0 },
  }),
  useAudioPlayerStatus: () => ({
    isLoaded: true,
    playing: false,
    currentTime: 0,
  }),
}));

jest.mock("@/store/player", () => {
  const actual = jest.requireActual("@/store/player");
  const setState: any = {};
  return {
    ...actual,
    usePlayerStore: () => ({
      setPlaying: jest.fn((v: boolean) => (setState.isPlaying = v)),
      setPosition: jest.fn((ms: number) => (setState.currentMs = ms)),
      rate: 1,
      setRate: jest.fn(),
      markLoaded: jest.fn(),
    }),
  };
});

describe("useAudioController", () => {
  it("exposes playback control methods", async () => {
    let api: ReturnType<typeof useAudioControllerNative> | null = null;

    function TestComponent() {
      api = useAudioControllerNative(1 as any);
      return <View />;
    }

    render(<TestComponent />);

    expect(api).not.toBeNull();
    await act(async () => {
      await api!.play();
      api!.pause();
      await api!.seekTo(1500);
      await api!.rewindToPhraseStart(0);
    });

    expect(typeof api!.play).toBe("function");
    expect(typeof api!.pause).toBe("function");
    expect(typeof api!.seekTo).toBe("function");
    expect(typeof api!.rewindToPhraseStart).toBe("function");
    expect(typeof api!.repeatLastPhrase).toBe("function");
  });
});
