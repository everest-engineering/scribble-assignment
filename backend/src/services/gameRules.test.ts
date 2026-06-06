import { describe, expect, it } from "vitest";
import { CORRECT_SCORE, INCORRECT_SCORE, isCorrectGuess, normalizeGuess } from "./gameRules.js";

describe("gameRules", () => {
  // T004
  it("normalizeGuess trims and lowercases", () => {
    expect(normalizeGuess("  CASTLE ")).toBe("castle");
    expect(normalizeGuess("Rocket")).toBe("rocket");
  });

  // T004
  it("isCorrectGuess matches case-insensitively and trimmed", () => {
    expect(isCorrectGuess("  CASTLE ", "castle")).toBe(true);
    expect(isCorrectGuess("rocket", "Rocket")).toBe(true);
    expect(isCorrectGuess("cat", "castle")).toBe(false);
  });

  // T004
  it("score constants are 100 / 0", () => {
    expect(CORRECT_SCORE).toBe(100);
    expect(INCORRECT_SCORE).toBe(0);
  });
});
