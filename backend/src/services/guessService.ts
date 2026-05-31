export class GuessValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GuessValidationError";
  }
}

export function evaluateGuess(guess: string, secretWord: string) {
  const text = guess.trim();

  if (!text) {
    throw new GuessValidationError("Guess is required");
  }

  return {
    text,
    correct: text.toLowerCase() === secretWord.toLowerCase()
  };
}
