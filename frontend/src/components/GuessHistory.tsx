import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

export function GuessHistory() {
  const { room } = useRoomState();
  const guesses = room?.guesses ?? [];

  return (
    <Card title="Guess History">
      {guesses.length === 0 ? (
        <p className="guess-history__empty">No guesses yet.</p>
      ) : (
        <ul className="guess-history">
          {guesses.map((guess) => (
            <li
              key={guess.id}
              className={
                guess.isCorrect ? "guess-history__item guess-history__item--correct" : "guess-history__item"
              }
            >
              <span className="guess-history__name">{guess.participantName}</span>
              <span className="guess-history__text">{guess.text}</span>
              <span className="guess-history__result">
                {guess.isCorrect ? "Correct" : "Incorrect"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
