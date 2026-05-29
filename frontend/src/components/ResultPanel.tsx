import { useRoomState } from "../state/roomStore";

export function ResultPanel() {
  const { room } = useRoomState();

  if (!room) {
    return null;
  }

  return (
    <div>
      <h3 style={{ marginBottom: "12px" }}>Guess History</h3>

      {room.guesses.length === 0 ? (
        <p>No guesses yet.</p>
      ) : (
        <ul className="player-list">
          {room.guesses.map((guess) => (
            <li key={guess.id}>
              <span>
                {guess.playerName}: {guess.message}
              </span>

              <span>
                {guess.isCorrect ? "✅" : "❌"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}