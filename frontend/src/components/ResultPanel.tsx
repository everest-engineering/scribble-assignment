import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room?.guesses ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No guesses yet.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guesses.map((guess, index) => (
            <li
              key={index}
              style={{
                padding: "4px 0",
                fontSize: "0.875rem",
                display: "flex",
                justifyContent: "space-between",
                gap: "8px"
              }}
            >
              <span>
                <strong>{guess.participantName}</strong>: {guess.text}
              </span>
              <span style={{ color: guess.isCorrect ? "#059669" : "#dc2626", fontWeight: 600 }}>
                {guess.isCorrect ? "✓" : "✗"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
