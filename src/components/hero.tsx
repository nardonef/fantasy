import { EmailCapture } from "./email-capture";
import { StoryCardStack } from "./story-card-stack";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-24 pt-[72px] md:px-12 min-[900px]:grid-cols-[1.15fr_1fr]">
      <div className="flex min-w-0 flex-col gap-7">
        <div className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-chalk-faint">We watched every week</div>
        <h1 className="font-semibold leading-[0.86] tracking-[-0.058em]" style={{ fontSize: "clamp(56px, 10vw, 112px)" }}>
          It&apos;s all on the record
          <span aria-hidden className="ml-[0.02em] inline-block rounded-full bg-wrapped align-baseline" style={{ width: "0.17em", height: "0.17em" }} />
        </h1>
        <p className="max-w-[500px] text-xl leading-[1.5] text-chalk-dim">
          Fantasy football tools that remember what you&apos;d rather forget. The receipts are on the right. Tap them.
        </p>
        <EmailCapture id="signup" />
      </div>
      <div className="overflow-x-clip pb-6 pt-2"><StoryCardStack /></div>
    </section>
  );
}
