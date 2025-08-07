import { create } from "zustand";

export type Phrase = {
  speaker: string;
  words: string;
  time: number; // ms
  indexInSpeaker: number;
};

export type TimelineItem = {
  phrase: Phrase;
  start: number; // ms from audio start
  end: number; // ms from audio start
  globalIndex: number;
};

export type PlayerState = {
  isLoaded: boolean;
  isPlaying: boolean;
  currentMs: number;
  rate: number;
  timeline: TimelineItem[];
  activeIndex: number; // current phrase index in timeline
  loadTimeline: (
    phrasesBySpeaker: {
      name: string;
      phrases: { words: string; time: number }[];
    }[],
    pauseMs: number
  ) => void;
  setPlaying: (playing: boolean) => void;
  setPosition: (ms: number) => void;
  stepToIndex: (index: number) => void;
  stepRelative: (delta: number) => void;
  markLoaded: (loaded: boolean) => void;
  setRate: (rate: number) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isLoaded: false,
  isPlaying: false,
  currentMs: 0,
  rate: 1,
  timeline: [],
  activeIndex: 0,
  markLoaded: (loaded) => set({ isLoaded: loaded }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setPosition: (currentMs) => {
    const { timeline } = get();
    let activeIndex = get().activeIndex;
    if (timeline.length > 0) {
      const found = timeline.findIndex(
        (t) => currentMs >= t.start && currentMs < t.end
      );
      activeIndex = found === -1 ? timeline.length - 1 : found;
    }
    set({ currentMs, activeIndex });
  },
  stepToIndex: (index) => {
    const { timeline } = get();
    if (timeline.length === 0) return;
    const clamped = Math.max(0, Math.min(index, timeline.length - 1));
    set({ activeIndex: clamped, currentMs: timeline[clamped].start });
  },
  stepRelative: (delta) => {
    const { activeIndex } = get();
    get().stepToIndex(activeIndex + delta);
  },
  setRate: (rate) => set({ rate }),
  loadTimeline: (speakers, pauseMs) => {
    const maxLen = Math.max(...speakers.map((s) => s.phrases.length));
    const ordered: Phrase[] = [];
    for (let i = 0; i < maxLen; i += 1) {
      for (let s = 0; s < speakers.length; s += 1) {
        const sp = speakers[s];
        const p = sp.phrases[i];
        if (p)
          ordered.push({
            speaker: sp.name,
            words: p.words,
            time: p.time,
            indexInSpeaker: i,
          });
      }
    }

    let cursor = 0;
    const timeline: TimelineItem[] = ordered.map((phrase, globalIndex) => {
      const start = cursor;
      const end = start + phrase.time;
      cursor = end + pauseMs; // add pause after each phrase
      return { phrase, start, end, globalIndex };
    });

    set({ timeline, currentMs: 0, activeIndex: 0, isLoaded: false });
  },
}));
