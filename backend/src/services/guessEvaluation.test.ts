import { describe, expect, it } from "vitest";
import { isCorrect, normalizeGuess } from "./guessEvaluation.js";

describe("guessEvaluation", () => {
  it("normalizeGuess trims surrounding whitespace and lowercases", () => {
    expect(normalizeGuess("  RoCkEt ")).toBe("rocket");
  });

  it("isCorrect matches ignoring case and surrounding whitespace", () => {
    expect(isCorrect("  ROCKET ", "rocket")).toBe(true);
    expect(isCorrect("rocket", "Rocket")).toBe(true);
  });

  it("isCorrect rejects a non-matching guess", () => {
    expect(isCorrect("rockett", "rocket")).toBe(false);
    expect(isCorrect("roc ket", "rocket")).toBe(false);
  });
});
