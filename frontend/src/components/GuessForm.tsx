import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit: (guessText: string) => Promise<unknown>;
}

export function GuessForm({ disabled = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedGuess = guessText.trim();
    if (!trimmedGuess) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(trimmedGuess);
      setGuessText("");
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
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={disabled || isSubmitting}
        />
      </label>
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Guess"}
        </button>
      </div>
    </form>
  );
}
