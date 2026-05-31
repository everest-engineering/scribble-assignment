import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const roomStore = useRoomStore();
  const { participantId, room } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDrawer = Boolean(room && room.drawerId === participantId);
  const disabled = isDrawer || isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!guessText.trim()) {
      setError("Guess cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      await roomStore.submitGuess(guessText);
      setGuessText("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit guess");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder={isDrawer ? "You are drawing" : "Type your guess here..."}
          disabled={disabled}
        />
      </label>
      {error && <p className="form__error">{error}</p>}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          {isSubmitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
