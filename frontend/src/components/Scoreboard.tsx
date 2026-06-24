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
        <div className="placeholder-block" style={{ backgroundColor: "#f9fafb" }}>
          {participants.map((participant) => (
            <div className="placeholder-row" key={participant.id}>
              <span>
                {participant.name}
                {participant.role === "drawer" ? " (drawer)" : ""}
              </span>
              <strong>{participant.score}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
