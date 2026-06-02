import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit: (text: string) => Promise<void>;
}

export function GuessForm({ disabled = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Guess cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Submission failed");
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
