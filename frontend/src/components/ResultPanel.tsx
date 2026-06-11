import { Card } from "./Card";

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
}

export function ResultPanel({ guessLog, participants }: ResultPanelProps) {
  const participantMap = new Map(participants?.map((p) => [p.id, p.name]) ?? []);

  return (
    <Card title="Activity">
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
              <span className="guess-list__text">{guess.text}</span>
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
