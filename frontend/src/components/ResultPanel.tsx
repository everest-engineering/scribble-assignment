import { Card } from "./Card";
import type { Guess } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
  correctWord: string | null;
  status: "lobby" | "playing" | "result";
}

export function ResultPanel({ guesses, correctWord, status }: ResultPanelProps) {
  return (
    <Card title={status === "result" ? "Round Result" : "Guess History"}>
      {status === "result" && correctWord ? (
        <p className="status-line">
          The word was: <strong>{correctWord}</strong>
        </p>
      ) : null}

      {guesses.length === 0 ? (
        <p className="placeholder-block">Guesses will appear here as players submit them.</p>
      ) : (
        <ul className="guess-list">
          {guesses.map((guess) => (
            <li key={guess.id} className={guess.correct ? "guess-list__item--correct" : undefined}>
              <span>{guess.playerName}</span>
              <span>{guess.text}</span>
              <span>{guess.correct ? "Correct (+100)" : "Incorrect"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
