import type { Guess, Participant } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
}

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin}m ago`;
}

function findParticipantName(participants: Participant[], participantId: string): string {
  return participants.find((p) => p.id === participantId)?.name ?? "Unknown";
}

export function ResultPanel({ guesses, participants }: ResultPanelProps) {
  if (guesses.length === 0) {
    return (
      <Card title="Activity">
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>No guesses yet</p>
      </Card>
    );
  }

  return (
    <Card title="Activity">
      <ul className="guess-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {guesses.map((guess) => (
          <li
            key={guess.id}
            className="guess-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0",
              borderBottom: "1px solid #f3f4f6",
              fontSize: "0.875rem"
            }}
          >
            <span style={{ fontWeight: 600, flexShrink: 0 }}>
              {findParticipantName(participants, guess.participantId)}:
            </span>
            <span style={{ flex: 1, wordBreak: "break-word" }}>{guess.text}</span>
            <span
              style={{
                flexShrink: 0,
                color: guess.isCorrect ? "#16a34a" : "#dc2626",
                fontWeight: 700
              }}
            >
              {guess.isCorrect ? "✓" : "✗"}
            </span>
            <span style={{ flexShrink: 0, color: "#9ca3af", fontSize: "0.75rem" }}>
              {formatRelativeTime(guess.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
