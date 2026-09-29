// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
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
    expect(body).toMatchObject({ email: "a@b.co", source: "hedge", company: "" });
  });
});
