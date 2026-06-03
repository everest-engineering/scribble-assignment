import { useState } from "react";

interface GuessFormProps {
  isDrawer: boolean;
  disabled: boolean;
  onSubmit: (text: string) => void;
}

// T038: Wired guess form — hides entirely for drawer, disables when correct/finished.
export function GuessForm({ isDrawer, disabled, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");

  if (isDrawer) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
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
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
