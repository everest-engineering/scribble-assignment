import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  error?: string | null;
  isCorrect?: boolean;
  onSubmit: (text: string) => void;
}

export function GuessForm({ disabled = false, error, isCorrect = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const trimmed = guessText.trim();

    if (!trimmed) {
      setLocalError("Guess cannot be empty");
      return;
    }

    if (trimmed.length > 50) {
      setLocalError("Guess must be 50 characters or fewer");
      return;
    }

    onSubmit(guessText);
    setGuessText("");
  }

  if (isCorrect) {
    return (
      <div className="form">
        <p style={{ color: "green", fontWeight: "bold" }}>You guessed correctly!</p>
      </div>
    );
  }

  const displayError = localError ?? error;

  return (
    <form className="form" onSubmit={handleSubmit}>
      {displayError && (
        <p className="form__error" style={{ color: "red", fontSize: "0.875rem", marginBottom: "8px" }}>
          {displayError}
        </p>
      )}
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
  );
}
