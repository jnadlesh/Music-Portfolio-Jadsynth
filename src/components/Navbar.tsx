import { Link } from "@tanstack/react-router";
import { usePlayer } from "~/lib/player-context";

export function Navbar() {
  const { toggleCatalog, catalogOpen, current } = usePlayer();

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
      <nav className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-6">
        <Link
          to="/"
          className="justify-self-start font-display text-xs uppercase tracking-[0.3em] text-bone hover:text-accent md:text-sm md:tracking-[0.4em]"
        >
          Jadsynth
        </Link>
        <p className="max-w-[40vw] truncate text-center text-[0.65rem] uppercase tracking-[0.25em] text-bone/80 md:text-xs md:tracking-[0.3em]">
          {current.title}
        </p>
        <button
          onClick={toggleCatalog}
          aria-expanded={catalogOpen}
          className="justify-self-end text-[0.65rem] uppercase tracking-[0.25em] text-bone/70 hover:text-accent md:text-xs md:tracking-[0.3em]"
        >
          {catalogOpen ? "Close" : "Catalog"}
        </button>
      </nav>
    </header>
  );
}
