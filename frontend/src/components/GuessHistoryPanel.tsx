import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function GuessHistoryPanel() {
  const { room } = useRoomState();
  const guesses = room?.guessHistory ?? [];

  return (
    <Card title="Activity Log">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0, textAlign: "center" }}>
            Game activity and guesses will appear here.
          </p>
        </div>
      ) : (
        <ul className="player-list" style={{ maxHeight: "300px", overflowY: "auto", padding: 0, margin: 0 }}>
          {guesses.map((entry) => (
            <li
              key={entry.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "4px",
                borderColor: entry.isCorrect ? "#10b981" : "#e5e7eb",
                backgroundColor: entry.isCorrect ? "#ecfdf5" : "#f9fafb",
                padding: "12px 16px"
              }}
            >
              <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{entry.playerName}</span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: entry.isCorrect ? "#d1fae5" : "#f3f4f6",
                    color: entry.isCorrect ? "#065f46" : "#4b5563"
                  }}
                >
                  {entry.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "1rem",
                  color: entry.isCorrect ? "#047857" : "#111827",
                  fontWeight: entry.isCorrect ? 600 : 400
                }}
              >
                {entry.guessText}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
