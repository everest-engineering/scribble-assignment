import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

export function GuessForm() {
  const roomStore = useRoomStore();

  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError(null);

      await roomStore.submitGuess(message);

      setMessage("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to submit guess"
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="guess-form">
      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Enter your guess"
        className="input"
      />

      {error && (
        <p style={{ color: "#dc2626", marginTop: "8px" }}>
          {error}
        </p>
      )}

      <button type="submit" className="button button--primary">
        Submit Guess
      </button>
    </form>
  );
}