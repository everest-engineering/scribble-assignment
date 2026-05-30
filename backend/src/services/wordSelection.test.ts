import { describe, expect, it } from "vitest";
import { STARTER_WORDS } from "../seed/starterData.js";
import { selectWord } from "./wordSelection.js";

describe("selectWord", () => {
  it("returns a word from the starter list", () => {
    const word = selectWord("ABCD");

    expect(STARTER_WORDS).toContain(word);
  });

  it("returns the same word for the same room code", () => {
    expect(selectWord("WXYZ")).toBe(selectWord("WXYZ"));
  });

  it("maps identical conditions to a stable starter-list word", () => {
    const first = selectWord("TEST");
    const second = selectWord("TEST");

    expect(first).toBe(second);
    expect(STARTER_WORDS).toContain(first);
  });
});
