import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();

    if (!trimmed) {
      setLocalError("Guess cannot be empty");
      return;
    }

    try {
      setLocalError(null);
      setGuessText("");
      await roomStore.submitGuess(trimmed);
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
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
        />
      </label>
      {localError ? <p className="form__error">{localError}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit">
          Submit Guess
        </button>
      </div>
    </form>
  );
}
