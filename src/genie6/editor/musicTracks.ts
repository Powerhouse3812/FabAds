/**
 * Music bed picker — TimelineEditor's audio lane.
 *
 * §19: "Music support ships in V1." No music mock exists anywhere else in
 * the repo (appPickerData.ts's PICKER_AUDIO is voiceover/interview raw
 * takes for Speech Cleanup, not a music library), so this is authored
 * fresh — grounded in the same royalty-free-license framing a real Genie
 * music bed would carry, with realistic (non-round) durations and BPM.
 */
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  mood: string;
  durationSec: number;
  bpm: number;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "mus-upbeat-corporate", title: "Bright Momentum", artist: "Felt Sense Audio", mood: "Upbeat · Corporate", durationSec: 47, bpm: 128 },
  { id: "mus-ugc-warm", title: "Kitchen Table Talk", artist: "Low Hum Collective", mood: "Warm · Conversational", durationSec: 63, bpm: 92 },
  { id: "mus-hype-trap", title: "Second Wind", artist: "Nightline Beats", mood: "Hype · Trap", durationSec: 39, bpm: 140 },
  { id: "mus-emotional-piano", title: "Quiet Progress", artist: "Marsh & Ito", mood: "Emotional · Piano", durationSec: 71, bpm: 76 },
  { id: "mus-minimal-tech", title: "Clean Slate", artist: "Studio Nine Loops", mood: "Minimal · Tech", durationSec: 54, bpm: 118 },
  { id: "mus-festive-dhol", title: "Ghar Wapasi", artist: "Rangeen Studio", mood: "Festive · Dhol-led", durationSec: 33, bpm: 132 },
  { id: "mus-lofi-chill", title: "Slow Sunday", artist: "Paperclip Radio", mood: "Lo-fi · Chill", durationSec: 88, bpm: 82 },
  { id: "mus-none", title: "No music — voiceover only", artist: "—", mood: "Silent", durationSec: 0, bpm: 0 },
];

export function getMusicTrack(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((t) => t.id === id);
}
