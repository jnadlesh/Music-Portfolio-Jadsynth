export type MoodName =
  | "dusk"
  | "glacial"
  | "noir"
  | "neon"
  | "haze"
  | "ember";

export type MoodPreset = {
  name: string;
  background: string;
  colors: [string, string, string];
  particleCount: number;
  sizeRange: [number, number];
  driftSpeed: number;
  bassReactivity: number;
  trebleReactivity: number;
  blendMode: GlobalCompositeOperation;
  filter: string;
  baseOpacity: number;
};

export const MOODS: Record<MoodName, MoodPreset> = {
  dusk: {
    name: "dusk",
    background: "#0a0604",
    colors: ["#d4a574", "#a85a2a", "#3a1f0f"],
    particleCount: 6,
    sizeRange: [0.32, 0.55],
    driftSpeed: 5,
    bassReactivity: 0.9,
    trebleReactivity: 0.5,
    blendMode: "screen",
    filter: "blur(55px)",
    baseOpacity: 0.55,
  },
  glacial: {
    name: "glacial",
    background: "#04080f",
    colors: ["#a5c4e0", "#5588b8", "#1a2a3a"],
    particleCount: 7,
    sizeRange: [0.28, 0.5],
    driftSpeed: 4,
    bassReactivity: 0.75,
    trebleReactivity: 0.65,
    blendMode: "screen",
    filter: "blur(60px)",
    baseOpacity: 0.6,
  },
  noir: {
    name: "noir",
    background: "#05030a",
    colors: ["#5a3a8c", "#2a1a4a", "#7b00ff"],
    particleCount: 5,
    sizeRange: [0.38, 0.65],
    driftSpeed: 4,
    bassReactivity: 1.2,
    trebleReactivity: 0.4,
    blendMode: "screen",
    filter: "blur(70px)",
    baseOpacity: 0.55,
  },
  neon: {
    name: "neon",
    background: "#000",
    colors: ["#ff2bd6", "#00e5ff", "#7b00ff"],
    particleCount: 7,
    sizeRange: [0.22, 0.42],
    driftSpeed: 9,
    bassReactivity: 1.6,
    trebleReactivity: 0.95,
    blendMode: "lighter",
    filter: "blur(40px)",
    baseOpacity: 0.5,
  },
  haze: {
    name: "haze",
    background: "#1a1014",
    colors: ["#f3c5d4", "#d59cb6", "#9b6f88"],
    particleCount: 5,
    sizeRange: [0.45, 0.7],
    driftSpeed: 3,
    bassReactivity: 0.55,
    trebleReactivity: 0.35,
    blendMode: "screen",
    filter: "blur(80px)",
    baseOpacity: 0.65,
  },
  ember: {
    name: "ember",
    background: "#0a0303",
    colors: ["#ff6a3d", "#c2331a", "#5e0f0a"],
    particleCount: 6,
    sizeRange: [0.32, 0.55],
    driftSpeed: 5,
    bassReactivity: 1.5,
    trebleReactivity: 0.55,
    blendMode: "screen",
    filter: "blur(55px)",
    baseOpacity: 0.55,
  },
};

export const DEFAULT_MOOD: MoodName = "dusk";
