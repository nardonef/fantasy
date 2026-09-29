"use client";

import { useEffect, useRef, useState } from "react";
import type { Source } from "@/lib/subscribe";

type Status = "idle" | "loading" | "success" | "error";

export function EmailCapture({ source = "hero", id }: { source?: Source; id?: string }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>();
  const [tag, setTag] = useState<Source>(source);
  const inFlight = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onTag = (e: Event) => {
      setTag((e as CustomEvent<Source>).detail);
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("fantasy:source", onTag);
    return () => window.removeEventListener("fantasy:source", onTag);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("loading");
    setError(undefined);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: tag, company }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) { setStatus("success"); return; }
      setError(data.error ?? "Something broke on our end. Try again.");
      setStatus("error");
    } catch {
      setError("Couldn't reach the server. Try again.");
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }

  if (status === "success") {
    return (
      <div id={id} className="flex h-14 max-w-[460px] items-center gap-3 rounded-[9px] border border-[#5B8CFF66] bg-[#1C1F33] px-[18px] text-[15px]">
        <span className="size-2 rounded-full bg-wrapped" aria-hidden />
        You&apos;re on the list. We&apos;ll keep it brief.
      </div>
    );
  }

  return (
    <form id={id} onSubmit={onSubmit} className="max-w-[460px]">
      <div className="flex h-14">
        <input
          ref={inputRef}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourleague.com"
          aria-label="Email address"
          aria-invalid={status === "error"}
          aria-describedby="email-helper"
          className={`min-w-0 flex-1 rounded-l-[9px] border border-r-0 bg-input-bg px-[18px] font-mono text-[15px] text-[#F4F4F7] outline-none placeholder:text-[#4A4A58] focus:border-wrapped ${status === "error" ? "!border-regret" : "border-input-border"}`}
        />
        <input
          type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden
          value={company} onChange={(e) => setCompany(e.target.value)}
          className="absolute -left-[9999px] size-0 opacity-0"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-[130px] rounded-r-[9px] bg-wrapped font-mono text-xs font-medium uppercase tracking-[0.18em] text-[#0B0B12] transition-colors hover:bg-signal-hover disabled:opacity-70"
        >
          {status === "loading" ? "…" : "Get access"}
        </button>
      </div>
      <p id="email-helper" role={status === "error" ? "alert" : undefined} className={`mt-3 text-[13px] ${status === "error" ? "text-regret" : "text-[#5D5D6B]"}`}>
        {status === "error" ? error : "We'll email less often than you check waivers."}
      </p>
    </form>
  );
}
