import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit: (guess: string) => Promise<void>;
  error: string | null;
}

export function GuessForm({ disabled = false, onSubmit, error }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || guessText.trim().length === 0) return;
    await onSubmit(guessText);
    setGuessText("");
  }

  return (
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
      {error && <p style={{ color: "red", fontSize: "0.875rem", marginTop: "4px" }}>{error}</p>}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
