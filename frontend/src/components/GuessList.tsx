import { useRoomState } from "../state/roomStore";

export function GuessList() {
  const { guesses } = useRoomState();

  if (!guesses || guesses.length === 0) {
    return <div className="placeholder-block">No guesses yet.</div>;
  }

  const sorted = [...guesses].sort(
    (a: any, b: any) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <ul className="guess-list">
      {sorted.map((g: any, idx: number) => (
        <li
          key={`${g.playerId}-${g.timestamp}-${idx}`}
          className="guess-list__item"
        >
          <div className="guess-list__row">
            <span className="guess-list__text">{g.textTrimmed ?? g.text}</span>
            {g.isCorrect ? (
              <strong className="guess-list__correct">✓</strong>
            ) : null}
          </div>
          <div className="guess-list__meta">
            {new Date(g.timestamp).toLocaleTimeString()}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default GuessList;
