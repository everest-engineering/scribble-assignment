import { describe, expect, it } from "vitest";
import { evaluateGuess } from "./guessService.js";

describe("guessService", () => {
  it("evaluateGuess trims and compares case-insensitively", () => {
    const result = evaluateGuess("  Rocket  ", "rocket");

    expect(result.text).toBe("Rocket");
    expect(result.correct).toBe(true);
  });

  it("evaluateGuess returns incorrect for non-matching guesses", () => {
    const result = evaluateGuess("pizza", "rocket");

    expect(result.correct).toBe(false);
  });

  it("evaluateGuess rejects empty guesses", () => {
    expect(() => evaluateGuess("   ", "rocket")).toThrow("Guess is required");
  });
});
