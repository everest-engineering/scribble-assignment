import { describe, expect, it } from "vitest";
import { STARTER_WORDS } from "../seed/starterData.js";
import { selectRoundWord } from "./wordSelection.js";

describe("selectRoundWord", () => {
  it("returns a word from the starter list", () => {
    const word = selectRoundWord("ABCD", 1);

    expect(STARTER_WORDS).toContain(word);
  });

  it("is deterministic for the same room code and round", () => {
    const first = selectRoundWord("WXYZ", 1);
    const second = selectRoundWord("WXYZ", 1);

    expect(first).toBe(second);
  });

  it("may differ for different room codes", () => {
    const words = new Set(
      ["AAAA", "BBBB", "CCCC", "DDDD"].map((code) => selectRoundWord(code, 1))
    );

    expect(words.size).toBeGreaterThan(1);
  });
});
