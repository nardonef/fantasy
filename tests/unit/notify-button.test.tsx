// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotifyButton } from "@/components/notify-button";

describe("NotifyButton", () => {
  const original = Element.prototype.scrollIntoView;
  let scroll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll as unknown as typeof original;
  });

  afterEach(() => {
    Element.prototype.scrollIntoView = original;
  });

  it("dispatches fantasy:source with detail hedge and scrolls #signup into view", () => {
    render(
      <>
        <div id="signup" data-testid="signup" />
        <NotifyButton>x</NotifyButton>
      </>,
    );
    const events: CustomEvent[] = [];
    const listener = (e: Event) => events.push(e as CustomEvent);
    window.addEventListener("fantasy:source", listener);
    try {
      fireEvent.click(screen.getByRole("button", { name: "x" }));
    } finally {
      window.removeEventListener("fantasy:source", listener);
    }
    expect(events).toHaveLength(1);
    expect(events[0].detail).toBe("hedge");
    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll.mock.contexts[0]).toBe(screen.getByTestId("signup"));
    expect(scroll.mock.calls[0]).toEqual([{ behavior: "smooth", block: "center" }]);
  });

  it("uses instant scrolling when reduced motion is preferred", () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({ matches: q.includes("reduce"), media: q })) as unknown as typeof window.matchMedia;
    try {
      render(
        <>
          <div id="signup" />
          <NotifyButton>x</NotifyButton>
        </>,
      );
      fireEvent.click(screen.getByRole("button", { name: "x" }));
      expect(scroll.mock.calls[0]).toEqual([{ behavior: "auto", block: "center" }]);
    } finally {
      window.matchMedia = original;
    }
  });

  it("does not throw when #signup is absent", () => {
    render(<NotifyButton>x</NotifyButton>);
    expect(() => fireEvent.click(screen.getByRole("button", { name: "x" }))).not.toThrow();
    expect(scroll).not.toHaveBeenCalled();
  });
});
