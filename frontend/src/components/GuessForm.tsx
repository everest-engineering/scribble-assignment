import { useState } from "react";
import type { GuessEntry } from "../services/api";

interface GuessFormProps {
  disabled?: boolean;
  onSubmitGuess?: (guess: string) => Promise<{ correct: boolean; message: string; guessEntry: GuessEntry }>;
}

type FeedbackState = { type: "correct" | "wrong" | "rejected"; message: string } | null;

export function GuessForm({ disabled = false, onSubmitGuess }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmitGuess || submitting) return;

    const trimmed = guessText.trim();
    if (!trimmed) {
      setFeedback({ type: "rejected", message: "Guess cannot be empty" });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const result = await onSubmitGuess(trimmed);
      if (result.correct) {
        setFeedback({ type: "correct", message: result.message });
        setGuessText("");
      } else {
        setFeedback({ type: "wrong", message: result.message });
      }
    } catch {
      setFeedback({ type: "rejected", message: "Failed to submit guess. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled = disabled || submitting;

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={isDisabled}
        />
      </label>
      {feedback && (
        <p
          style={{
            fontSize: "0.875rem",
            marginTop: "4px",
            color: feedback.type === "correct" ? "#16a34a" : feedback.type === "wrong" ? "#dc2626" : "#ca8a04"
          }}
        >
          {feedback.message}
        </p>
      )}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={isDisabled}>
          {submitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
