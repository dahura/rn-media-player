declare module "@/assets/transcript.json" {
  const value: {
    pause: number;
    speakers: { name: string; phrases: { words: string; time: number }[] }[];
  };
  export default value;
}
