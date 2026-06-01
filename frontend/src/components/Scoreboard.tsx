import { Card } from "./Card";
import type { ParticipantView } from "../services/api";

interface ScoreboardProps {
  participants: ParticipantView[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  return (
    <Card title="Scoreboard">
      {participants.length === 0 ? (
        <p>Waiting for players...</p>
      ) : (
        <ul className="player-list">
          {participants.map((participant) => (
            <li key={participant.id}>
              <span>
                {participant.name}
                {participant.isHost ? " (Host)" : ""}
                {participant.isDrawer ? " (Drawer)" : ""}
              </span>
              <strong>{participant.score}</strong>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
