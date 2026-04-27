import { tracks, type Track } from "./tracks";

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleTracksArtFirst(): Track[] {
  const withArt = tracks.filter((t) => t.artworkSrc);
  const withoutArt = tracks.filter((t) => !t.artworkSrc);
  return [...fisherYates(withArt), ...fisherYates(withoutArt)];
}
