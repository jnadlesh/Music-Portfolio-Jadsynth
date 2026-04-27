import type { MoodPreset } from "./moods";

type RGB = { r: number; g: number; b: number };

const cache = new Map<string, MoodPreset>();
const inFlight = new Map<string, Promise<MoodPreset>>();

const SAMPLE_SIZE = 48;
const QUANT_LEVELS = 5;

function quantize(v: number, levels: number): number {
  return Math.min(levels - 1, Math.floor((v * levels) / 256));
}

function toHex({ r, g, b }: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d > 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hp >= 0 && hp < 1) [rp, gp, bp] = [c, x, 0];
  else if (hp < 2) [rp, gp, bp] = [x, c, 0];
  else if (hp < 3) [rp, gp, bp] = [0, c, x];
  else if (hp < 4) [rp, gp, bp] = [0, x, c];
  else if (hp < 5) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  const m = l - c / 2;
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function extractDominant(data: Uint8ClampedArray): RGB[] {
  type Bucket = { r: number; g: number; b: number; count: number };
  const buckets = new Map<number, Bucket>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 24) continue;
    if (min > 232 && max - min < 12) continue;
    const key =
      quantize(r, QUANT_LEVELS) * QUANT_LEVELS * QUANT_LEVELS +
      quantize(g, QUANT_LEVELS) * QUANT_LEVELS +
      quantize(b, QUANT_LEVELS);
    const e = buckets.get(key);
    if (e) {
      e.r += r;
      e.g += g;
      e.b += b;
      e.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const sorted = Array.from(buckets.values()).sort(
    (a, b) => b.count - a.count,
  );
  const distinct: RGB[] = [];
  for (const e of sorted) {
    const avg: RGB = {
      r: e.r / e.count,
      g: e.g / e.count,
      b: e.b / e.count,
    };
    const tooClose = distinct.some(
      (c) =>
        Math.abs(c.r - avg.r) + Math.abs(c.g - avg.g) + Math.abs(c.b - avg.b) <
        80,
    );
    if (!tooClose) distinct.push(avg);
    if (distinct.length === 3) break;
  }
  while (distinct.length < 3) {
    distinct.push(distinct[distinct.length - 1] ?? { r: 80, g: 80, b: 80 });
  }
  return distinct;
}

function analyzeMood(colors: RGB[]) {
  const hsl = colors.map(rgbToHsl);
  const avgSat = hsl.reduce((s, c) => s + c.s, 0) / hsl.length;
  const avgLum = hsl.reduce((s, c) => s + c.l, 0) / hsl.length;
  const dominantHue = hsl[0].h;

  const isCool = dominantHue >= 180 && dominantHue <= 280;
  const isHot = dominantHue < 30 || dominantHue > 330 || (dominantHue >= 0 && dominantHue < 30);
  const isVibrant = avgSat > 0.55;

  let particleCount = 6;
  let driftSpeed = 5;
  let bassReactivity = 1.0;
  let trebleReactivity = 0.55;
  let blendMode: GlobalCompositeOperation = "screen";
  let blur = 60;
  let baseOpacity = 0.55;
  let sizeRange: [number, number] = [0.32, 0.55];

  if (isVibrant) {
    particleCount = 7;
    driftSpeed = 8;
    bassReactivity = 1.5;
    trebleReactivity = 0.9;
    blendMode = "lighter";
    blur = 42;
    sizeRange = [0.24, 0.42];
  } else if (avgSat < 0.25) {
    particleCount = 4;
    driftSpeed = 2.5;
    bassReactivity = 0.65;
    trebleReactivity = 0.4;
    blur = 80;
    baseOpacity = 0.65;
    sizeRange = [0.45, 0.7];
  }

  if (isCool) bassReactivity *= 0.85;
  if (isHot) bassReactivity *= 1.15;

  if (avgLum < 0.2) baseOpacity = Math.min(0.7, baseOpacity + 0.1);

  return {
    particleCount,
    driftSpeed,
    bassReactivity,
    trebleReactivity,
    blendMode,
    blur,
    baseOpacity,
    sizeRange,
    avgLum,
  };
}

export function deriveMoodFromImage(src: string): Promise<MoodPreset> {
  const cached = cache.get(src);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(src);
  if (pending) return pending;

  const promise = (async () => {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

    const dominant = extractDominant(imageData);
    const tuning = analyzeMood(dominant);

    const dominantHsl = rgbToHsl(dominant[0]);
    const bgRgb = hslToRgb(
      dominantHsl.h,
      Math.min(0.9, dominantHsl.s * 0.9),
      Math.max(0.02, Math.min(0.06, dominantHsl.l * 0.18)),
    );

    const preset: MoodPreset = {
      name: "derived",
      background: toHex(bgRgb),
      colors: [toHex(dominant[0]), toHex(dominant[1]), toHex(dominant[2])],
      particleCount: tuning.particleCount,
      sizeRange: tuning.sizeRange,
      driftSpeed: tuning.driftSpeed,
      bassReactivity: tuning.bassReactivity,
      trebleReactivity: tuning.trebleReactivity,
      blendMode: tuning.blendMode,
      filter: `blur(${tuning.blur}px)`,
      baseOpacity: tuning.baseOpacity,
    };

    cache.set(src, preset);
    inFlight.delete(src);
    return preset;
  })();

  inFlight.set(src, promise);
  return promise;
}
