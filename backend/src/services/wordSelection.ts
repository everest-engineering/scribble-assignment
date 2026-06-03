/**
 * Deterministically pick a secret word from the provided list using the room
 * code as the only input. The same code always yields the same word, so every
 * client agrees without extra coordination or persistence (no randomness).
 */
export function selectWord(code: string, words: readonly string[]): string {
  if (words.length === 0) {
    throw new Error("Cannot select a word from an empty list");
  }

  let hash = 0;
  for (const character of code) {
    hash = (hash + character.charCodeAt(0)) % words.length;
  }

  return words[hash];
}
