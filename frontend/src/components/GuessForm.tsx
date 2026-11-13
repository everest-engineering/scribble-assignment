import { useState } from "react";

interface GuessFormProps {
  onSubmitGuess: (guessText: string) => Promise<void>;
  disabled?: boolean;
}

export function GuessForm({ onSubmitGuess, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedGuess = guessText.trim();
    if (!trimmedGuess) {
      setError("Guess text must not be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitGuess(trimmedGuess);
      setGuessText("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit guess");
    } finally {
      setIsSubmitting(false);
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
            if (error) setError(null);
          }}
          placeholder="Type your guess here..."
          disabled={disabled || isSubmitting}
        />
      </label>
      {error && <div className="form__error">{error}</div>}
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={disabled || isSubmitting || !guessText.trim()}
        >
          {isSubmitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
