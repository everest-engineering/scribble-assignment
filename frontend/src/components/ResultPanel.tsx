import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function ResultPanel() {
  const { room } = useRoomState();

  const guesses = room?.guesses ?? [];
  const isFinished = room?.status === "finished";

  return (
    <Card title={isFinished ? "Result" : "Activity"}>
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {isFinished ? "No guesses were submitted." : "Game activity and guesses will appear here."}
          </p>
        </div>
      ) : (
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          {isFinished && room?.secretWord ? (
            <p style={{ fontSize: "1rem", fontWeight: 700, textAlign: "center", marginBottom: "8px" }}>
              The word was: {room.secretWord.toUpperCase()}
            </p>
          ) : null}
          {guesses.map((guess, index) => (
            <div
              key={index}
              className="placeholder-row"
              style={{
                color: guess.isCorrect ? "#059669" : "#dc2626",
                backgroundColor: guess.isCorrect ? "#ecfdf5" : "#fef2f2",
                padding: "8px 12px",
                borderRadius: "6px"
              }}
            >
              <span>
                {guess.participantName}: {guess.text}
              </span>
              <strong>{guess.isCorrect ? "✓" : "✗"}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}