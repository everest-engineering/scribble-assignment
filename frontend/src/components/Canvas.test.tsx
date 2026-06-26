import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Canvas } from "./Canvas";

describe("Canvas", () => {
  it("shows color picker and clear button for drawer", () => {
    render(<Canvas isDrawer={true} strokes={[]} secretWord="rocket" />);

    const colorButtons = screen.getAllByRole("button", { name: /color/i });
    expect(colorButtons.length).toBeGreaterThanOrEqual(4);

    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("shows secret word for drawer", () => {
    render(<Canvas isDrawer={true} strokes={[]} secretWord="rocket" />);

    expect(screen.getByText(/rocket/)).toBeInTheDocument();
  });

  it("hides color picker and clear button for guesser", () => {
    render(<Canvas isDrawer={false} strokes={[]} />);

    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/rocket/)).not.toBeInTheDocument();
  });
});
