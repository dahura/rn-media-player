import { usePlayerStore } from "@/store/player";
import { useEffect, useMemo } from "react";

type Transcript = {
  speakers: { name: string; phrases: { words: string; time: number }[] }[];
  pause: number;
};

export function useTranscriptTimeline(transcript: Transcript) {
  const { timeline, loadTimeline } = usePlayerStore();

  useEffect(() => {
    loadTimeline(transcript.speakers, transcript.pause);
  }, [loadTimeline, transcript]);

  const totalMs = useMemo(
    () => (timeline.length ? timeline[timeline.length - 1].end : 1),
    [timeline]
  );

  const firstSpeakerName = transcript.speakers?.[0]?.name ?? "";

  return { timeline, totalMs, firstSpeakerName };
}
