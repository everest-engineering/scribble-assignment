import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isDrawer = participantId === room?.drawerId;
  if (isDrawer) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Guess cannot be empty");
      return;
    }
    try {
      setError(null);
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit guess");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(e) => setGuessText(e.target.value)}
          placeholder="Type your guess here..."
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit">
          Submit Guess
        </button>
      </div>
    </form>
  );
}
