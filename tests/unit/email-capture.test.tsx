// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailCapture } from "@/components/email-capture";

afterEach(() => vi.unstubAllGlobals());

const mockFetch = (impl: () => Promise<Partial<Response>>) => {
  const f = vi.fn(impl);
  vi.stubGlobal("fetch", f);
  return f;
};

describe("EmailCapture", () => {
  it("shows the success panel after a 200", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    render(<EmailCapture />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    expect(await screen.findByText("You're on the list. We'll keep it brief.")).toBeInTheDocument();
  });

  it("moves focus to the success panel so the confirmation is announced", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    render(<EmailCapture id="signup" />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    const panel = await screen.findByText("You're on the list. We'll keep it brief.");
    expect(panel).toHaveAttribute("id", "signup");
    expect(panel).toHaveAttribute("tabindex", "-1");
    expect(panel).toHaveFocus();
  });

  it("shows the server error, keeps the typed email, and flags the input", async () => {
    mockFetch(async () => ({ ok: false, json: async () => ({ error: "Something broke on our end. Try again." }) }));
    render(<EmailCapture />);
    const input = screen.getByPlaceholderText("you@yourleague.com");
    await userEvent.type(input, "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    expect(await screen.findByText("Something broke on our end. Try again.")).toBeInTheDocument();
    expect(input).toHaveValue("a@b.co");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a network error message when fetch rejects", async () => {
    mockFetch(async () => { throw new Error("offline"); });
    render(<EmailCapture />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    expect(await screen.findByText("Couldn't reach the server. Try again.")).toBeInTheDocument();
  });

  it("sends exactly one request when submitted twice while loading", async () => {
    let resolve!: (v: Partial<Response>) => void;
    const f = mockFetch(() => new Promise((r) => { resolve = r; }));
    render(<EmailCapture />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co{enter}{enter}");
    expect(f).toHaveBeenCalledTimes(1);
    resolve({ ok: true, json: async () => ({ ok: true }) });
    await waitFor(() => expect(screen.getByText(/on the list/i)).toBeInTheDocument());
  });

  it("posts the source and the honeypot value", async () => {
    const f = mockFetch(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    render(<EmailCapture source="hedge" />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ email: "a@b.co", source: "hedge", hp_x: "" });
  });

  it("gives each instance its own helper id and points aria-describedby at it", () => {
    render(<><EmailCapture /><EmailCapture /></>);
    const inputs = screen.getAllByPlaceholderText("you@yourleague.com");
    const ids = inputs.map((i) => i.getAttribute("aria-describedby"));
    expect(ids[0]).toBeTruthy();
    expect(ids[0]).not.toBe(ids[1]);
    inputs.forEach((input, n) => {
      const helper = document.getElementById(ids[n]!);
      expect(helper).toHaveTextContent("We'll email less often than you check waivers.");
      expect(helper?.closest("form")).toBe(input.closest("form"));
    });
  });

  it("re-tags the source on the fantasy:source event", async () => {
    const f = mockFetch(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    render(<EmailCapture />);
    act(() => { window.dispatchEvent(new CustomEvent("fantasy:source", { detail: "hedge" })); });
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ email: "a@b.co", source: "hedge" });
  });

  it("focuses the input without scrolling on the fantasy:source event", () => {
    render(<EmailCapture />);
    const input = screen.getByPlaceholderText("you@yourleague.com");
    const focus = vi.spyOn(input, "focus");
    act(() => { window.dispatchEvent(new CustomEvent("fantasy:source", { detail: "hedge" })); });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(input).toHaveFocus();
  });
});
