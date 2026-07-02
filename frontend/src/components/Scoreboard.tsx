import { Card } from "./Card";
import { useRoomState } from "../state/roomStore";

interface ScoreboardProps {
  sortByScore?: boolean;
}

export function Scoreboard({ sortByScore = false }: ScoreboardProps) {
  const { room, participantId } = useRoomState();

  const rankedParticipants =
    room && sortByScore
      ? [...room.participants].sort((a, b) => {
          const scoreDelta = (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0);
          if (scoreDelta !== 0) {
            return scoreDelta;
          }

          return a.name.localeCompare(b.name);
        })
      : room?.participants ?? [];

  return (
    <Card title="Scoreboard">
      {!room ? (
        <p className="placeholder-note">Waiting for room data...</p>
      ) : (
        <ul className="scoreboard-list">
          {rankedParticipants.map((participant) => (
            <li
              className={`scoreboard-list__item ${participant.id === participantId ? "scoreboard-list__item--self" : ""}`}
              key={participant.id}
            >
              <span>{participant.name}</span>
              <strong>{room.scores[participant.id] ?? 0}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
