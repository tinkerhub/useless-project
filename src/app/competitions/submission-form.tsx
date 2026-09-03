"use client";

import { useState, type FormEvent } from "react";
import { CAMPUSES, type Competition } from "@/lib/competitions";

const INPUT_CLASS =
  "font-helvetica w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-[#0e0e0d] outline-none transition-colors focus:border-[#ea34df]";

export default function SubmissionForm({ competition }: { competition: Competition }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      slug: competition.slug,
      name: form.get("name"),
      campus: form.get("campus"),
      link: form.get("link"),
      notes: form.get("notes") || undefined,
    };

    try {
      const res = await fetch("/api/competitions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <div className="rounded-2xl border border-black/5 bg-[#244638]/5 p-6">
        <p className="font-nanum-pen text-[22px] leading-[1.3] text-[#244638]">Got it - thanks for submitting.</p>
        <p className="font-helvetica mt-1 text-[14px] text-[#33322f]">
          We review submissions after the hackathon, alongside the other results.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[440px] flex-col gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-xs">
      <label className="flex flex-col gap-1.5">
        <span className="font-helvetica text-[13px] tracking-[0.04em] text-[#33322f] uppercase">Your name</span>
        <input name="name" required minLength={2} maxLength={100} className={INPUT_CLASS} placeholder="Your name" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-helvetica text-[13px] tracking-[0.04em] text-[#33322f] uppercase">Campus</span>
        <select name="campus" required defaultValue="" className={INPUT_CLASS}>
          <option value="" disabled>
            Select your campus
          </option>
          {CAMPUSES.map((campus) => (
            <option key={campus} value={campus}>
              {campus}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-helvetica text-[13px] tracking-[0.04em] text-[#33322f] uppercase">{competition.linkLabel}</span>
        <input
          name="link"
          type="url"
          required
          className={INPUT_CLASS}
          placeholder={competition.linkPlaceholder}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-helvetica text-[13px] tracking-[0.04em] text-[#33322f] uppercase">
          Notes <span className="normal-case text-[#33322f]/50">(optional)</span>
        </span>
        <textarea name="notes" maxLength={500} rows={3} className={INPUT_CLASS} placeholder="Project name, team, anything we should know" />
      </label>

      {status === "error" && <p className="font-helvetica text-[14px] text-[#c0326b]">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="font-helvetica mt-1 rounded-full bg-[#0e0e0d] px-5 py-3 text-[13px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-[1.02] disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
