import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmitGuess: (text: string) => Promise<void>;
}

export function GuessForm({ disabled = false, onSubmitGuess }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();

    if (!trimmed) {
      setError("Guess cannot be empty");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmitGuess(trimmed);
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    } finally {
      setSubmitting(false);
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
          disabled={disabled || submitting}
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || submitting}>
          {submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
