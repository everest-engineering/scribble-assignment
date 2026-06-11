import type { Guess } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
  secretWord: string | null;
}

export function ResultPanel({ guesses, secretWord }: ResultPanelProps) {
  const correctGuess = guesses.find((g) => g.isCorrect);
  const allGuesses = guesses;

  return (
    <Card title="Round Result">
      <div className="result-content">
        <div className="result-word">
          <span className="result-word__label">The word was:</span>
          <span className="result-word__value">{secretWord ?? "???"}</span>
        </div>

        {correctGuess ? (
          <div className="result-correct">
            <strong>{correctGuess.participantName}</strong> guessed it correctly!
          </div>
        ) : (
          <p>No one guessed the word correctly.</p>
        )}

        {allGuesses.length > 0 ? (
          <div className="result-guesses">
            <h3>All Guesses</h3>
            <ul className="guess-list">
              {allGuesses.map((guess, index) => (
                <li key={index} className={guess.isCorrect ? "guess-list__item--correct" : ""}>
                  <span className="guess-list__author">{guess.participantName}:</span>
                  <span className="guess-list__text">{guess.text}</span>
                  {guess.isCorrect ? <span className="guess-list__correct">Correct!</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
