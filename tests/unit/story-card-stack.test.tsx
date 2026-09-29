// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CARD_MS, StoryCardStack } from "@/components/story-card-stack";

const idx = () => screen.getByRole("button", { name: /next story card/i }).getAttribute("data-active-index");

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("StoryCardStack", () => {
  it("starts on card 0 and auto-advances every 4s, wrapping 2 -> 0", () => {
    render(<StoryCardStack />);
    expect(idx()).toBe("0");
    act(() => { vi.advanceTimersByTime(CARD_MS); });
    expect(idx()).toBe("1");
    act(() => { vi.advanceTimersByTime(CARD_MS); });
    expect(idx()).toBe("2");
    act(() => { vi.advanceTimersByTime(CARD_MS); });
    expect(idx()).toBe("0");
  });

  it("click advances immediately and resets the timer", () => {
    render(<StoryCardStack />);
    act(() => { vi.advanceTimersByTime(3000); });
    fireEvent.click(screen.getByRole("button", { name: /next story card/i }));
    expect(idx()).toBe("1");
    act(() => { vi.advanceTimersByTime(3000); });
    expect(idx()).toBe("1");
    act(() => { vi.advanceTimersByTime(1000); });
    expect(idx()).toBe("2");
  });

  it("rapid clicks advance one card each and wrap", () => {
    render(<StoryCardStack />);
    const b = screen.getByRole("button", { name: /next story card/i });
    fireEvent.click(b); fireEvent.click(b); fireEvent.click(b);
    expect(idx()).toBe("0");
  });

  it("pauses on hover without resetting progress", () => {
    render(<StoryCardStack />);
    const b = screen.getByRole("button", { name: /next story card/i });
    act(() => { vi.advanceTimersByTime(3000); });
    fireEvent.mouseEnter(b);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(idx()).toBe("0");
    fireEvent.mouseLeave(b);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(idx()).toBe("1");
  });

  it("pauses while the tab is hidden and resumes without skipping", () => {
    render(<StoryCardStack />);
    act(() => { vi.advanceTimersByTime(3000); });
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); vi.advanceTimersByTime(10000); });
    expect(idx()).toBe("0");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); vi.advanceTimersByTime(1000); });
    expect(idx()).toBe("1");
  });

  it("advances exactly one card per boundary under React StrictMode", () => {
    render(<StrictMode><StoryCardStack /></StrictMode>);
    expect(idx()).toBe("0");
    act(() => { vi.advanceTimersByTime(CARD_MS); });
    expect(idx()).toBe("1");
    act(() => { vi.advanceTimersByTime(CARD_MS); });
    expect(idx()).toBe("2");
  });

  it("does not auto-advance under prefers-reduced-motion but still advances on click", () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes("reduce"), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    render(<StoryCardStack />);
    act(() => { vi.advanceTimersByTime(20000); });
    expect(idx()).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: /next story card/i }));
    expect(idx()).toBe("1");
  });
});
