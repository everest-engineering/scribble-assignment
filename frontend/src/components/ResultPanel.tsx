import type { Guess, Participant } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
  guessedWord?: string | null;
}

export function ResultPanel({ guesses, participants, guessedWord }: ResultPanelProps) {
  const nameMap = new Map(participants.map((p) => [p.id, p.name]));

  return (
    <Card title={guessedWord ? "Results" : "Guesses"}>
      {guesses.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          {guessedWord ? "No guesses were made." : "No guesses yet."}
        </p>
      ) : (
        <ul className="guess-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guesses.map((g, i) => (
            <li
              key={i}
              style={{
                padding: "4px 0",
                fontSize: "0.875rem",
                color: g.correct ? "#059669" : "#6b7280"
              }}
            >
              <strong>{nameMap.get(g.participantId) ?? "Unknown"}</strong>: {g.text}
              {g.correct && " ✓"}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
