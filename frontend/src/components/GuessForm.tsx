import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const roomStore = useRoomStore();
  const { room, participantId, error } = useRoomState();
  const [guessText, setGuessText] = useState("");

  const isDrawer = room?.drawerId === participantId;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guessText.trim() || isDrawer) return;

    try {
      await roomStore.submitGuess(guessText);
      setGuessText("");
    } catch {
      // Error is handled by roomStore setting error state
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {isDrawer && (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>You are the drawer. You cannot guess.</p>
      )}
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder={isDrawer ? "Drawing..." : "Type your guess here..."}
          disabled={isDrawer}
        />
      </label>
      {error && (
        <p style={{ fontSize: "0.875rem", color: "#ef4444", marginBottom: "8px" }}>{error}</p>
      )}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={isDrawer}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
