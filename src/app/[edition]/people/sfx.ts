// Sound effects for the find-the-brick game, synthesised on the spot with the Web Audio API - no
// audio files to download. Browsers only allow sound after the visitor has interacted with the
// page, so nothing plays until `unlock()` runs from the play button press.

let ctx: AudioContext | null = null;
let muted = false;

export function unlock() {
  if (typeof window === "undefined") return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
}

export function setMuted(value: boolean) {
  muted = value;
}

type Wave = OscillatorType;

// One note: a pitch (optionally sliding to another) with a quick attack and a decay.
function tone(freq: number, { at = 0, length = 0.15, wave = "square" as Wave, to, volume = 0.12 }: { at?: number; length?: number; wave?: Wave; to?: number; volume?: number } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + length);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

// A short burst of noise (a whoosh or a clack), shaped by a filter.
function noise({ at = 0, length = 0.2, from = 800, to = 3000, volume = 0.08, type = "bandpass" as BiquadFilterType } = {}) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + at;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
}

export const sfx = {
  // Game start: a quick rising jingle.
  start() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.07, length: 0.12 }));
  },
  // The brick appearing big in the middle.
  pop() {
    tone(220, { to: 880, length: 0.18, wave: "triangle", volume: 0.2 });
  },
  // A pass to the next person; `pitch` goes up as the passes speed up.
  whoosh(pitch = 1) {
    noise({ length: 0.22, from: 600 * pitch, to: 2400 * pitch, volume: 0.07 });
    tone(330 * pitch, { to: 520 * pitch, length: 0.14, wave: "triangle", volume: 0.06 });
  },
  // The brick disappearing into closed fists.
  clack() {
    noise({ length: 0.08, from: 1800, to: 900, volume: 0.12, type: "lowpass" });
    tone(160, { length: 0.1, wave: "square", volume: 0.08 });
  },
  // Everyone shuffling their fists after the brick is hidden: a quick rattle.
  rattle() {
    for (let i = 0; i < 6; i++) noise({ at: i * 0.11 + Math.random() * 0.03, length: 0.06, from: 2500, to: 1200, volume: 0.07 });
  },
  // Whoever had it laughing at the player: a bouncy ha-ha-ha-ha, each one a little lower.
  laugh() {
    [620, 580, 540, 500, 470].forEach((f, i) => tone(f, { at: i * 0.13, length: 0.1, wave: "triangle", volume: 0.13, to: f * 0.75 }));
  },
  // Hovering over someone while guessing.
  tick() {
    tone(1200, { length: 0.04, wave: "square", volume: 0.025 });
  },
  // Hands opening.
  open() {
    tone(440, { to: 660, length: 0.1, wave: "triangle", volume: 0.1 });
  },
  // A wrong guess: a low buzz.
  wrong() {
    tone(140, { length: 0.35, wave: "sawtooth", volume: 0.1, to: 90 });
    tone(147, { length: 0.35, wave: "square", volume: 0.05, to: 95 });
  },
  // Found it: a little fanfare.
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.09, length: 0.16, volume: 0.1 }));
  },
  // Out of hearts: a sad slide down.
  lose() {
    [392, 370, 349, 262].forEach((f, i) => tone(f, { at: i * 0.22, length: i === 3 ? 0.6 : 0.2, wave: "triangle", volume: 0.14, to: i === 3 ? 196 : undefined }));
  },
};
