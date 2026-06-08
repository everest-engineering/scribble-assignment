// Pure, deterministic guess evaluation. A guess matches the secret word after
// trimming surrounding whitespace and ignoring letter casing (FR-002, FR-004).
// Kept dependency-free so the comparison is independently unit-testable.

export function normalizeGuess(text: string): string {
  return text.trim().toLowerCase();
}

export function isCorrect(text: string, word: string): boolean {
  return normalizeGuess(text) === normalizeGuess(word);
}
