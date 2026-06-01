import { useState } from "react";

interface GuessFormProps {
  onSubmit: (text: string) => void;
  feedback: { isCorrect: boolean } | null;
}

export function GuessForm({ onSubmit, feedback }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={feedback?.isCorrect === true}
        />
      </label>
      {feedback ? (
        <div style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, background: feedback.isCorrect ? '#d1fae5' : '#fee2e2', color: feedback.isCorrect ? '#065f46' : '#991b1b' }}>
          {feedback.isCorrect ? "Correct! 🎉" : "Incorrect"}
        </div>
      ) : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={feedback?.isCorrect === true}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
