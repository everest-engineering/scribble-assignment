import { useState, type FormEvent } from "react";

interface GuessFormProps {
  hidden?: boolean;
  disabled?: boolean;
  error?: string | null;
  onSubmit?: (guessText: string) => Promise<void> | void;
}

export function GuessForm({
  hidden = false,
  disabled = false,
  error = null,
  onSubmit
}: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedGuess = guessText.trim();

    if (!trimmedGuess) {
      setLocalError("Guess text is required");
      return;
    }

    setLocalError(null);

    try {
      if (onSubmit) {
        await onSubmit(trimmedGuess);
      }
      setGuessText("");
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    }
  }

  if (hidden) {
    return null;
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
      {localError || error ? <p className="form__error">{localError ?? error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
