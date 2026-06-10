import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function ResultPanel() {
  const { room } = useRoomState();
  const history = room?.guessHistory ?? [];

  return (
    <Card title="Activity">
      {history.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            Game activity and guesses will appear here.
          </p>
        </div>
      ) : (
        <ul
          className="player-list"
          style={{ maxHeight: "220px", overflowY: "auto", gap: "6px" }}
        >
          {history.map((entry, index) => (
            <li
              key={index}
              style={{
                backgroundColor: entry.correct ? "#f0fdf4" : "#fafafa",
                borderRadius: "4px",
                padding: "4px 8px",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "2px"
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.85em", color: "#374151" }}>
                {entry.playerName}
              </span>
              <span
                style={{
                  fontSize: "0.85em",
                  color: entry.correct ? "#16a34a" : "#6b7280"
                }}
              >
                {entry.correct ? `✓ "${entry.guessText}" — Correct!` : `"${entry.guessText}"`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
