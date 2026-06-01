import { describe, expect, it } from "vitest";
import { compareGuessToSecret, isGuessEmpty, trimGuess } from "./guessLogic.js";

describe("guessLogic", () => {
  it("trimGuess removes surrounding whitespace", () => {
    expect(trimGuess("  Rocket  ")).toBe("Rocket");
  });

  it("isGuessEmpty rejects whitespace-only input", () => {
    expect(isGuessEmpty("   ")).toBe(true);
    expect(isGuessEmpty("word")).toBe(false);
  });

  it("compareGuessToSecret is case-insensitive", () => {
    expect(compareGuessToSecret("rocket", "Rocket")).toBe(true);
    expect(compareGuessToSecret("ROCKET", "rocket")).toBe(true);
    expect(compareGuessToSecret("car", "rocket")).toBe(false);
  });
});
