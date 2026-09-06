"use client";

import { useEffect, useState } from "react";
import type { Creature } from "@/lib/creatures";
import type { HitReport } from "@/lib/hits";

export default function AdminPanel() {
  const [creatures, setCreatures] = useState<Creature[] | null>(null);
  const [closed, setClosed] = useState<boolean | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingClosed, setTogglingClosed] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const [hitReport, setHitReport] = useState<HitReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/creatures")
      .then((res) => res.json())
      .then((data) => setCreatures(data.creatures ?? []))
      .catch(() => setError("Couldn't load creatures."));
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setClosed(Boolean(data.closed));
        setSavedMessage(data.bigMessage ?? null);
        setMessageDraft(data.bigMessage ?? "");
      })
      .catch(() => setError("Couldn't load settings."));
    // Failing quietly here (no setError) on purpose - traffic numbers are a nice-to-have, not
    // worth surfacing an error banner over if the blob store hiccups.
    fetch("/api/admin/hits")
      .then((res) => res.json())
      .then((data) => setHitReport(data))
      .catch(() => {});
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this creature for good?")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/creatures/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `Couldn't delete that creature (${res.status}).`);
        return;
      }
      setCreatures((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleClosed() {
    if (closed === null) return;
    const next = !closed;
    setTogglingClosed(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closed: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `Couldn't update that setting (${res.status}).`);
        return;
      }
      setClosed(next);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setTogglingClosed(false);
    }
  }

  async function handleSaveMessage(message: string | null) {
    setSavingMessage(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bigMessage: message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `Couldn't update that setting (${res.status}).`);
        return;
      }
      setSavedMessage(message);
      setMessageDraft(message ?? "");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSavingMessage(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 p-5">
        <div>
          <p className="font-helvetica text-[14px] font-bold text-[#0e0e0d]">Creature submissions</p>
          <p className="font-helvetica text-[13px] text-[#33322f]/70">
            {closed === null ? "Loading..." : closed ? "Currently closed - the drawing form is hidden." : "Currently open."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleClosed}
            disabled={closed === null || togglingClosed}
            className="font-helvetica cursor-pointer rounded-full bg-[#0e0e0d] px-5 py-2.5 text-[12px] tracking-[0.06em] text-white uppercase transition-transform hover:scale-105 disabled:opacity-50"
          >
            {closed ? "Reopen entries" : "Stop taking entries"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="font-helvetica cursor-pointer rounded-full border border-black/10 px-5 py-2.5 text-[12px] tracking-[0.06em] text-[#33322f] uppercase transition-transform hover:scale-105"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 p-5">
        <div>
          <p className="font-helvetica text-[14px] font-bold text-[#0e0e0d]">Gallery announcement</p>
          <p className="font-helvetica text-[13px] text-[#33322f]/70">
            {savedMessage ? "Currently showing over the gallery." : "Nothing showing right now."}
          </p>
        </div>
        <textarea
          value={messageDraft}
          onChange={(e) => setMessageDraft(e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="e.g. Judging starts in 10 minutes at the main stage"
          className="font-helvetica w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-[14px] text-[#0e0e0d] outline-none transition-colors focus:border-[#ea34df]"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSaveMessage(messageDraft)}
            disabled={savingMessage || messageDraft.trim() === (savedMessage ?? "")}
            className="font-helvetica cursor-pointer rounded-full bg-[#0e0e0d] px-5 py-2.5 text-[12px] tracking-[0.06em] text-white uppercase transition-transform hover:scale-105 disabled:opacity-50"
          >
            {savingMessage ? "Saving..." : "Show on gallery"}
          </button>
          {savedMessage && (
            <button
              type="button"
              onClick={() => handleSaveMessage(null)}
              disabled={savingMessage}
              className="font-helvetica cursor-pointer rounded-full border border-black/10 px-5 py-2.5 text-[12px] tracking-[0.06em] text-[#33322f] uppercase transition-transform hover:scale-105 disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-black/10 p-5">
        <div>
          <p className="font-helvetica text-[14px] font-bold text-[#0e0e0d]">Gallery traffic</p>
          <p className="font-helvetica text-[13px] text-[#33322f]/70">
            Counts times the gallery poll actually reached the server - many tabs polling at once often share
            one cached answer, so this runs lower than the true number of visitors.
          </p>
        </div>
        {hitReport === null ? (
          <p className="font-helvetica text-[14px] text-[#33322f]/70">Loading...</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="font-helvetica text-[22px] font-bold text-[#0e0e0d]">{hitReport.totalLast24h}</p>
                <p className="font-helvetica text-[12px] text-[#33322f]/70">last 24h</p>
              </div>
              <div>
                <p className="font-helvetica text-[22px] font-bold text-[#0e0e0d]">{hitReport.totalLast7d}</p>
                <p className="font-helvetica text-[12px] text-[#33322f]/70">last 7d</p>
              </div>
            </div>
            {hitReport.daily.length > 0 && (
              <ul className="font-helvetica flex flex-col gap-1 text-[13px] text-[#33322f]">
                {hitReport.daily.slice(0, 7).map(({ day, count }) => (
                  <li key={day} className="flex justify-between border-b border-black/5 py-1 last:border-0">
                    <span>{day}</span>
                    <span className="font-bold text-[#0e0e0d]">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {error && <p className="font-helvetica text-[13px] text-[#c0326b]">{error}</p>}

      <div className="flex flex-col gap-4">
        <p className="font-helvetica text-[14px] font-bold text-[#0e0e0d]">
          Creatures {creatures ? `(${creatures.length})` : ""}
        </p>
        {creatures === null ? (
          <p className="font-helvetica text-[14px] text-[#33322f]/70">Loading...</p>
        ) : creatures.length === 0 ? (
          <p className="font-helvetica text-[14px] text-[#33322f]/70">Nothing here yet.</p>
        ) : (
          // Dense auto-fill grid rather than the previous one-tall-card-per-row list - a small
          // thumbnail plus a hover-only delete overlay is enough to moderate by, and packing many
          // tiles per row means scanning hundreds of creatures doesn't mean hundreds of scrolls.
          <ul className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(96px,1fr))]">
            {creatures.map((creature) => (
              <li key={creature.id} className="group relative">
                <div
                  className="grid overflow-hidden rounded-lg border border-black/10"
                  style={{ gridTemplateColumns: `repeat(16, 1fr)`, width: "100%", aspectRatio: "1 / 1" }}
                  title={`${creature.name} — ${new Date(creature.createdAt).toLocaleString()}`}
                >
                  {creature.pixels.map((cell, i) => (
                    <div key={i} style={{ backgroundColor: cell ?? "#ffffff" }} />
                  ))}
                </div>
                <span className="font-nanum-pen mt-1 block truncate text-center text-[12px] text-[#0e0e0d]">
                  {creature.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(creature.id)}
                  disabled={deletingId === creature.id}
                  aria-label={`Delete ${creature.name}`}
                  className="font-helvetica absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-[#c0326b] text-[13px] leading-none text-white opacity-70 shadow transition-opacity group-hover:opacity-100"
                >
                  {deletingId === creature.id ? "…" : "×"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
