// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("renders hero copy and all three tools with correct destinations", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("It's all on the record");
    const tools = screen.getByRole("region", { name: "Tools" });
    const wrapped = within(tools).getByRole("link", { name: /wrapped/i });
    expect(wrapped).toHaveAttribute("href", "https://fantasywrapped.net");
    const rankings = within(tools).getByRole("link", { name: /rankings/i });
    expect(rankings).toHaveAttribute("href", "https://fantasy-rankings-beige.vercel.app");
    expect(within(tools).getByRole("button", { name: /hedge/i })).toBeInTheDocument();
  });

  it("has the footer lines verbatim", () => {
    render(<Home />);
    expect(screen.getByText("FANTASY · 2026")).toBeInTheDocument();
    expect(screen.getByText("NOT AFFILIATED WITH THE NFL")).toBeInTheDocument();
  });

  it("contains no exclamation marks in visible copy", () => {
    const { container } = render(<Home />);
    expect(container.textContent).not.toContain("!");
  });
});
