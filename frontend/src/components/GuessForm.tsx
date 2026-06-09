import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmitGuess?: (text: string) => Promise<unknown>;
}

export function GuessForm({ disabled = false, onSubmitGuess }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = guessText.trim();
    if (trimmed.length === 0) {
      setError("Guess cannot be empty");
      return;
    }

    if (!onSubmitGuess) return;

    try {
      await onSubmitGuess(trimmed);
      setGuessText("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit guess";
      setError(message);
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
          disabled={disabled}
        />
      </label>
      {error ? (
        <p className="form__error" style={{ color: "#dc2626", fontSize: "0.8rem", marginTop: "0.25rem" }}>
          {error}
        </p>
      ) : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
