import { useState } from "react";

interface GuessFormProps {
  onSubmit?: (text: string) => Promise<void>;
  disabled?: boolean;
  disabledReason?: string;
}

export function GuessForm({ onSubmit, disabled = false, disabledReason }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    const trimmed = guessText.trim();
    if (!trimmed) {
      setLocalError("Guess cannot be empty");
      return;
    }

    if (!onSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setGuessText("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit guess";
      setLocalError(msg);
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
      {localError && (
        <p style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "4px" }}>
          {localError}
        </p>
      )}
      {disabledReason && !localError && (
        <p style={{ color: "#6b7280", fontSize: "0.8rem", marginTop: "4px" }}>
          {disabledReason}
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
