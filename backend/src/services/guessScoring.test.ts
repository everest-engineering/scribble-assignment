import { describe, expect, it } from "vitest";
import { evaluateGuess } from "./guessScoring.js";

describe("evaluateGuess", () => {
  it("treats matching guesses as correct regardless of case", () => {
    expect(evaluateGuess("Rocket", "rocket")).toEqual({ isCorrect: true, points: 100 });
    expect(evaluateGuess("ROCKET", "rocket")).toEqual({ isCorrect: true, points: 100 });
  });

  it("awards 100 points for correct guesses", () => {
    expect(evaluateGuess("rocket", "rocket").points).toBe(100);
  });

  it("awards 0 points for incorrect guesses", () => {
    expect(evaluateGuess("pizza", "rocket")).toEqual({ isCorrect: false, points: 0 });
  });
});
