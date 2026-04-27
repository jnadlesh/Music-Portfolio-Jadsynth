# 🎛️ JADSYNTH — Music Portfolio

> Original music by **JADSYNTH**, served on a spinning vinyl.
> Live at **[jadsynth.com](https://jadsynth.com)** · Find me on **[SoundCloud](https://soundcloud.com/jadsynth)** 🎧

---

## What it is

A single-page music portfolio built around a turntable.
Drag the record to scrub. Scroll to bend the pitch. Switch tracks from the
vinyl crate. The atmospheric background reads the FFT of the live audio
and breathes in time with the music.

## Stack

| Layer | What |
|-------|------|
| App   | React 19 + TanStack Router (SPA) |
| Build | Vite 7 |
| Audio | Howler.js + Web Audio (AnalyserNode, K-weighted LUFS, peak limiter) |
| Motion| Framer Motion + a custom `<canvas>` reactive background |
| Style | Tailwind 3 + a custom dark palette |
| Host  | GitHub Pages, custom domain via Cloudflare DNS |

## Notable bits

- **Real LUFS normalization** — every track gets attenuated to ~-14 LUFS in real time using a K-weighted measurement chain with a true-peak limiter at -1 dBFS. No matter how hot a master is, your eardrums survive.
- **Tape-stop pause** — a quarter-cosine volume fade so pause sounds like a record slowing into silence, not a hard cut.
- **Crossfade between tracks** — overlapping Howl instances with mirrored sin/cos volume envelopes.
- **Mood-derived background** — extracts a 3-color palette from each cover via canvas pixel quantization, then synthesizes a particle field whose blob shapes warp on the bass.
- **Catalog carousel** — Rolodex-style fan of 5 records, paginates infinitely with drag/scroll/arrows. Mobile drops to 3 visible.
- **Vinyl peek on hover** — pulls the disc out of the sleeve like a real LP.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

## Add a track

1. Drop the audio file in `public/audio/`. WAV is fine — `npm run convert-audio` will encode to 192 kbps MP3 (needs ffmpeg).
2. Add an entry in [tracks.json](tracks.json):
   ```json
   { "soundcloudUrl": "https://soundcloud.com/jadsynth/your-track", "audioFile": "/audio/your-track.mp3" }
   ```
3. `npm run sync-tracks` — fetches the SoundCloud title + cover art via oEmbed and regenerates `src/lib/tracks.ts`.
4. Commit and push. GitHub Actions deploys automatically.

## License

- **Code** — MIT. Fork it, build your own portfolio, no problem.
- **Music** — All rights reserved. Don't sample, redistribute, train models on, or otherwise use the audio in `public/audio/`. If you want to license a track, reach out.
- **Cover art** — Sourced from SoundCloud, rights belong to the original creators.

See [LICENSE](LICENSE) for the full text.

---

> Built by [@jnadlesh](https://github.com/jnadlesh) · Music by [JADSYNTH](https://soundcloud.com/jadsynth)
