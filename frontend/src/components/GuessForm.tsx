import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit: (guess: string) => Promise<unknown>;
}

export function GuessForm({ disabled = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedGuess = guessText.trim();

    if (!trimmedGuess) {
      setFeedback("Enter a guess before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);
      await onSubmit(trimmedGuess);
      setGuessText("");
    } catch (caughtError) {
      setFeedback(caughtError instanceof Error ? caughtError.message : "Unable to submit guess");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {disabled ? <p className="form__hint">Draw the secret word. Guessing is disabled for the drawer.</p> : null}
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={disabled || isSubmitting}
        />
      </label>
      {feedback ? <p className="form__error">{feedback}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
