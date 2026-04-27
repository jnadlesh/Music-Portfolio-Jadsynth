# JADSYNTH

Music portfolio site. Dark, minimal, vinyl-first.

**Stack:** TanStack Start (Vinxi + Nitro) · React 18 · Tailwind · Framer Motion · Howler.js

## Run

```bash
npm install
npm run dev
```

Drop your tracks in `public/audio/` (filenames `track-01.mp3`, `track-02.mp3`, …) or edit [app/lib/tracks.ts](app/lib/tracks.ts).

## Layout

- [app/routes/index.tsx](app/routes/index.tsx) — vinyl landing page
- [app/routes/catalog.tsx](app/routes/catalog.tsx) — full track list
- [app/components/Vinyl.tsx](app/components/Vinyl.tsx) — spinning record, scroll/drag → speed
- [app/components/Navbar.tsx](app/components/Navbar.tsx) — prev / play / next / track / catalog
- [app/lib/player-context.tsx](app/lib/player-context.tsx) — global player state

## Interactions

- **Scroll** over the record → nudge speed up/down
- **Drag** the record → spin it directly (DJ-style scrub)
- **Double-click** → play/pause
- Speed maps 1:1 to audio `playbackRate` (clamped 0.25×–2.5×)
