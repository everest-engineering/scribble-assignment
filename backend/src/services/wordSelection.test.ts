import { describe, expect, it } from "vitest";
import { STARTER_WORDS } from "../seed/starterData.js";
import { selectSecretWord } from "./wordSelection.js";

describe("wordSelection", () => {
  it("selectSecretWord is deterministic for a given room code", () => {
    const first = selectSecretWord("ABCD");
    const second = selectSecretWord("ABCD");

    expect(first).toBe(second);
  });

  it("selectSecretWord uses sum of char codes modulo word list length", () => {
    const code = "ABCD";
    const expectedIndex =
      [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0) % STARTER_WORDS.length;

    expect(selectSecretWord(code)).toBe(STARTER_WORDS[expectedIndex]);
  });
});
