import { describe, expect, it } from "vitest";
import { selectWord } from "./wordSelection.js";
import { STARTER_WORDS } from "../seed/starterData.js";

describe("selectWord", () => {
  it("is deterministic for the same code and round (FR-005, SC-005)", () => {
    const first = selectWord("K7P2", 1);
    const second = selectWord("K7P2", 1);

    expect(first).toBe(second);
  });

  it("always returns a word from the starter list", () => {
    for (const code of ["K7P2", "ABCD", "ZZZZ", "9X4Q", "MNOP"]) {
      expect(STARTER_WORDS).toContain(selectWord(code, 1));
    }
  });

  it("can select different words for different codes", () => {
    const codes = ["AAAA", "ABCD", "K7P2", "ZZZZ", "9X4Q", "MNOP", "QRST", "WXYZ"];
    const distinct = new Set(codes.map((code) => selectWord(code, 1)));

    expect(distinct.size).toBeGreaterThan(1);
  });
});
