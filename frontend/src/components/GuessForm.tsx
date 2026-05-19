import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  error?: string | null;
  hint?: string | null;
  isSubmitting?: boolean;
  onSubmitGuess: (guessText: string) => Promise<void> | void;
}

export function GuessForm({
  disabled = false,
  error = null,
  hint = null,
  isSubmitting = false,
  onSubmitGuess
}: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedGuess = guessText.trim();

    if (!normalizedGuess) {
      setLocalError("Enter a guess");
      return;
    }

    setLocalError(null);

    try {
      await onSubmitGuess(normalizedGuess);
      setGuessText("");
    } catch {
      // Request errors are surfaced through the shared room state.
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            if (localError) {
              setLocalError(null);
            }
          }}
          placeholder="Type your guess here..."
          disabled={disabled}
        />
      </label>
      {localError ? <p>{localError}</p> : null}
      {!localError && error ? <p>{error}</p> : null}
      {!localError && !error && hint ? <p>{hint}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          {isSubmitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
