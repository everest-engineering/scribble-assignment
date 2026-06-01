import { Card } from "./Card";
import type { Guess, Participant } from "../services/api";

interface ResultPanelProps {
  guesses: Guess[];
  participants: Participant[];
}

function sanitize(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function ResultPanel({ guesses, participants }: ResultPanelProps) {
  const correctIds = new Set(guesses.filter((g) => g.isCorrect).map((g) => g.participantId));

  const nameMap = new Map(participants.map((p) => [p.id, p.name]));

  const displayGuesses = guesses.filter((g) => g.isCorrect || !correctIds.has(g.participantId));

  return (
    <Card title="Activity">
      {displayGuesses.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No guesses yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
          {displayGuesses.map((guess, index) => (
            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: guess.isCorrect ? '#d1fae5' : '#f9fafb' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#6b7280', minWidth: '60px' }}>{nameMap.get(guess.participantId) ?? "Unknown"}</span>
              <span style={{ flex: 1, fontSize: '0.875rem' }}>{sanitize(guess.text)}</span>
              <span style={{ fontWeight: 700, color: guess.isCorrect ? '#065f46' : '#dc2626' }}>{guess.isCorrect ? "✓" : "✗"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
