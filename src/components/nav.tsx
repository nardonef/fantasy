import { Wordmark } from "./wordmark";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-[#060607e6] backdrop-blur-[12px]">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-[22px] md:px-12" aria-label="Primary">
        <a href="#" aria-label="fantasy home"><Wordmark size={24} /></a>
        <div className="flex items-center gap-7 text-sm">
          <a href="#tools" className="hidden text-chalk-dim hover:text-wrapped sm:inline">Wrapped</a>
          <a href="#tools" className="hidden text-chalk-dim hover:text-wrapped sm:inline">Rankings</a>
          <a href="#tools" className="hidden text-chalk-dim hover:text-wrapped sm:inline">Hedge</a>
          <a href="#signup" className="inline-flex min-h-11 items-center rounded-[9px] bg-chalk px-4 font-semibold text-field">Get early access</a>
        </div>
      </nav>
    </header>
  );
}
