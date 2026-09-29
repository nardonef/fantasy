"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

export const CARD_MS = 4000;
const TICK_MS = 100;

const CARDS = [
  { theme: "dark", kicker: "BENCH REGRET", kickerColor: "#FF4A31", stat: "4-10", statColor: "#FAFAFA",
    headline: "Six wins, still on your bench.",
    body: "Start the right players and you go 10-4. The roster was never the problem.",
    footer: "FANTASY·WRAPPED — 2025" },
  { theme: "dark", kicker: "WAIVER STEAL · WEEK 3", kickerColor: "#5B8CFF", stat: "245.6", statColor: "#5B8CFF",
    headline: "Everyone else scrolled past Drake Maye.",
    body: "Points after you claimed him. Free.",
    footer: "FANTASY·WRAPPED — 2025" },
  { theme: "paper", kicker: "YOUR ARCHETYPE", kickerColor: "#2148D8", stat: null, statColor: "",
    headline: "The Saboteur",
    body: "504.6 points died on your bench and 6 losses were already wins. Nobody in this league beat you like you did.",
    footer: "SCREENSHOT THIS →" },
] as const;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener?.("change", onChange);
  return () => mq.removeEventListener?.("change", onChange);
}

function useReducedMotionPref() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

export function StoryCardStack() {
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const reduced = useReducedMotionPref();
  const contentId = useId();
  // Timer state lives in refs so the single interval always reads live values
  // and no setState is called from inside an updater (StrictMode double-invokes updaters).
  const elapsedRef = useRef(0);
  const hoveredRef = useRef(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useEffect(() => {
    const t = setInterval(() => {
      if (hoveredRef.current || reducedRef.current || document.hidden) return;
      elapsedRef.current += TICK_MS;
      if (elapsedRef.current >= CARD_MS) {
        elapsedRef.current = 0;
        setIndex((i) => (i + 1) % CARDS.length);
      }
      setElapsed(elapsedRef.current);
    }, TICK_MS);
    return () => clearInterval(t);
  }, []);

  function advance() {
    elapsedRef.current = 0;
    setElapsed(0);
    setIndex((i) => (i + 1) % CARDS.length);
  }

  const card = CARDS[index];
  const paper = card.theme === "paper";
  return (
    <div className="relative mx-auto aspect-[9/16] w-[min(340px,80vw)]">
      <div aria-hidden className="absolute inset-0 rounded-[26px] bg-raised" style={{ transform: "rotate(6deg) translate(34px, 8px)" }} />
      <div aria-hidden className="absolute inset-0 rounded-[26px] bg-raised-2" style={{ transform: "rotate(-4deg) translate(-26px, 4px)" }} />
      <button
        type="button"
        aria-label="Next story card"
        data-active-index={index}
        onClick={advance}
        aria-describedby={contentId}
        onPointerEnter={(e) => { if (e.pointerType !== "touch") hoveredRef.current = true; }}
        onPointerLeave={(e) => { if (e.pointerType !== "touch") hoveredRef.current = false; }}
        onFocus={() => { hoveredRef.current = true; }}
        onBlur={() => { hoveredRef.current = false; }}
        className={`relative flex size-full cursor-pointer flex-col justify-between overflow-hidden rounded-[26px] px-7 pb-7 pt-14 text-left shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ${paper ? "bg-chalk text-field" : "bg-field text-chalk"}`}
      >
        <div className="absolute inset-x-[18px] top-[18px] flex gap-[5px]" aria-hidden>
          {CARDS.map((_, i) => (
            <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: paper ? "#0A0A0B22" : "#FFFFFF33" }}>
              <div
                className="h-full origin-left"
                style={{
                  background: paper ? "#0A0A0B" : "#FAFAFA",
                  transform: `scaleX(${i < index ? 1 : i === index ? elapsed / CARD_MS : 0})`,
                }}
              />
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            id={contentId}
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex size-full flex-col justify-between"
          >
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: card.kickerColor }}>{card.kicker}</div>
            <div>
              {card.stat && (
                <div className="mb-3 font-mono text-[88px] font-medium leading-[0.9] tracking-[-0.04em]" style={{ color: card.statColor }}>{card.stat}</div>
              )}
              <div className={`font-semibold ${card.stat ? "text-[40px] leading-[0.98] tracking-[-0.04em]" : "text-[64px] leading-[0.85] tracking-[-0.055em]"}`}>{card.headline}</div>
              <p className={`mt-4 text-[15px] leading-[1.45] ${paper ? "text-chalk-muted" : "text-chalk-dim"}`}>{card.body}</p>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-muted">{card.footer}</div>
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
}
