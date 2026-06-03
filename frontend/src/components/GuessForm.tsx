import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit?: (text: string) => Promise<void> | void;
}

export function GuessForm({ disabled = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    const trimmed = guessText.trim();
    if (trimmed.length === 0) {
      setError("Enter a guess");
      return;
    }

    setError(null);
    if (!onSubmit) {
      setGuessText("");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(trimmed);
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputsDisabled = disabled || isSubmitting;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={inputsDisabled}
        />
      </label>
      <div aria-live="polite">
        {error ? <p className="form__error">{error}</p> : null}
      </div>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={inputsDisabled}>
          {isSubmitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
