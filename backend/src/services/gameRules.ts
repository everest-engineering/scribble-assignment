export const CORRECT_SCORE = 100;
export const INCORRECT_SCORE = 0;

export function normalizeGuess(text: string): string {
  return text.trim().toLowerCase();
}

export function isCorrectGuess(guess: string, secret: string): boolean {
  return normalizeGuess(guess) === normalizeGuess(secret);
}
