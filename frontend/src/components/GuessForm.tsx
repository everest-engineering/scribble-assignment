import { useState } from "react";
import type { GuessResponse } from "../services/api";

interface GuessFormProps {
  onSubmit: (text: string) => Promise<GuessResponse | null>;
  disabled?: boolean;
}

export function GuessForm({ onSubmit, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect" | "info" | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guessText.trim()) {
      setFeedback("Guess cannot be empty");
      setFeedbackType("incorrect");
      return;
    }

    try {
      const result = await onSubmit(guessText);

      if (!result) {
        return;
      }

      if (result.result === "correct") {
        setFeedback(result.message);
        setFeedbackType("correct");
        setGuessText("");
      } else if (result.result === "already_correct") {
        setFeedback(result.message);
        setFeedbackType("info");
        setGuessText("");
      } else {
        setFeedback(result.message);
        setFeedbackType("incorrect");
        setGuessText("");
      }
    } catch {
      setFeedback("Failed to submit guess");
      setFeedbackType("incorrect");
    }
  }

  return (
    <div>
      <form className="form" onSubmit={handleSubmit}>
        <label className="form__field">
          <input
            className="form__input"
            value={guessText}
            onChange={(event) => setGuessText(event.target.value)}
            placeholder="Type your guess here..."
            disabled={disabled}
          />
        </label>
        <div className="button-row button-row--compact">
          <button className="button button--primary" type="submit" disabled={disabled}>
            Submit Guess
          </button>
        </div>
      </form>
      {feedback && (
        <p className={`guess-feedback guess-feedback--${feedbackType ?? "info"}`}>{feedback}</p>
      )}
    </div>
  );
}
