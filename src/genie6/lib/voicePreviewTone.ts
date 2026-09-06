/**
 * Voice preview tone-sweep — §13 upgrade 2 ("Audio preview — a play control
 * while choosing, so the voice can be heard before it is committed to a
 * render").
 *
 * There are no real voice sample audio files anywhere in this repo (see
 * `src/mocks/shared/voices.ts` — every `sample` field is intentionally
 * undefined). A play control that renders in that state but produces no
 * sound is decorative — worse than not having one. This module makes the
 * control honest AND useful: it synthesises a short, distinct tone-sweep per
 * voice id via the Web Audio API, deterministically seeded so the same voice
 * always produces the same cue and different voices are audibly distinct.
 * It is explicitly a placeholder cue, not the real voice — every caller
 * using this must label it as such in the UI (a one-line note is enough).
 *
 * Shared by `AvatarVoicePicker` (Genie Brain) and `AvatarVoiceRail` (Studio's
 * UGC Video avatar/voice chip) so both audio-preview controls behave
 * identically — one mechanism, matching the "one taxonomy, must not diverge"
 * precedent §11 sets for avatar/voice categorisation.
 */

/** Tiny deterministic hash (FNV-1a) — stable per id, no runtime randomness. */
function hash(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface ToneSweepParams {
  startFreq: number;
  endFreq: number;
  durationSec: number;
  waveform: OscillatorType;
}

const WAVEFORMS: OscillatorType[] = ["sine", "triangle", "sawtooth", "square"];

/** Deterministic placeholder sweep parameters for a voice id — same id always
 *  yields the same sweep, so replaying a voice's cue sounds identical. */
export function toneSweepParams(voiceId: string): ToneSweepParams {
  const h = hash(voiceId);
  // NOTE: `>>>` (unsigned) everywhere below, not `>>`. `h` can exceed 2^31 —
  // a signed `>>` first coerces it via ToInt32, silently making it negative
  // for roughly half of all ids, which then poisons every `% modulus` below
  // with a negative remainder (wrong spread, sub-1s duration, even an
  // out-of-bounds/undefined `waveform` index). Caught by the Brain's audio
  // preview showing "0:00 / 0:00" for some voices instead of a real duration.
  const startFreq = 220 + (h % 440); // 220–659 Hz
  const direction = (h >>> 8) % 2 === 0 ? 1 : -1;
  const spread = 120 + ((h >>> 4) % 260); // 120–379 Hz sweep width
  const endFreq = Math.max(110, startFreq + direction * spread);
  // 1.2–2.19s, deliberately non-round. Floor of this always reads as at least
  // "0:01" on the control (never a confusing "0:00 / 0:00" before playing).
  const durationSec = 1.2 + ((h >>> 12) % 100) / 100;
  const waveform = WAVEFORMS[(h >>> 16) % WAVEFORMS.length];
  return { startFreq, endFreq, durationSec, waveform };
}

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === "closed") sharedCtx = new Ctor();
  return sharedCtx;
}

/**
 * Plays the placeholder tone-sweep for `voiceId`. Calls `onEnded` when the
 * sweep completes naturally (so callers can flip their "playing" state back
 * off). Returns a `stop()` function the caller can invoke early — pressing
 * stop, picking another voice, or unmounting.
 *
 * If the Web Audio API isn't available in this environment, `onEnded` fires
 * immediately so state never gets stuck "playing" with no sound and no way
 * out.
 */
export function playToneSweep(voiceId: string, onEnded: () => void): () => void {
  const ctx = getCtx();
  if (!ctx) {
    onEnded();
    return () => {};
  }
  if (ctx.state === "suspended") void ctx.resume();

  const { startFreq, endFreq, durationSec, waveform } = toneSweepParams(voiceId);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = waveform;

  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + durationSec);

  // Short fade in/out so the sweep doesn't click at start or end.
  const fadeOutStart = Math.max(now, now + durationSec - 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
  gain.gain.setValueAtTime(0.18, fadeOutStart);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec);

  let stopped = false;
  osc.onended = () => {
    if (!stopped) onEnded();
  };

  return () => {
    if (stopped) return;
    stopped = true;
    try {
      osc.stop();
    } catch {
      // Already stopped — nothing to do.
    }
  };
}
