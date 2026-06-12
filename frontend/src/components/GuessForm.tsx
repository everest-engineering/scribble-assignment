import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit?: (guess: string) => void | Promise<void>;
}

export function GuessForm({ disabled = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedGuess = guessText.trim();
    if (!trimmedGuess) {
      setError("Guess cannot be empty");
      return;
    }

    if (onSubmit) {
      try {
        setIsSubmitting(true);
        await onSubmit(trimmedGuess);
        setGuessText("");
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Failed to submit guess");
      } finally {
        setIsSubmitting(false);
      }
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
          disabled={disabled || isSubmitting}
        />
      </label>
      {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '8px' }}>{error}</p>}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
