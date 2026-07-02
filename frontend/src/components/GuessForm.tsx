import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isDrawer = !!room && room.drawerId === participantId;
  const guessedCorrectly = !!participantId && !!room?.correctGuessers.includes(participantId);
  const disabled = isLoading || isDrawer || guessedCorrectly;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    try {
      setSubmitError(null);
      await roomStore.submitGuess(guessText);
      setGuessText("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit guess";
      setSubmitError(message);
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
          disabled={disabled}
        />
      </label>
      {submitError ? <p className="form__error">{submitError}</p> : null}
      {isDrawer ? <p className="status-line">Drawers cannot submit guesses.</p> : null}
      {guessedCorrectly ? <p className="status-line">Correct! You already scored this round.</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
