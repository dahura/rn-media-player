type Params = {
  isPlaying: boolean;
  isFinished: boolean;
  play: () => void;
  pause: () => void;
  stepToIndex: (i: number) => void;
  seekTo: (ms: number) => void;
  resetAllAnimations: () => void;
};

export function usePlayToggle({
  isPlaying,
  isFinished,
  play,
  pause,
  stepToIndex,
  seekTo,
  resetAllAnimations,
}: Params) {
  const onTogglePlay = () => {
    if (isPlaying && !isFinished) {
      pause();
      return;
    }
    if (isFinished) {
      stepToIndex(0);
      seekTo(0);
      resetAllAnimations();
    }
    play();
  };

  return { onTogglePlay };
}
