// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Wordmark } from "@/components/wordmark";

describe("Wordmark", () => {
  it("renders the parent brand with an accessible label", () => {
    render(<Wordmark size={24} />);
    expect(screen.getByRole("img", { name: "fantasy" })).toBeInTheDocument();
  });

  it("renders a tool lockup with the tool name and tool dot color", () => {
    render(<Wordmark size={26} tool="rankings" />);
    const el = screen.getByRole("img", { name: "fantasy rankings" });
    expect(el).toHaveTextContent("rankings");
    expect(el.querySelector("[data-dot]")).toHaveStyle({ backgroundColor: "#4CD48F" });
  });

  it("uses the on-light blue for the parent dot on light surfaces", () => {
    render(<Wordmark size={24} light />);
    expect(screen.getByRole("img", { name: "fantasy" }).querySelector("[data-dot]"))
      .toHaveStyle({ backgroundColor: "#2148D8" });
  });
});
