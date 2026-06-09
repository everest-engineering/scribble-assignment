import { useState } from "react";

interface GuessFormProps {
  onSubmit: (text: string) => void | Promise<void>;
  disabled?: boolean;
  feedback?: string | null;
}

export function GuessForm({ onSubmit, disabled = false, feedback }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guessText.trim()) return;
    await onSubmit(guessText.trim());
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
      {feedback ? (
        <p className="form__feedback" style={{ marginTop: "8px", fontSize: "14px", fontWeight: 500 }}>
          {feedback}
        </p>
      ) : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled || !guessText.trim()}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
