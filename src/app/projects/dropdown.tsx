"use client";

import { useEffect, useRef, useState } from "react";

// A styled stand-in for a native <select> - the OS-drawn dropdown/arrow doesn't match anything
// else on the site, and can't be restyled directly. Same open/close-on-outside-click/Escape
// pattern as the site nav's own menu panel.
export default function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`font-helvetica flex cursor-pointer items-center gap-1 rounded-full border bg-white px-2.5 py-1.5 text-[10px] tracking-[0.05em] text-[#33322f] uppercase shadow-xs transition-colors sm:gap-1.5 sm:px-4 sm:py-2 sm:text-[12px] sm:tracking-[0.06em] ${
          open ? "border-[#ea34df]" : "border-black/10 hover:border-[#ea34df]/40"
        }`}
      >
        <span className="text-[#33322f]/45">{label}</span>
        <span className="max-w-[100px] truncate sm:max-w-[150px]">{current?.label ?? value}</span>
        <svg
          viewBox="0 0 24 24"
          width="9"
          height="9"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-[#33322f]/50 transition-transform duration-200 sm:size-2.5 ${open ? "-rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="animate-nav-pop absolute top-full left-0 z-20 mt-2 max-h-64 w-max min-w-full overflow-y-auto rounded-xl border border-black/10 bg-white py-1.5 shadow-lg"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`font-helvetica block w-full cursor-pointer text-nowrap px-3 py-1.5 text-left text-[11px] tracking-[0.04em] uppercase transition-colors hover:bg-black/5 sm:px-4 sm:py-2 sm:text-[12px] ${
                  opt.value === value ? "text-[#ea34df]" : "text-[#33322f]"
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
