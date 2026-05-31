import { STARTER_WORDS } from "../seed/starterData.js";

export function selectSecretWord(code: string): string {
  const index =
    [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0) % STARTER_WORDS.length;

  return STARTER_WORDS[index]!;
}
