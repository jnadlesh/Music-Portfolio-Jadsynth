import { usePlayer } from "~/lib/player-context";

export function TrackControls() {
  const { prev, next, toggle, isPlaying, volume, setVolume, scrubDirection } =
    usePlayer();

  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      <div className="relative flex items-center gap-5">
        <ScrubGlyph side="left" active={scrubDirection === "rewind"} />

        <button
          type="button"
          onClick={prev}
          aria-label="Previous track"
          className="flex h-11 w-11 items-center justify-center rounded-full text-bone/70 transition hover:text-bone"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M6 5h2v14H6zm12.5-.5v15L8 12z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-bone/25 text-bone/85 transition hover:border-bone hover:text-bone"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            {isPlaying ? (
              <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
        </button>

        <button
          type="button"
          onClick={next}
          aria-label="Next track"
          className="flex h-11 w-11 items-center justify-center rounded-full text-bone/70 transition hover:text-bone"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M16 5h2v14h-2zM5.5 4.5v15L16 12z" />
          </svg>
        </button>

        <ScrubGlyph side="right" active={scrubDirection === "ffwd"} />
      </div>

      <VolumeSlider volume={volume} setVolume={setVolume} />
    </div>
  );
}

function ScrubGlyph({
  side,
  active,
}: {
  side: "left" | "right";
  active: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-accent transition-all duration-150 ${
        side === "left" ? "right-full mr-3" : "left-full ml-3"
      } ${active ? "translate-x-0 opacity-100" : side === "left" ? "translate-x-2 opacity-0" : "-translate-x-2 opacity-0"}`}
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        {side === "left" ? (
          <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
        ) : (
          <path d="M4 18l8.5-6L4 6v12zm9 0l8.5-6L13 6v12z" />
        )}
      </svg>
    </span>
  );
}

function VolumeSlider({
  volume,
  setVolume,
}: {
  volume: number;
  setVolume: (v: number) => void;
}) {
  const pct = Math.round(volume * 100);

  return (
    <div className="flex w-56 items-center gap-3 sm:w-64">
      <svg
        className="h-4 w-4 shrink-0 text-bone/50"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M3 9v6h4l5 5V4L7 9H3z" />
      </svg>
      <div className="relative flex-1">
        <div className="h-1 rounded-full bg-bone/15">
          <div
            className="h-full rounded-full bg-accent/70"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          aria-label="Volume"
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-bone shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <svg
        className="h-4 w-4 shrink-0 text-bone/50"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4zM14 3.23v2.06a7 7 0 010 13.42v2.06a9 9 0 000-17.54z" />
      </svg>
      <span className="w-8 text-right font-mono text-[0.6rem] tabular-nums text-bone/50">
        {pct}
      </span>
    </div>
  );
}
