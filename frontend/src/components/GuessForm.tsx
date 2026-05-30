import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit: (guess: string) => Promise<void> | void;
}

export function GuessForm({ disabled = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedGuess = guessText.trim();

    if (!normalizedGuess) {
      setError("Guess is required.");
      return;
    }

    try {
      setError(null);
      await onSubmit(normalizedGuess);
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
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
      {error ? <p className="form__error">{error}</p> : null}
    </form>
  );
}
