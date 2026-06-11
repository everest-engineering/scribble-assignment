import { describe, expect, it } from "vitest";
import { selectWord } from "./wordService.js";

describe("wordService", () => {
  it("selectWord returns a word from the starter list", () => {
    const word = selectWord("ABCD", 1);
    const starterWords = ["rocket", "pizza", "castle", "guitar", "sunflower"];
    expect(starterWords).toContain(word);
  });

  it("selectWord returns deterministic result for same code and round", () => {
    const word1 = selectWord("ABCD", 1);
    const word2 = selectWord("ABCD", 1);
    expect(word1).toBe(word2);
  });

  it("selectWord returns different result for different codes", () => {
    const word1 = selectWord("ABCD", 1);
    const word2 = selectWord("EFGH", 1);
    expect(word1).not.toBe(word2);
  });

  it("selectWord returns different result for different round numbers", () => {
    const word1 = selectWord("ABCD", 1);
    const word2 = selectWord("ABCD", 2);
    expect(word1).not.toBe(word2);
  });

  it("selectWord handles room codes with numbers", () => {
    const word = selectWord("ABC1", 1);
    expect(word).toBeDefined();
  });
});
