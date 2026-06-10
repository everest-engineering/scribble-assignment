import { useState } from "react";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const [guessText, setGuessText] = useState("");
  const roomStore = useRoomStore();
  const { isLoading, error } = useRoomState();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await roomStore.submitGuess(guessText);
    if (result) {
      setGuessText("");
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
          disabled={isLoading}
        />
      </label>
      {error && (
        <p role="alert" style={{ color: "#dc2626", fontSize: "0.875rem", margin: "4px 0 0" }}>
          {error}
        </p>
      )}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={isLoading}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
