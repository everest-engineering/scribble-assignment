import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    try {
      const result = await roomStore.submitGuess(guessText);
      setGuessText("");

      if (result.isCorrect) {
        setFeedback("Correct! You guessed the word!");
      } else {
        setFeedback("Incorrect guess. Try again!");
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to submit guess");
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
          disabled={disabled}
        />
      </label>
      {feedback ? (
        <p
          className="form__error"
          style={{
            backgroundColor: feedback.includes("Correct") ? "#dcfce7" : "#fee2e2",
            color: feedback.includes("Correct") ? "#166534" : "#991b1b"
          }}
        >
          {feedback}
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
