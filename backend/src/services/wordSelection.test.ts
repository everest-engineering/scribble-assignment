import { describe, expect, it } from "vitest";
import { selectWord } from "./wordSelection.js";
import { STARTER_WORDS } from "../seed/starterData.js";

describe("selectWord", () => {
  // T013 [US3]
  it("is deterministic — the same code always returns the same word", () => {
    expect(selectWord("ABCD", STARTER_WORDS)).toBe(selectWord("ABCD", STARTER_WORDS));
  });

  it("always returns a word from the provided list", () => {
    for (const code of ["ABCD", "ZZZZ", "1234", "WXYZ", "AAAA"]) {
      expect(STARTER_WORDS).toContain(selectWord(code, STARTER_WORDS));
    }
  });

  it("can map different codes to different words", () => {
    const words = new Set(
      ["AAAA", "AAAB", "AAAC", "AAAD", "AAAE"].map((code) => selectWord(code, STARTER_WORDS))
    );
    expect(words.size).toBeGreaterThan(1);
  });

  it("matches the sum-of-char-codes modulo length formula", () => {
    const code = "ABCD";
    const sum = [...code].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    expect(selectWord(code, STARTER_WORDS)).toBe(STARTER_WORDS[sum % STARTER_WORDS.length]);
  });
});
