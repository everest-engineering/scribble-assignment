import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GuessInput() {
  const [guess, setGuess] = useState("");
  const store = useRoomStore();
  const { room, participantId, error } = useRoomState();

  if (!room || !participantId) return null;
  
  const isDrawer = room.currentRound?.drawerId === participantId;
  const isRoundActive = room.currentRound?.roundStatus === "Drawing";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || isDrawer || !isRoundActive) return;
    
    try {
      await store.addGuess(guess);
      setGuess("");
    } catch (err) {
      // Handled by store
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          type="text"
          className="form__input"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={isDrawer || !isRoundActive}
          placeholder={isDrawer ? "You are drawing!" : "Type your guess here..."}
        />
      </label>
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={isDrawer || !isRoundActive || !guess.trim()}
        >
          Submit Guess
        </button>
      </div>
      {error && <div className="form__error">{error}</div>}
    </form>
  );
}
