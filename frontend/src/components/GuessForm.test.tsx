import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GuessForm, normalizeGuessText } from "./GuessForm";

describe("GuessForm", () => {
  it("normalizes guesses by trimming whitespace", () => {
    expect(normalizeGuessText("  rocket  ")).toBe("rocket");
    expect(normalizeGuessText("   ")).toBe("");
  });

  it("renders disabled guess controls for drawers or inactive rooms", () => {
    const html = renderToStaticMarkup(<GuessForm disabled />);

    expect(html).toContain("disabled");
    expect(html).toContain("Submit Guess");
  });
});
