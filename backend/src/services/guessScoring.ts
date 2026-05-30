export function evaluateGuess(guess: string, secretWord: string) {
  const isCorrect = guess.toLowerCase() === secretWord.toLowerCase();

  return {
    isCorrect,
    points: isCorrect ? 100 : 0
  };
}
