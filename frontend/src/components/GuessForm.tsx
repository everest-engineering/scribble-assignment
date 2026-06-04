import { useState } from "react";

interface GuessFormProps {
  onSubmit: (text: string) => Promise<void>;
  error?: string | null;
  disabled?: boolean;
}

export function GuessForm({ onSubmit, error, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    const trimmed = guessText.trim();
    if (!trimmed) {
      setLocalError("Guess cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setGuessText("");
    } catch (caughtError) {
      setLocalError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    } finally {
      setSubmitting(false);
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
          disabled={disabled || submitting}
        />
      </label>
      {displayError ? <p className="form__error">{displayError}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || submitting}>
          {submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
