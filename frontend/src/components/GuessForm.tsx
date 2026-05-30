import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmitGuess: (guessText: string) => Promise<void>;
}

export function GuessForm({ disabled = false, onSubmitGuess }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = guessText.trim();

    if (!trimmed) {
      setError("Guess is required");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmitGuess(trimmed);
      setGuessText("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
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
            if (error) {
              setError(null);
            }
          }}
          placeholder="Type your guess here..."
          disabled={disabled || isSubmitting}
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={disabled || isSubmitting}
        >
          Submit Guess
        </button>
      </div>
    </form>
  );
}
