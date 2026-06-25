import { useState, type FormEvent } from "react";

interface GuessFormProps {
  disabled?: boolean;
  disabledReason?: string;
  onSubmit: (guess: string) => Promise<void>;
}

export function GuessForm({ disabled = false, disabledReason, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedGuess = guessText.trim();

    if (!trimmedGuess) {
      setError("Guess is required");
      return;
    }

    try {
      setError(null);
      await onSubmit(trimmedGuess);
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
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
      {disabledReason ? <p className="form__hint">{disabledReason}</p> : null}
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
