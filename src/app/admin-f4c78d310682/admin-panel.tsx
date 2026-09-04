"use client";

import { useEffect, useState } from "react";
import type { Creature } from "@/lib/creatures";

export default function AdminPanel() {
  const [creatures, setCreatures] = useState<Creature[] | null>(null);
  const [closed, setClosed] = useState<boolean | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingClosed, setTogglingClosed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/creatures")
      .then((res) => res.json())
      .then((data) => setCreatures(data.creatures ?? []))
      .catch(() => setError("Couldn't load creatures."));
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => setClosed(Boolean(data.closed)))
      .catch(() => setError("Couldn't load settings."));
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
          <ul className="grid grid-cols-1 gap-6 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
            {creatures.map((creature) => (
              <li key={creature.id} className="flex flex-col gap-2 rounded-xl border border-black/10 p-3">
                <div
                  className="grid overflow-hidden rounded-lg border border-black/10"
                  style={{ gridTemplateColumns: `repeat(16, 1fr)`, width: "100%", aspectRatio: "1 / 1" }}
                >
                  {creature.pixels.map((cell, i) => (
                    <div key={i} style={{ backgroundColor: cell ?? "#ffffff" }} />
                  ))}
                </div>
                <span className="font-nanum-pen truncate text-[15px] text-[#0e0e0d]" title={creature.name}>
                  {creature.name}
                </span>
                <span className="font-helvetica text-[11px] text-[#33322f]/60">
                  {new Date(creature.createdAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(creature.id)}
                  disabled={deletingId === creature.id}
                  className="font-helvetica cursor-pointer rounded-full border border-[#c0326b]/30 px-3 py-1.5 text-[11px] tracking-[0.06em] text-[#c0326b] uppercase transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {deletingId === creature.id ? "Deleting..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
