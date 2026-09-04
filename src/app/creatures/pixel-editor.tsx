"use client";

import { useCallback, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { PALETTE } from "./palette";

const GRID_SIZE = 16;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

// Mirrors the server-side check in api/creatures/submit/route.ts - this copy only saves a round
// trip for an obviously-invalid drawing (a solid block, or a couple of stray pixels); the API
// route is what actually enforces it.
const MIN_FILLED_PIXELS = 10;
const MIN_COLORS = 2;

const DEVICE_ID_KEY = "creature-device-id";

// There's no login here, so the submit route's per-visitor cap (2 creatures) is enforced against
// this anonymous id instead - generated once and kept in localStorage, so it survives reloads but
// not clearing storage or switching devices/browsers. That's a deliberate soft cap, not a real
// identity check.
function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // Storage blocked (private browsing, etc.) - fall back to a per-submit id rather than
    // failing outright. It just means the cap can't track this visitor across page loads.
    return crypto.randomUUID();
  }
}

export default function PixelEditor() {
  const [pixels, setPixels] = useState<(string | null)[]>(() => Array(CELL_COUNT).fill(null));
  const [color, setColor] = useState<string | null>(PALETTE[0]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");
  const paintingRef = useRef(false);

  // Reads whatever cell is under the pointer via elementFromPoint rather than per-cell
  // pointerenter handlers - touch drags keep pointer capture on the cell where the drag started,
  // so pointerenter never fires on the cells the finger moves over. This works the same for
  // mouse and touch.
  const paintAt = useCallback(
    (clientX: number, clientY: number) => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const index = el?.dataset.index;
      if (index === undefined) return;
      const i = Number(index);
      setPixels((prev) => {
        if (prev[i] === color) return prev;
        const next = prev.slice();
        next[i] = color;
        return next;
      });
    },
    [color]
  );

  function handlePointerDown(e: ReactPointerEvent) {
    paintingRef.current = true;
    paintAt(e.clientX, e.clientY);
  }
  function handlePointerMove(e: ReactPointerEvent) {
    if (!paintingRef.current) return;
    paintAt(e.clientX, e.clientY);
  }
  function stopPainting() {
    paintingRef.current = false;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const filled = pixels.filter((p): p is string => p !== null);
    if (filled.length === 0) {
      setError("Draw something first.");
      setStatus("error");
      return;
    }
    if (filled.length < MIN_FILLED_PIXELS) {
      setError("Draw a bit more before releasing it.");
      setStatus("error");
      return;
    }
    if (new Set(filled).size < MIN_COLORS) {
      setError("Use at least two colors - no solid-color blocks.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/creatures/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pixels, deviceId: getDeviceId() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      // A full navigation rather than router.push - the gallery is dynamic (fetches the latest
      // creatures on every request), but Next's client-side router can still serve an already-
      // cached RSC payload for a route visited earlier this session. Reloading the page
      // guarantees the just-submitted creature actually shows up instead of a stale gallery.
      window.location.href = "/creatures/gallery";
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-6">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopPainting}
        onPointerLeave={stopPainting}
        className="grid touch-none overflow-hidden rounded-lg border border-black/10 shadow-sm select-none"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, width: "min(90vw, 384px)", height: "min(90vw, 384px)" }}
      >
        {pixels.map((cell, i) => (
          <div key={i} data-index={i} style={{ backgroundColor: cell ?? "#ffffff" }} className="border border-black/5" />
        ))}
      </div>

      <p className="font-helvetica text-[11px] tracking-[0.04em] text-[#33322f]/70 uppercase">
        use at least two colors - no solid blocks
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Pick color ${c}`}
            style={{ backgroundColor: c }}
            className={`size-8 cursor-pointer rounded-full border-2 transition-transform hover:scale-110 ${
              color === c ? "scale-110 border-[#0e0e0d]" : "border-black/10"
            }`}
          />
        ))}
        <button
          type="button"
          onClick={() => setColor(null)}
          aria-label="Eraser"
          style={{ background: "repeating-conic-gradient(#d8d8d6 0% 25%, #ffffff 0% 50%) 50% / 8px 8px" }}
          className={`size-8 cursor-pointer rounded-full border-2 transition-transform hover:scale-110 ${
            color === null ? "scale-110 border-[#0e0e0d]" : "border-black/10"
          }`}
        />
        <button
          type="button"
          onClick={() => setPixels(Array(CELL_COUNT).fill(null))}
          className="font-helvetica cursor-pointer rounded-full border border-black/10 px-3 py-1.5 text-[11px] tracking-[0.06em] text-[#33322f] uppercase transition-transform hover:scale-105"
        >
          clear
        </button>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={1}
        maxLength={40}
        placeholder="Name your creature"
        className="font-helvetica w-full max-w-[320px] rounded-xl border border-black/10 bg-white px-4 py-3 text-center text-[15px] text-[#0e0e0d] outline-none transition-colors focus:border-[#ea34df]"
      />

      {status === "error" && <p className="font-helvetica text-[14px] text-[#c0326b]">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="font-helvetica cursor-pointer rounded-full bg-[#0e0e0d] px-6 py-3 text-[13px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-[1.02] disabled:opacity-50"
      >
        {status === "submitting" ? "Releasing..." : "Release into the wild"}
      </button>
    </form>
  );
}
