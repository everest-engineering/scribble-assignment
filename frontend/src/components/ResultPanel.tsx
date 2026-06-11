import { Card } from "./Card";
import type { RoundResult } from "../services/api";

interface Guess {
  participantId: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

interface Participant {
  id: string;
  name: string;
}

interface ResultPanelProps {
  guessLog?: Guess[];
  participants?: Participant[];
  roundResult?: RoundResult;
  isHost?: boolean;
  isPlaying?: boolean;
}

export function ResultPanel({ guessLog, participants, roundResult, isPlaying }: ResultPanelProps) {
  const participantMap = new Map(participants?.map((p) => [p.id, p.name]) ?? []);

  return (
    <Card title="Activity">
      {roundResult && (
        <div className="round-result-summary" style={{ marginBottom: "12px" }}>
          {roundResult.endedEarly && (
            <p style={{ color: "#f59e0b", fontSize: "0.875rem", fontWeight: 600 }}>
              Round ended early
            </p>
          )}
          {roundResult.allCorrect && (
            <p style={{ color: "#10b981", fontSize: "0.875rem", fontWeight: 600 }}>
              Everyone guessed correctly!
            </p>
          )}
          {roundResult.correctGuessers.length > 0 && (
            <p style={{ fontSize: "0.875rem" }}>
              Correct guessers: {roundResult.correctGuessers.map((id) => participantMap.get(id) ?? "Unknown").join(", ")}
            </p>
          )}
        </div>
      )}

      {!guessLog || guessLog.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        </div>
      ) : (
        <ul className="guess-list">
          {guessLog.map((guess, index) => (
            <li
              key={index}
              className={`guess-list__item${guess.correct ? " guess-list__item--correct" : " guess-list__item--incorrect"}`}
            >
              <span className="guess-list__name">
                {participantMap.get(guess.participantId) ?? "Unknown"}
              </span>
              <span className="guess-list__text">
                {isPlaying && guess.correct ? "Guessed correctly!" : guess.text}
              </span>
              <span className="guess-list__result">
                {guess.correct ? "✓" : "✗"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
