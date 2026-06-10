import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmitGuess?: (text: string) => Promise<void>;
}

export function GuessForm({ disabled = false, onSubmitGuess }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmitGuess || !guessText.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      await onSubmitGuess(guessText.trim());
      setFeedback({ correct: true });
      setGuessText("");
    } catch {
      setFeedback({ correct: false });
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
      {feedback && (
        <p className={`guess-feedback ${feedback.correct ? "guess-feedback--correct" : "guess-feedback--incorrect"}`}>
          {feedback.correct ? "Correct!" : "Incorrect guess, try again!"}
        </p>
      )}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || submitting}>
          {submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
