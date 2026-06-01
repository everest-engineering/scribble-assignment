export function trimGuess(text: string) {
  return text.trim();
}

export function isGuessEmpty(text: string) {
  return trimGuess(text).length === 0;
}

export function compareGuessToSecret(guess: string, secretWord: string) {
  return trimGuess(guess).toLowerCase() === secretWord.toLowerCase();
}
