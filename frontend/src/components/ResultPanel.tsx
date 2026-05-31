import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  const guesses = room?.guesses ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxHeight: "350px",
            overflowY: "auto",
            paddingRight: "4px"
          }}
        >
          {guesses.map((guess, index) => (
            <div
              key={index}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: guess.correct ? "#ecfdf5" : "#f3f4f6",
                border: "1px solid",
                borderColor: guess.correct ? "#a7f3d0" : "#e5e7eb",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: guess.correct ? "#047857" : "#374151" }}>
                  {guess.senderName}
                </span>
                {guess.correct && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor: "#10b981",
                      color: "#ffffff",
                      padding: "2px 6px",
                      borderRadius: "9999px"
                    }}
                  >
                    Guessed Correctly!
                  </span>
                )}
              </div>
              <span style={{ fontSize: "0.95rem", color: guess.correct ? "#065f46" : "#111827", wordBreak: "break-all" }}>
                {guess.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
