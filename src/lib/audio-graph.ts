// Shared Web Audio chain. Both the Howler-driven playback path and the
// AudioBufferSource-driven scrub engine connect into `inputGain`, then run
// through the same loudness normalization, peak limiter, master trim and
// duck/click-killing gain.

const TARGET_LUFS = -14;
const LUFS_GAIN_MIN = 0.3;
const LUFS_GAIN_MAX = 1.0;
const MASTER_TRIM = 0.45;
const MEASURE_INTERVAL_MS = 250;
const BLOCK_HISTORY = 40;

let ctx: AudioContext | null = null;
let _inputGain: GainNode | null = null;
let _analyser: AnalyserNode | null = null;
let _duckFn: ((ms?: number) => void) | null = null;

const sourceCache = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    buildGraph();
  }
  return ctx;
}

function buildGraph() {
  if (!ctx || _inputGain) return;

  const inputGain = ctx.createGain();
  inputGain.gain.value = 1.0;

  const loudnessGain = ctx.createGain();
  loudnessGain.gain.value = 1.0;

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.005;
  limiter.release.value = 0.1;

  const masterTrim = ctx.createGain();
  masterTrim.gain.value = MASTER_TRIM;

  const duckGain = ctx.createGain();
  duckGain.gain.value = 1.0;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.55;

  inputGain.connect(loudnessGain);
  loudnessGain.connect(limiter);
  limiter.connect(analyser);
  analyser.connect(masterTrim);
  masterTrim.connect(duckGain);
  duckGain.connect(ctx.destination);

  // K-weighted measurement branch — taps inputGain so it sees both Howler
  // playback AND scrub audio.
  const kHighShelf = ctx.createBiquadFilter();
  kHighShelf.type = "highshelf";
  kHighShelf.frequency.value = 1681;
  kHighShelf.gain.value = 4;
  kHighShelf.Q.value = 0.7071;

  const kHighPass = ctx.createBiquadFilter();
  kHighPass.type = "highpass";
  kHighPass.frequency.value = 38;
  kHighPass.Q.value = 0.5;

  const measureAnalyser = ctx.createAnalyser();
  measureAnalyser.fftSize = 2048;
  measureAnalyser.smoothingTimeConstant = 0;

  inputGain.connect(kHighShelf);
  kHighShelf.connect(kHighPass);
  kHighPass.connect(measureAnalyser);

  const timeBuf = new Float32Array(measureAnalyser.fftSize);
  const blocks: number[] = [];
  window.setInterval(() => {
    if (!ctx) return;
    measureAnalyser.getFloatTimeDomainData(timeBuf);
    let sumSq = 0;
    for (let i = 0; i < timeBuf.length; i++) {
      sumSq += timeBuf[i] * timeBuf[i];
    }
    const meanSq = sumSq / timeBuf.length;
    if (meanSq < 1e-10) return;

    blocks.push(meanSq);
    if (blocks.length > BLOCK_HISTORY) blocks.shift();
    if (blocks.length < 4) return;

    const avg = blocks.reduce((a, b) => a + b, 0) / blocks.length;
    const lufs = -0.691 + 10 * Math.log10(avg + 1e-12);
    const gainDb = TARGET_LUFS - lufs;
    const gainLinear = Math.pow(10, gainDb / 20);
    const clamped = Math.max(
      LUFS_GAIN_MIN,
      Math.min(LUFS_GAIN_MAX, gainLinear),
    );

    const now = ctx.currentTime;
    loudnessGain.gain.cancelScheduledValues(now);
    loudnessGain.gain.setValueAtTime(loudnessGain.gain.value, now);
    loudnessGain.gain.linearRampToValueAtTime(clamped, now + 1.5);
  }, MEASURE_INTERVAL_MS);

  _duckFn = (durationMs = 80) => {
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const dur = durationMs / 1000;
    duckGain.gain.cancelScheduledValues(t0);
    duckGain.gain.setValueAtTime(duckGain.gain.value, t0);
    duckGain.gain.linearRampToValueAtTime(0, t0 + dur * 0.18);
    duckGain.gain.setValueAtTime(0, t0 + dur * 0.45);
    duckGain.gain.linearRampToValueAtTime(1, t0 + dur);
  };

  _inputGain = inputGain;
  _analyser = analyser;
}

export function getInputGain(): GainNode | null {
  getAudioContext();
  return _inputGain;
}

export function getAnalyser(): AnalyserNode | null {
  return _analyser;
}

export function duckOutput(durationMs = 80): void {
  _duckFn?.(durationMs);
}

export function attachMediaElement(node: HTMLMediaElement): boolean {
  const c = getAudioContext();
  if (!c) return false;
  if (c.state === "suspended") c.resume().catch(() => {});
  const input = getInputGain();
  if (!input) return false;
  try {
    let source = sourceCache.get(node);
    if (!source) {
      source = c.createMediaElementSource(node);
      sourceCache.set(node, source);
    }
    try {
      source.disconnect();
    } catch {
      /* not previously connected */
    }
    source.connect(input);
    return true;
  } catch (err) {
    console.warn("[audio-graph] attach failed", err);
    return false;
  }
}

export function resumeAudio(): void {
  const c = getAudioContext();
  c?.resume().catch(() => {});
}
