import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { type Track } from "~/lib/tracks";
import { usePlayer } from "~/lib/player-context";
import { useTrackDuration } from "~/lib/use-track-duration";
import { useIsMobile } from "~/lib/use-media-query";

const ARC_RADIUS_DESKTOP = 1200;
const ARC_RADIUS_MOBILE = 700;
const SLEEVE_HALF_DESKTOP = 176;
const SLEEVE_HALF_MOBILE = 96;
const HOVER_LIFT = 90;
const SPREAD_PUSH = 5;
const STAGGER = 0.07;
const VISIBLE_DESKTOP = 5;
const VISIBLE_MOBILE = 3;
const FAN_ANGLE_DESKTOP = 50;
const FAN_ANGLE_MOBILE = 38;
const STEP_DRAG_PX = 110;
const WHEEL_THROTTLE_MS = 220;

export function CatalogOverlay() {
  const { catalogOpen, closeCatalog, currentIndex, setIndex } = usePlayer();

  useEffect(() => {
    if (!catalogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCatalog();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [catalogOpen, closeCatalog]);

  return (
    <AnimatePresence>
      {catalogOpen && (
        <motion.div
          key="catalog-overlay"
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.85, ease: "easeOut" } }}
          transition={{ duration: 0.35 }}
        >
          <motion.button
            onClick={closeCatalog}
            aria-label="Close catalog"
            className="absolute inset-0 cursor-default"
            initial={{
              backdropFilter: "blur(0px)",
              WebkitBackdropFilter: "blur(0px)",
              backgroundColor: "rgba(10,10,10,0)",
            }}
            animate={{
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              backgroundColor: "rgba(10,10,10,0.7)",
            }}
            exit={{
              backdropFilter: "blur(0px)",
              WebkitBackdropFilter: "blur(0px)",
              backgroundColor: "rgba(10,10,10,0)",
              transition: { duration: 0.7, ease: "easeOut" },
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          <div className="pointer-events-none absolute inset-x-0 top-24 z-10 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-bone/40">
              Catalog
            </p>
            <h2 className="mt-2 text-4xl font-light tracking-tight md:text-6xl">
              The collection
            </h2>
          </div>

          <CatalogFan
            currentIndex={currentIndex}
            onSelect={(i) => {
              setIndex(i);
              closeCatalog();
            }}
          />

          <button
            onClick={closeCatalog}
            className="absolute right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full font-mono text-base text-bone/70 hover:text-bone md:right-6 md:top-6 md:h-auto md:w-auto md:rounded-none md:text-xs md:uppercase md:tracking-[0.3em] md:text-bone/60"
            aria-label="Close catalog"
          >
            <span className="md:hidden">✕</span>
            <span className="hidden md:inline">Close ✕</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CatalogFan({
  currentIndex,
  onSelect,
}: {
  currentIndex: number;
  onSelect: (i: number) => void;
}) {
  const { catalogOpen, tracks } = usePlayer();
  const isMobile = useIsMobile();
  const total = tracks.length;
  const visibleCount = Math.min(
    isMobile ? VISIBLE_MOBILE : VISIBLE_DESKTOP,
    total,
  );
  const fanAngle = isMobile ? FAN_ANGLE_MOBILE : FAN_ANGLE_DESKTOP;
  const arcRadius = isMobile ? ARC_RADIUS_MOBILE : ARC_RADIUS_DESKTOP;
  const sleeveHalf = isMobile ? SLEEVE_HALF_MOBILE : SLEEVE_HALF_DESKTOP;
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; lastStep: number } | null>(null);
  const lockedRef = useRef(false);
  const queuedRef = useRef(0);
  const STEP_LOCK_MS = 480;

  const step = (delta: number) => {
    if (delta === 0) return;
    if (lockedRef.current) {
      queuedRef.current += delta;
      return;
    }
    lockedRef.current = true;
    setDirection(delta > 0 ? 1 : -1);
    setOffset((o) => ((o + delta) % total + total) % total);
    window.setTimeout(() => {
      lockedRef.current = false;
      const queued = queuedRef.current;
      if (queued !== 0) {
        queuedRef.current = 0;
        step(queued);
      }
    }, STEP_LOCK_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const lastWheelRef = useRef(0);
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-catalog-carousel]")) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastWheelRef.current < WHEEL_THROTTLE_MS) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 8) return;
      lastWheelRef.current = now;
      step(delta > 0 ? 1 : -1);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, lastStep: 0 };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const want = Math.round(-dx / STEP_DRAG_PX);
    const diff = want - dragRef.current.lastStep;
    if (diff !== 0) {
      step(diff);
      dragRef.current.lastStep = want;
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = null;
  };

  const visible = catalogOpen
    ? Array.from({ length: visibleCount }, (_, slot) => {
        const trackIndex = (offset + slot) % total;
        return { track: tracks[trackIndex], slot, trackIndex };
      })
    : [];

  const effectiveDirection: 1 | -1 = catalogOpen ? direction : 1;

  return (
    <>
      <div
        data-catalog-carousel
        className="pointer-events-auto absolute inset-0 z-20 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div
        className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
        style={{ top: `calc(50vh + ${arcRadius - sleeveHalf}px)` }}
      >
        <div className="relative" style={{ width: 0, height: 0 }}>
          <AnimatePresence mode="popLayout" custom={effectiveDirection}>
            {visible.map(({ track, slot, trackIndex }) => {
              const t =
                visibleCount === 1 ? 0.5 : slot / (visibleCount - 1);
              const baseAngle = -fanAngle / 2 + t * fanAngle;

              const isHov = hovered === track.id;
              let restingAngle = baseAngle;
              if (hovered !== null && !isHov) {
                const hoveredSlot = visible.find(
                  (v) => v.track.id === hovered,
                )?.slot;
                if (hoveredSlot !== undefined) {
                  restingAngle =
                    baseAngle +
                    (slot < hoveredSlot ? -SPREAD_PUSH : SPREAD_PUSH);
                }
              }

              return (
                <FanSleeve
                  key={track.id}
                  track={track}
                  baseAngle={baseAngle}
                  restingAngle={restingAngle}
                  isHovered={isHov}
                  isActive={currentIndex === trackIndex}
                  onHover={() => setHovered(track.id)}
                  onLeave={() =>
                    setHovered((h) => (h === track.id ? null : h))
                  }
                  onSelect={() => onSelect(trackIndex)}
                  enterDelay={slot * STAGGER}
                  exitDelay={slot * (STAGGER * 0.6)}
                  direction={effectiveDirection}
                  arcRadius={arcRadius}
                  isMobile={isMobile}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous records"
        onClick={() => step(-1)}
        className="pointer-events-auto absolute left-3 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-2xl text-bone/70 backdrop-blur-md transition hover:border-white/30 hover:text-bone md:left-6 md:h-12 md:w-12 md:text-lg"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next records"
        onClick={() => step(1)}
        className="pointer-events-auto absolute right-3 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-2xl text-bone/70 backdrop-blur-md transition hover:border-white/30 hover:text-bone md:right-6 md:h-12 md:w-12 md:text-lg"
      >
        ›
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-10 z-30 flex justify-center">
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-bone/60 backdrop-blur-md">
          {String(offset + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </>
  );
}

function FanSleeve({
  track,
  baseAngle,
  restingAngle,
  isHovered,
  isActive,
  onHover,
  onLeave,
  onSelect,
  enterDelay,
  exitDelay,
  direction,
  arcRadius,
  isMobile,
}: {
  track: Track;
  baseAngle: number;
  restingAngle: number;
  isHovered: boolean;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
  onSelect: () => void;
  enterDelay: number;
  exitDelay: number;
  direction: 1 | -1;
  arcRadius: number;
  isMobile: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const duration = useTrackDuration(track.src, track.duration);

  const liftY = isHovered ? -HOVER_LIFT : 0;
  const hoverScale = isHovered ? 1.08 : 1;

  const interactiveTransition = {
    type: "spring" as const,
    stiffness: 200,
    damping: 24,
    mass: 0.7,
  };

  const mountTransition = {
    delay: enterDelay,
    type: "spring" as const,
    stiffness: 120,
    damping: 22,
    mass: 0.9,
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "calc(100vw + 200px)" : "calc(-100vw - 200px)",
      y: -arcRadius,
      rotate: baseAngle + 24 * dir,
      opacity: 0,
      scale: 0.88,
    }),
    show: {
      x: "-50%",
      y: -arcRadius,
      rotate: restingAngle,
      opacity: 1,
      scale: 1,
      zIndex: isHovered ? 100 : 10,
    },
    leave: (dir: number) => ({
      x: dir > 0 ? "calc(-100vw - 200px)" : "calc(100vw + 200px)",
      y: -arcRadius,
      rotate: baseAngle - 24 * dir,
      scale: 0.88,
      opacity: 0,
      transition: {
        delay: exitDelay,
        duration: 0.5,
        ease: [0.5, 0, 0.75, 0] as [number, number, number, number],
      },
    }),
  };

  return (
    <motion.button
      type="button"
      custom={direction}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={onSelect}
      onAnimationComplete={() => {
        if (!mounted) setMounted(true);
      }}
      className="pointer-events-auto absolute left-0 top-0 aspect-square w-44 focus:outline-none sm:w-56 md:w-72 lg:w-[22rem]"
      style={{ transformOrigin: `50% ${arcRadius}px` }}
      variants={variants}
      initial="enter"
      animate="show"
      exit="leave"
      transition={mounted ? interactiveTransition : mountTransition}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          x: isHovered ? "32%" : "4%",
          y: liftY,
          scale: hoverScale,
          rotate: isHovered ? 8 : 0,
        }}
        transition={interactiveTransition}
        style={{ zIndex: 0 }}
        aria-hidden
      >
        <div
          className="absolute inset-0 rounded-full shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-black/80"
          style={{
            backgroundColor: "#0a0a0a",
            backgroundImage: `radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 6%), repeating-radial-gradient(circle at center, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px), linear-gradient(135deg, #1a1a1a, #000000 60%)`,
          }}
        />
        {track.artworkSrc && (
          <div
            className="pointer-events-none absolute inset-[6%] overflow-hidden rounded-full"
            style={{
              backgroundImage: `url(${track.artworkSrc})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "grayscale(0.5) brightness(0.85) contrast(1.05)",
              mixBlendMode: "screen",
              opacity: 0.55,
              WebkitMaskImage:
                "radial-gradient(circle, transparent 0%, transparent 36%, black 38%, black 92%, transparent 96%)",
              maskImage:
                "radial-gradient(circle, transparent 0%, transparent 36%, black 38%, black 92%, transparent 96%)",
            }}
            aria-hidden
          />
        )}
        <div
          className="absolute left-1/2 top-1/2 aspect-square w-[34%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ring-1 ring-black/40"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${track.cover.accent}, ${track.cover.from})`,
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black/80">
            <span
              className="font-display text-[8%] uppercase leading-none"
              style={{ fontSize: "1.25rem", letterSpacing: "0.05em" }}
            >
              {track.title.length > 14
                ? track.title.slice(0, 14) + "…"
                : track.title}
            </span>
            <span className="mt-1 font-mono text-[0.55rem] uppercase tracking-[0.25em] opacity-70">
              {track.id}
            </span>
          </div>
          <div className="absolute left-1/2 top-1/2 z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-1 ring-bone/30" />
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 overflow-hidden rounded-sm shadow-[0_40px_80px_-20px_rgba(0,0,0,0.95)] ring-1 ring-bone/10"
        style={{
          background: `linear-gradient(135deg, ${track.cover.from}, ${track.cover.to})`,
          zIndex: 1,
        }}
        animate={{ y: liftY, scale: hoverScale }}
        transition={interactiveTransition}
      >
        {track.artworkSrc && (
          <img
            src={track.artworkSrc}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            aria-hidden
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent 0 6px, rgba(255,255,255,0.5) 6px 7px)",
          }}
          aria-hidden
        />
        {track.artworkSrc && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.75) 100%)",
            }}
            aria-hidden
          />
        )}

        <div className="absolute inset-0 flex flex-col justify-between p-7">
          <div className="flex items-start justify-between">
            <span
              className="font-mono text-xs uppercase tracking-[0.3em]"
              style={{ color: track.cover.accent }}
            >
              {track.id}
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-widest tabular-nums text-bone/40">
              {duration}
            </span>
          </div>

          <div>
            <p
              className="text-2xl font-medium leading-tight"
              style={{ color: track.cover.accent }}
            >
              {track.title}
            </p>
            <p className="mt-2 text-[0.7rem] uppercase tracking-[0.3em] text-bone/40">
              {track.album}
            </p>
          </div>
        </div>

        {isActive && (
          <div
            className="pointer-events-none absolute left-3 top-3 h-2 w-2 rounded-full"
            style={{
              backgroundColor: track.cover.accent,
              boxShadow: `0 0 12px ${track.cover.accent}`,
            }}
            aria-hidden
          />
        )}
      </motion.div>

      <span className="sr-only">Play {track.title}</span>
    </motion.button>
  );
}
