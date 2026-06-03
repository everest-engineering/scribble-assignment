import { describe, expect, it } from "vitest";
import { selectWord } from "./wordSelection.js";
import { STARTER_WORDS } from "../seed/starterData.js";

describe("selectWord", () => {
  it("is deterministic for the same code", () => {
    expect(selectWord("WTR7", STARTER_WORDS)).toBe(selectWord("WTR7", STARTER_WORDS));
  });

  it("always returns a word from the provided list", () => {
    for (const code of ["AAAA", "WTR7", "EWP5", "Z9Q2", "2345"]) {
      expect(STARTER_WORDS).toContain(selectWord(code, STARTER_WORDS));
    }
  });

  it("throws when the word list is empty", () => {
    expect(() => selectWord("WTR7", [])).toThrow();
  });
});
