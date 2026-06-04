import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";
import { Card } from "./Card";

interface GuessBoxProps {
  isDrawer: boolean;
}

export function GuessBox({ isDrawer }: GuessBoxProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const roomStore = useRoomStore();
  const { room } = useRoomState();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Guess cannot be empty.");
      return;
    }

    try {
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Submission failed");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {!isDrawer && (
        <Card title="Your Guess" className="card--compact">
          <form className="form" onSubmit={handleSubmit}>
            <label className="form__field">
              <input
                className="form__input"
                value={guessText}
                onChange={(event) => setGuessText(event.target.value)}
                placeholder="Type your guess here..."
              />
            </label>
            {error && <p className="form__error">{error}</p>}
            <div className="button-row button-row--compact">
              <button className="button button--primary" type="submit">
                Submit Guess
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Activity / Guesses" className="card--compact">
        <div
          style={{
            maxHeight: "180px", // Reduced from 250px to make it even more compact and prevent overflow
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "8px",
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
            border: "1px solid #e2e8f0"
          }}
        >
          {room?.guesses && room.guesses.length > 0 ? (
            room.guesses
              .slice()
              .reverse()
              .map((guess) => (
                <div
                  key={guess.id}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    backgroundColor: guess.isCorrect ? "#dcfce7" : "#f1f5f9",
                    color: guess.isCorrect ? "#15803d" : "#334155",
                    borderLeft: `4px solid ${guess.isCorrect ? "#22c55e" : "#cbd5e1"}`
                  }}
                >
                  <strong>{guess.playerName}:</strong> {guess.text}
                  {guess.isCorrect && " (Guessed correctly!)"}
                </div>
              ))
          ) : (
            <p style={{ fontSize: "0.875rem", color: "#64748b", textAlign: "center" }}>
              No guesses yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
