import { Link } from "@tanstack/react-router";
import { usePlayer } from "~/lib/player-context";
import { VolumeKnob } from "./VolumeKnob";

export function Navbar() {
  const { current, prev, next, toggle, isPlaying, toggleCatalog, catalogOpen } =
    usePlayer();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-white/[0.04] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150"
      style={{
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        backdropFilter: "blur(28px) saturate(180%)",
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
      <nav className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 md:gap-6 md:px-6">
        <div className="flex justify-start">
          <Link
            to="/"
            className="font-display text-xs uppercase tracking-[0.3em] text-bone hover:text-accent md:text-sm md:tracking-[0.4em]"
          >
            Jadsynth
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-bone/60 md:gap-4">
          <button
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center text-base text-bone/70 hover:text-bone md:h-auto md:w-auto md:text-xs md:uppercase md:tracking-widest"
            aria-label="Previous track"
          >
            <span className="md:hidden">‹</span>
            <span className="hidden md:inline">‹ Prev</span>
          </button>
          <button
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-bone/20 text-bone/80 hover:border-bone md:h-auto md:w-auto md:px-3 md:py-1 md:text-[0.65rem] md:uppercase md:tracking-widest"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <span className="md:hidden text-sm">{isPlaying ? "❚❚" : "▶"}</span>
            <span className="hidden md:inline">{isPlaying ? "Pause" : "Play"}</span>
          </button>
          <div className="hidden min-w-[14ch] text-center text-xs uppercase tracking-widest text-bone md:block">
            {current.title}
          </div>
          <button
            onClick={next}
            className="flex h-10 w-10 items-center justify-center text-base text-bone/70 hover:text-bone md:h-auto md:w-auto md:text-xs md:uppercase md:tracking-widest"
            aria-label="Next track"
          >
            <span className="md:hidden">›</span>
            <span className="hidden md:inline">Next ›</span>
          </button>
          <div className="hidden md:flex">
            <VolumeKnob />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={toggleCatalog}
            aria-expanded={catalogOpen}
            className="text-[0.65rem] uppercase tracking-[0.25em] text-bone/70 hover:text-accent md:text-xs md:tracking-[0.3em]"
          >
            {catalogOpen ? "Close" : "Catalog"}
          </button>
        </div>
      </nav>
    </header>
  );
}
