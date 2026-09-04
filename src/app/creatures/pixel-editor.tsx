"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { PALETTE } from "./palette";

const GRID_SIZE = 16;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

export default function PixelEditor() {
  const [pixels, setPixels] = useState<(string | null)[]>(() => Array(CELL_COUNT).fill(null));
  const [color, setColor] = useState<string | null>(PALETTE[0]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
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
    if (pixels.every((p) => p === null)) {
      setError("Draw something first.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setError("");

    try {
      const res = await fetch("/api/creatures/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pixels }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/5 bg-[#244638]/5 p-6 text-center">
        <p className="font-nanum-pen text-[22px] leading-[1.3] text-[#244638]">Your creature is loose in the wild.</p>
        <Link
          href="/creatures/gallery"
          className="font-helvetica rounded-full bg-[#0e0e0d] px-5 py-2.5 text-[13px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-105"
        >
          See the gallery
        </Link>
      </div>
    );
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
