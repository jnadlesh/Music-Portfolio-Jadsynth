import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "~/lib/player-context";

const MIN_ANGLE = -135;
const MAX_ANGLE = 135;
const DRAG_RANGE_PX = 160;

function volumeToAngle(v: number): number {
  return MIN_ANGLE + v * (MAX_ANGLE - MIN_ANGLE);
}

export function VolumeKnob() {
  const { volume, setVolume } = usePlayer();
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startVol: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { startY: e.clientY, startVol: volume };
      setDragging(true);
    },
    [volume],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const dy = dragRef.current.startY - e.clientY;
      const next = dragRef.current.startVol + dy / DRAG_RANGE_PX;
      setVolume(next);
    },
    [setVolume],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      dragRef.current = null;
      setDragging(false);
    },
    [],
  );

  const onDoubleClick = useCallback(() => setVolume(0.8), [setVolume]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest?.("[data-volume-knob]")) return;
      e.preventDefault();
      setVolume(volume - Math.sign(e.deltaY) * 0.05);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [volume, setVolume]);

  const angle = volumeToAngle(volume);
  const muted = volume === 0;

  return (
    <div className="flex items-center gap-2" title={`Volume ${Math.round(volume * 100)}%`}>
      <div
        data-volume-knob
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(volume * 100)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            e.preventDefault();
            setVolume(volume + 0.05);
          } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            e.preventDefault();
            setVolume(volume - 0.05);
          }
        }}
        className={`relative h-9 w-9 cursor-grab touch-none select-none rounded-full border border-bone/20 bg-ink/80 shadow-inner shadow-black/60 transition-colors hover:border-bone/40 ${
          dragging ? "cursor-grabbing border-accent/60" : ""
        } ${muted ? "opacity-50" : ""}`}
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(0,0,0,0.6) 70%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `rotate(${angle}deg)`, transition: dragging ? "none" : "transform 80ms ease-out" }}
        >
          <span
            className="absolute left-1/2 top-1 h-2 w-[2px] -translate-x-1/2 rounded-full bg-bone/80"
            aria-hidden
          />
        </div>
        <div
          className="pointer-events-none absolute -inset-1 rounded-full"
          style={{
            background: `conic-gradient(from -135deg, rgba(212,165,116,0.5) 0deg, rgba(212,165,116,0.5) ${
              volume * 270
            }deg, transparent ${volume * 270}deg 360deg)`,
            mask: "radial-gradient(circle, transparent 60%, black 62%, black 70%, transparent 72%)",
            WebkitMask:
              "radial-gradient(circle, transparent 60%, black 62%, black 70%, transparent 72%)",
          }}
          aria-hidden
        />
      </div>
      <span className="font-mono text-[0.6rem] uppercase tracking-widest text-bone/40 tabular-nums">
        {Math.round(volume * 100)}
      </span>
    </div>
  );
}
