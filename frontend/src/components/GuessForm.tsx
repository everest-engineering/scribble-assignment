import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const [guessText, setGuessText] = useState("");
  const roomStore = useRoomStore();
  const { guessFeedback, guessError } = useRoomState();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) return;

    const result = await roomStore.submitGuess(trimmed);

    if (result?.correct) {
      setGuessText("");
    } else if (result?.alreadyGuessed) {
      setGuessText("");
    }
  }

  function handleDismiss() {
    roomStore.setGuessFeedback(null);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
        />
      </label>

      {guessError && (
        <div className="form__feedback form__feedback--error">
          <span>{guessError}</span>
          <button type="button" className="form__dismiss" onClick={handleDismiss}>&times;</button>
        </div>
      )}

      {guessFeedback?.type === "correct" && (
        <div className="form__feedback form__feedback--success">
          {guessFeedback.message}
        </div>
      )}

      {guessFeedback?.type === "incorrect" && (
        <div className="form__feedback form__feedback--warning">
          {guessFeedback.message}
        </div>
      )}

      {guessFeedback?.type === "already-guessed" && (
        <div className="form__feedback form__feedback--info">
          {guessFeedback.message}
        </div>
      )}

      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={!guessText.trim()}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
