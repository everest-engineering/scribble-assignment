import { Card } from "./Card";
import type { Guess, Participant } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
}

export function ResultPanel({ guesses, participants }: ResultPanelProps) {
  function resolveParticipantName(participantId: string) {
    return participants.find((p) => p.id === participantId)?.name ?? "Unknown";
  }

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <p className="guess-list__empty">No guesses yet. Be the first!</p>
      ) : (
        <ul className="guess-list">
          {guesses.map((guess) => (
            <li
              key={guess.id}
              className={`guess-list__item ${
                guess.correct
                  ? "guess-list__item--correct"
                  : "guess-list__item--incorrect"
              }`}
            >
              <span className="guess-list__name">
                {resolveParticipantName(guess.participantId)}:
              </span>
              <span className="guess-list__text">{guess.text}</span>
              {guess.correct && (
                <span className="guess-list__badge">✓ Correct</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
