import { NotifyButton } from "./notify-button";
import { Wordmark } from "./wordmark";
import { TOOL_URL } from "@/lib/tools";

const cardBase = "group flex flex-col overflow-hidden rounded-[18px] border border-hairline bg-surface-2 text-left transition-colors hover:border-hairline-2";
const preview = "flex h-[200px] items-center justify-center border-b border-hairline bg-field";
const body = "flex flex-col gap-[10px] p-[22px]";
const meta = "font-mono text-[11px] font-medium uppercase tracking-[0.16em]";

function WrappedPreview() {
  return (
    <div className={`${preview} gap-3`} aria-hidden>
      <div className="flex h-[164px] w-[92px] flex-col justify-between rounded-[10px] bg-raised p-2.5">
        <span className="font-mono text-[7px] tracking-[0.16em] text-regret">BENCH REGRET</span>
        <div>
          <div className="font-mono text-[26px] leading-none tracking-[-0.04em]">4-10</div>
          <div className="mt-1 text-[9px] font-semibold leading-tight">Six wins, still on your bench.</div>
        </div>
      </div>
      <div className="flex h-[164px] w-[92px] flex-col justify-between rounded-[10px] bg-chalk p-2.5 text-field">
        <span className="font-mono text-[7px] tracking-[0.16em] text-signal-on-light">ARCHETYPE</span>
        <div className="text-[20px] font-semibold leading-[0.85] tracking-[-0.055em]">The Saboteur</div>
      </div>
    </div>
  );
}

function RankingsPreview() {
  const rows = [["1", "Ja'Marr Chase", "CIN WR"], ["2", "Bijan Robinson", "ATL RB"], ["3", "Jahmyr Gibbs", "DET RB"]];
  return (
    <div className={`${preview} px-8`} aria-hidden>
      <div className="w-full max-w-[250px]">
        <div className="mb-2 font-mono text-[10px] tracking-[0.18em] text-rankings">TIER 1</div>
        {rows.map(([n, name, m]) => (
          <div key={n} className="flex items-baseline border-b border-hairline py-2 text-[13px]">
            <span className="w-7 font-mono text-chalk-muted">{n}</span>
            <span className="flex-1 font-semibold">{name}</span>
            <span className="font-mono text-[10px] text-chalk-faint">{m}</span>
          </div>
        ))}
        <div className="mt-2 font-mono text-[10px] tracking-[0.18em] text-chalk-faintest">TIER 2</div>
      </div>
    </div>
  );
}

function HedgePreview() {
  return (
    <div className={preview} aria-hidden>
      <div className="w-[250px] rounded-xl border border-[#2A2A31] bg-raised-2 p-4">
        <div className="font-mono text-[10px] tracking-[0.18em] text-hedge">INJURY PROTECTION</div>
        <div className="mt-2 text-[17px] font-semibold leading-tight">Bijan misses 2+ games</div>
        <div className="mt-4 flex justify-between font-mono text-[11px] text-hedge">
          <span>COST 140</span><span>PAYS 1,000</span>
        </div>
      </div>
    </div>
  );
}

export function ToolCards() {
  return (
    <section id="tools" aria-label="Tools" className="mx-auto max-w-[1200px] px-6 pb-24 md:px-12">
      <div className="grid gap-4 min-[900px]:grid-cols-3">
        <a href={TOOL_URL.wrapped} className={cardBase} aria-label="fantasy wrapped, live, open">
          <WrappedPreview />
          <div className={body}>
            <Wordmark size={26} tool="wrapped" letterSpacing="-0.045em" />
            <p className="text-[15px] leading-[1.45] text-chalk-dim">Your season, told back to you with precision and a little cruelty.</p>
            <span className={`${meta} text-wrapped`}>LIVE · OPEN →</span>
          </div>
        </a>
        <a href={TOOL_URL.rankings} className={cardBase} aria-label="fantasy rankings, beta, join">
          <RankingsPreview />
          <div className={body}>
            <Wordmark size={26} tool="rankings" letterSpacing="-0.045em" />
            <p className="text-[15px] leading-[1.45] text-chalk-dim">A board you can read with forty seconds on the clock.</p>
            <span className={`${meta} text-rankings`}>BETA · JOIN →</span>
          </div>
        </a>
        <NotifyButton className={`${cardBase} cursor-pointer`}>
          <span className="sr-only">fantasy hedge, in development, notify me</span>
          <HedgePreview />
          <span className={body} aria-hidden>
            <Wordmark size={26} tool="hedge" letterSpacing="-0.045em" />
            <span className="text-[15px] leading-[1.45] text-chalk-dim">Insure your roster against the NFL. Virtual coins, real anxiety.</span>
            <span className={`${meta} text-hedge`}>IN DEVELOPMENT · NOTIFY ME →</span>
          </span>
        </NotifyButton>
      </div>
    </section>
  );
}
