import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  
  const isDrawer = room?.drawerId === participantId;
  const isPlaying = room?.status === "playing";
  const isDisabled = disabled || isDrawer || !isPlaying;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed || trimmed.length > 50 || isDisabled) return;

    try {
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (e) {
      console.error("Failed to submit guess", e);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={isDisabled}
          maxLength={50}
        />
      </label>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={isDisabled || !guessText.trim()}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
