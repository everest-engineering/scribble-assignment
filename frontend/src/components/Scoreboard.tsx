import type { Participant } from "../services/api";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  if (participants.length === 0) {
    return <p>Waiting for players...</p>;
  }

  return (
    <ul className="scoreboard-list">
      {participants.map((participant) => (
        <li key={participant.id} className="scoreboard-list__item">
          <span>{participant.name}</span>
          <span className="scoreboard-list__score">{participant.score}</span>
        </li>
      ))}
    </ul>
  );
}
