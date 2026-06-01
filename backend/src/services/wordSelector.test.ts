import { describe, expect, it } from "vitest";
import { selectDeterministicWord } from "./wordSelector.js";

describe("wordSelector", () => {
  it("selects a word from the provided list and is deterministic", () => {
    const list = ["apple", "banana", "cherry"];
    const seed = "test-seed-123";

    const w0 = selectDeterministicWord(seed, 0, list);
    const w0b = selectDeterministicWord(seed, 0, list);
    expect(w0).toBe(w0b);
    expect(list.includes(w0)).toBe(true);

    const w1 = selectDeterministicWord(seed, 1, list);
    expect(list.includes(w1)).toBe(true);
  });

  it("throws when provided an empty list", () => {
    expect(() => selectDeterministicWord("s", 0, [])).toThrow();
  });
});
