import { useState } from "react";
import type { RoomSnapshot } from "../services/api";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  isDrawer: boolean;
  room: RoomSnapshot;
  participantId: string;
}

export function GuessForm({ isDrawer, room, participantId }: GuessFormProps) {
  const store = useRoomStore();
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);

  if (isDrawer) return null;

  const alreadyCorrect = room.guesses.some(
    (g) => g.participantId === participantId && g.correct
  );

  if (alreadyCorrect || result === "correct") {
    return <p style={{ color: "#16a34a", fontWeight: 600 }}>You already guessed correctly!</p>;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) {
      setError("Guess cannot be empty");
      return;
    }
    setError(null);
    try {
      const guess = await store.submitGuess(guessText);
      setResult(guess.correct ? "correct" : "incorrect");
      setGuessText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit guess");
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(e) => setGuessText(e.target.value)}
          placeholder="Type your guess here..."
        />
      </label>
      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.25rem" }}>{error}</p>}
      {result === "incorrect" && (
        <p style={{ color: "#dc2626", fontSize: "0.875rem", marginTop: "0.25rem" }}>Incorrect — try again!</p>
      )}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit">
          Submit Guess
        </button>
      </div>
    </form>
  );
}
