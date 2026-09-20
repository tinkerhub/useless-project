"use client";

import { useEffect, useState } from "react";

function statusText(deadline: string): string | null {
  const deadlineDay = new Date(deadline);
  deadlineDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((deadlineDay.getTime() - today.getTime()) / 86_400_000);
  const formatted = deadlineDay.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  if (diffDays > 1) return `Submissions close ${formatted} - ${diffDays} days left.`;
  if (diffDays === 1) return `Submissions close tomorrow, ${formatted}.`;
  if (diffDays === 0) return `Submissions close today, ${formatted}!`;
  return "Submissions are closed.";
}

// Reads the clock on the visitor's own device, so it can only be computed once mounted - the
// server has no idea what "today" means to whoever's browser is loading the page. `deadline` is
// the earliest date any competition on this page still has, passed in as an ISO string from the
// server component so this file doesn't need to import/parse the whole COMPETITIONS list itself.
export default function DeadlineBanner({ deadline }: { deadline: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [text, setText] = useState<string | null>(null);

  // Computed in an effect, not read straight into useState's initializer - this page is server
  // rendered, so a value derived from "today" has to wait for the client's own clock rather than
  // risk baking the server's idea of today into the HTML and mismatching on hydration.
  useEffect(() => {
    setText(statusText(deadline));
  }, [deadline]);

  if (!text || dismissed) return null;

  return (
    <div className="font-helvetica flex w-full items-center justify-between gap-3 rounded-lg bg-[#ea34df] px-4 py-2.5 text-[12px] font-bold text-white sm:text-[13px]">
      <span>{text}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-[16px] leading-none opacity-80 transition-opacity hover:opacity-100"
      >
        &times;
      </button>
    </div>
  );
}
