import { useEffect, useRef, type MutableRefObject } from "react";
import type { Howl } from "howler";

let sharedCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

const sourceCache = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

const TARGET_LUFS = -14;
const LUFS_GAIN_MIN = 0.3;
const LUFS_GAIN_MAX = 1.0;
const MASTER_TRIM = 0.45;
const MEASURE_INTERVAL_MS = 250;
const BLOCK_HISTORY = 40;

type Result = {
  analyserRef: MutableRefObject<AnalyserNode | null>;
  dataRef: MutableRefObject<Uint8Array<ArrayBuffer> | null>;
};

export function useAudioAnalyser(
  howlRef: MutableRefObject<Howl | null>,
  currentIndex: number,
  isPlaying: boolean,
): Result {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let attempts = 0;

    const tryConnect = () => {
      if (cancelled) return;
      const h = howlRef.current as unknown as
        | { _sounds?: Array<{ _node?: HTMLAudioElement }> }
        | null;
      const node = h?._sounds?.[0]?._node;
      if (!node) {
        if (attempts++ < 600) requestAnimationFrame(tryConnect);
        return;
      }

      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      try {
        let source = sourceCache.get(node);
        if (!source) {
          source = ctx.createMediaElementSource(node);
          sourceCache.set(node, source);
        }

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

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.55;

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

        try {
          source.disconnect();
        } catch {
          /* not previously connected */
        }

        source.connect(loudnessGain);
        loudnessGain.connect(limiter);
        limiter.connect(analyser);
        analyser.connect(masterTrim);
        masterTrim.connect(ctx.destination);

        source.connect(kHighShelf);
        kHighShelf.connect(kHighPass);
        kHighPass.connect(measureAnalyser);

        analyserRef.current = analyser;
        dataRef.current = new Uint8Array(
          new ArrayBuffer(analyser.frequencyBinCount),
        );

        const timeBuf = new Float32Array(measureAnalyser.fftSize);
        const blocks: number[] = [];
        const measureId = window.setInterval(() => {
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

          const avg =
            blocks.reduce((a, b) => a + b, 0) / blocks.length;
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

        cleanupRef.current = () => {
          clearInterval(measureId);
        };
      } catch (err) {
        console.warn("[audio-analyser] setup failed", err);
      }
    };

    requestAnimationFrame(tryConnect);

    const onInteraction = () => {
      const ctx = getAudioContext();
      ctx?.resume().catch(() => {});
    };
    window.addEventListener("pointerdown", onInteraction);
    window.addEventListener("keydown", onInteraction);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [howlRef, currentIndex, isPlaying]);

  return { analyserRef, dataRef };
}
