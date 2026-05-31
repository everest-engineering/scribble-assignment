import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) {
      setSubmitError("Guess cannot be empty");
      return;
    }

    try {
      setSubmitError(null);
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : "Submission failed");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {submitError && (
        <div className="form__error" style={{ marginBottom: "12px" }}>
          {submitError}
        </div>
      )}
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            if (submitError) setSubmitError(null);
          }}
          placeholder={disabled ? "You are the drawer" : "Type your guess here..."}
          disabled={disabled}
        />
      </label>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || !guessText.trim()}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
