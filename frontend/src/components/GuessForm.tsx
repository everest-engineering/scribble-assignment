import { useState } from "react";

interface GuessFormProps {
  onSubmit: (guessText: string) => Promise<void>;
  disabled?: boolean;
}

export function GuessForm({ onSubmit, disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!guessText.trim()) {
      setError("Guess cannot be empty");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(guessText);
      setGuessText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setError(message);
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
      {error && <p className="form__error" style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.25rem" }}>{error}</p>}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || submitting}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
