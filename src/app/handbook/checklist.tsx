"use client";

import { useEffect, useState } from "react";

type ChecklistGroup = {
  title: string;
  items: string[];
};

// Ticked items persist in localStorage, keyed by section + item text, so the same set of boxes
// stays checked across refreshes and future visits instead of resetting every load. Scoped under
// a single storageKey so a second widget elsewhere on the page could never collide with this one.
export default function ChecklistWidget({ storageKey, groups }: { storageKey: string; groups: ChecklistGroup[] }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  // Starts empty on the server and every first client render (avoids a hydration mismatch), then
  // fills in from localStorage right after mount - a one-frame flash of unchecked boxes is a fair
  // trade for not fighting SSR over content only the browser actually has.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setChecked(JSON.parse(saved));
    } catch {
      // localStorage can be unavailable (private mode, disabled storage) - a blank checklist is
      // fine, it just won't remember ticks between visits.
    }
    setHydrated(true);
  }, [storageKey]);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Same as above - saving is best-effort.
      }
      return next;
    });
  }

  const allItems = groups.flatMap((group) => group.items.map((item) => `${group.title}:${item}`));
  const doneCount = hydrated ? allItems.filter((key) => checked[key]).length : 0;

  return (
    // The full README checklist runs to four groups and a dozen items - too much to hold open
    // on the side at any normal viewport width without it covering the page copy. So every size
    // gets the same collapsed-tab pattern: a slim edge tab that sits clear of the content until
    // tapped, then opens a scrollable panel and closes back down on tap-again or backdrop-click.
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="font-helvetica fixed top-1/2 right-0 z-40 -translate-y-1/2 border border-r-0 border-black/10 bg-[#0e0e0d] px-2 py-4 text-[12px] tracking-[0.06em] text-white uppercase shadow-lg [writing-mode:vertical-rl]"
      >
        checklist {doneCount}/{allItems.length}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="fixed top-1/2 right-0 z-40 max-h-[80vh] w-[320px] -translate-y-1/2 overflow-y-auto border border-r-0 border-black/10 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="font-nanum-pen text-[21px] leading-[1] text-[#0e0e0d]">checklist</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close checklist"
                className="font-helvetica -m-1 shrink-0 rounded-full p-1 text-[16px] text-[#33322f]/50 transition-colors hover:text-[#0e0e0d]"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <div key={group.title} className="flex flex-col gap-2.5">
                  <p className="font-helvetica text-[11px] font-bold tracking-[0.09em] text-[#33322f]/45 uppercase">
                    {group.title}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {group.items.map((item) => {
                      const key = `${group.title}:${item}`;
                      const isChecked = hydrated && !!checked[key];
                      return (
                        <li key={key}>
                          <label className="flex cursor-pointer items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggle(key)}
                              className="mt-[3px] size-4 shrink-0 rounded-[3px] border-black/30 accent-[#0e0e0d]"
                            />
                            <span
                              className={`font-helvetica text-[13px] leading-[1.55] ${
                                isChecked ? "text-[#33322f]/40 line-through" : "text-[#33322f]"
                              }`}
                            >
                              {item}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
