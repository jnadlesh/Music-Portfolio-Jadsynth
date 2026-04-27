import { useEffect, useMemo, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type MotionValue,
} from "motion/react";
import { usePlayer } from "~/lib/player-context";
import { TrackTimer } from "./TrackTimer";

const BASE_RPM = 20;
const FRICTION = 0.96;

export function Vinyl() {
  const { setRate, current, toggle, isPlaying, rateLockRef } = usePlayer();
  const rotation = useMotionValue(0);
  const speed = useMotionValue(1);
  const dragRef = useRef<{
    active: boolean;
    lastAngle: number;
    lastTime: number;
  }>({
    active: false,
    lastAngle: 0,
    lastTime: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const labelHue = useTransform(speed, [0.25, 1, 2.5], [20, 35, 5]);
  const labelBg = useTransform(
    labelHue,
    (h) =>
      `radial-gradient(circle at 30% 30%, hsl(${h} 60% 55%), hsl(${h} 70% 25%))`,
  );

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const s = speed.get();
      const degPerSec = BASE_RPM * 6 * s;
      rotation.set(rotation.get() + degPerSec * dt);

      if (!dragRef.current.active) {
        const target = isPlaying ? 1 : 0;
        const next = s + (target - s) * Math.min(1, dt * 2);
        speed.set(next * FRICTION + target * (1 - FRICTION));
      }

      if (!rateLockRef.current) {
        setRate(Math.max(0.07, Math.min(2.5, Math.abs(speed.get()) || 0.07)));
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, rotation, setRate, speed, rateLockRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      const target = Math.max(0.25, Math.min(2.5, speed.get() + delta));
      animate(speed, target, { duration: 0.4, ease: "easeOut" });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [speed]);

  const onPointerDown = (e: React.PointerEvent) => {
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    rateLockRef.current = false;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    dragRef.current = {
      active: true,
      lastAngle: angle,
      lastTime: performance.now(),
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    let delta = angle - dragRef.current.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const now = performance.now();
    const dt = Math.max(1, now - dragRef.current.lastTime) / 1000;
    const degPerSec = delta / dt;
    const newSpeed = degPerSec / (BASE_RPM * 6);

    speed.set(Math.max(-2.5, Math.min(2.5, newSpeed)));
    rotation.set(rotation.get() + delta);

    dragRef.current.lastAngle = angle;
    dragRef.current.lastTime = now;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const el = containerRef.current;
    el?.releasePointerCapture(e.pointerId);
    dragRef.current.active = false;
  };

  const motionStyle = useMemo(
    () => ({ rotate: rotation, touchAction: "none" as const }),
    [rotation],
  );

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={toggle}
        style={motionStyle}
        className="relative aspect-square w-[min(80vmin,640px)] cursor-grab select-none rounded-full bg-black active:cursor-grabbing"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-900 via-black to-zinc-950 shadow-[0_0_120px_rgba(0,0,0,0.8)]" />
        <div className="vinyl-grooves absolute inset-2 rounded-full" />

        {current.artworkSrc && (
          <div
            className="pointer-events-none absolute inset-[6%] overflow-hidden rounded-full"
            style={{
              backgroundImage: `url(${current.artworkSrc})`,
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

        <motion.div
          style={{ background: labelBg }}
          className="absolute inset-[34%] overflow-hidden rounded-full shadow-inner ring-1 ring-black/40"
        >
          <RecordLabel
            title={current.title}
            id={current.id}
            album={current.album}
            accent={current.cover.accent}
          />
        </motion.div>

        <div className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-1 ring-bone/30" />
      </motion.div>

      <TrackTimer />
      <SpeedReadout speed={speed} />
    </div>
  );
}

function RecordLabel({
  title,
  id,
  album,
  accent,
}: {
  title: string;
  id: string;
  album: string;
  accent: string;
}) {
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <path
            id="label-arc-top"
            d="M 12,50 A 38,38 0 0,1 88,50"
            fill="none"
          />
          <path
            id="label-arc-bottom"
            d="M 88,50 A 38,38 0 0,1 12,50"
            fill="none"
          />
        </defs>
        <text
          fill="rgba(0,0,0,0.7)"
          fontSize="4.2"
          letterSpacing="2.4"
          fontFamily="ui-monospace, monospace"
        >
          <textPath href="#label-arc-top" startOffset="50%" textAnchor="middle">
            JADSYNTH RECORDS
          </textPath>
        </text>
        <text
          fill="rgba(0,0,0,0.55)"
          fontSize="3.4"
          letterSpacing="2.2"
          fontFamily="ui-monospace, monospace"
        >
          <textPath
            href="#label-arc-bottom"
            startOffset="50%"
            textAnchor="middle"
          >
            LONG PLAYING · HIGH FIDELITY
          </textPath>
        </text>
      </svg>

      <div className="absolute inset-x-0 top-[28%] flex flex-col items-center text-center">
        <span
          className="font-display text-[0.62rem] uppercase tracking-[0.14em] leading-tight text-black/85"
          style={{ maxWidth: "78%" }}
        >
          {title}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-[30%] flex flex-col items-center text-center">
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.25em] text-black/60">
          {album} · {id}
        </span>
        <span
          className="mt-1 inline-block rounded-sm px-1 font-mono text-[0.45rem] uppercase tracking-[0.3em]"
          style={{
            color: accent,
            background: "rgba(0,0,0,0.7)",
          }}
        >
          Side A
        </span>
      </div>
    </div>
  );
}

function SpeedReadout({ speed }: { speed: MotionValue<number> }) {
  const display = useTransform(speed, (s) => `${s.toFixed(2)}×`);
  return (
    <div className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-bone/50">
      <motion.span>{display}</motion.span>
    </div>
  );
}
