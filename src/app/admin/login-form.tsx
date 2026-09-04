"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Couldn't reach the server.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[320px] flex-col gap-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
        placeholder="Admin password"
        className="font-helvetica w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-[#0e0e0d] outline-none transition-colors focus:border-[#ea34df]"
      />
      {error && <p className="font-helvetica text-[13px] text-[#c0326b]">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="font-helvetica cursor-pointer rounded-full bg-[#0e0e0d] px-6 py-3 text-[13px] tracking-[0.08em] text-white uppercase transition-transform hover:scale-[1.02] disabled:opacity-50"
      >
        {submitting ? "Checking..." : "Log in"}
      </button>
    </form>
  );
}
