import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const roomStore = useRoomStore();
  const { error, isLoading } = useRoomState();
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    const trimmed = guessText.trim();

    if (!trimmed) {
      setLocalError("Guess is required");
      return;
    }

    try {
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch {
      // store error surfaced below
    }
  }

  const displayError = localError ?? error;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={disabled || isLoading}
        />
      </label>
      {displayError ? <p className="form__error">{displayError}</p> : null}
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={disabled || isLoading}
        >
          {isLoading ? "Submitting…" : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
