import { useState } from "react";
import { api } from "../services/api";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  roomCode: string;
  participantId: string;
}

export function GuessForm({ roomCode, participantId }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guessText.trim()) {
      setError("Guess cannot be empty");
      return;
    }

    try {
      setError(null);
      const result = await api.submitGuess(roomCode, participantId, guessText);
      roomStore.setRoomSnapshot(result.room);
      setGuessText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit guess");
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
        />
      </label>
      {error ? <p className="form__error">{error}</p> : null}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit">
          Submit Guess
        </button>
      </div>
    </form>
  );
}
